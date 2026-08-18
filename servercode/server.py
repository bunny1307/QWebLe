from __future__ import annotations

import hashlib
import hmac
import io
import json
import time
import zipfile
import os
import secrets
import uuid
import subprocess
import sys
import base64
import urllib.request
import urllib.error

from datetime import datetime, timezone
from functools import wraps
from pathlib import Path
from typing import Any, Callable

import mysql.connector
from dotenv import load_dotenv
from flask import (
    Flask,
    abort,
    jsonify,
    redirect,
    render_template,
    request,
    send_file,
    session,
    url_for,
)
from PIL import Image, UnidentifiedImageError
from werkzeug.exceptions import HTTPException
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parent
WEB_DIR = BASE_DIR / "web"
MEDIA_DIR = BASE_DIR / "media"
BACKUP_DIR = BASE_DIR / "backups"

MEDIA_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(BASE_DIR.parent / ".env", override=True)


# ============================================================
# DATA EXTRACTOR
# ============================================================

DATA_EXTRACTOR = (
    BASE_DIR.parent / "ui" / "public" / "data" / "dataExtractor.py"
).resolve()


def run_data_extractor():
    """
    Run dataExtractor.py after a successful database commit.

    sys.executable is used so the extractor runs with the
    same Python environment that is running this Flask server.
    """

    if not DATA_EXTRACTOR.is_file():
        app.logger.error(
            "dataExtractor.py not found at: %s",
            DATA_EXTRACTOR,
        )
        return

    try:
        app.logger.info(
            "Running dataExtractor.py: %s",
            DATA_EXTRACTOR,
        )

        result = subprocess.run(
            [
                sys.executable,
                str(DATA_EXTRACTOR),
            ],
            cwd=str(DATA_EXTRACTOR.parent),
            capture_output=True,
            text=True,
            timeout=60,
        )

        if result.returncode == 0:
            app.logger.info(
                "dataExtractor.py completed successfully."
            )

            if result.stdout.strip():
                app.logger.info(
                    "dataExtractor.py output:\n%s",
                    result.stdout,
                )

        else:
            app.logger.error(
                "dataExtractor.py failed.\n"
                "Return code: %s\n"
                "STDOUT:\n%s\n"
                "STDERR:\n%s",
                result.returncode,
                result.stdout,
                result.stderr,
            )

    except subprocess.TimeoutExpired:
        app.logger.error(
            "dataExtractor.py timed out after 60 seconds."
        )

    except Exception:
        app.logger.exception(
            "Failed to execute dataExtractor.py."
        )


# ============================================================
# FLASK
# ============================================================

app = Flask(
    __name__,
    template_folder=str(WEB_DIR),
    static_folder=str(WEB_DIR),
    static_url_path="/static",
)

app.config.update(
    SECRET_KEY=os.environ.get(
        "FLASK_SECRET_KEY",
        secrets.token_hex(32),
    ),
    SESSION_COOKIE_HTTPONLY=True,
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get(
        "COOKIE_SECURE",
        "false",
    ).lower() == "true",
    MAX_CONTENT_LENGTH=int(
        os.environ.get("MAX_REQUEST_MB", "50")
    ) * 1024 * 1024,
)


# ============================================================
# MYSQL CONFIG
# ============================================================

MYSQL_CONFIG = {
    "host": os.environ.get(
        "MYSQL_HOST",
        "127.0.0.1",
    ),
    "port": int(
        os.environ.get(
            "MYSQL_PORT",
            "3306",
        )
    ),
    "database": os.environ.get(
        "MYSQL_DATABASE",
        "qsr",
    ),
    "user": os.environ.get(
        "MYSQL_USER",
        "root",
    ),
    "password": os.environ.get(
        "MYSQL_PASSWORD",
        "",
    ),
}


# ============================================================
# ADMIN CONFIG
# ============================================================

ADMIN_USERNAME = os.environ.get(
    "ADMIN_USERNAME",
    "admin",
)

ADMIN_PASSWORD_HASH = os.environ.get(
    "ADMIN_PASSWORD_HASH",
    "",
)


# ============================================================
# OTHER CONFIG
# ============================================================

ALLOWED_IMAGE_EXTENSIONS = {
    "png",
    "jpg",
    "jpeg",
    "webp",
}

ALLOWED_IMAGE_FORMATS = {
    "PNG",
    "JPEG",
    "WEBP",
}

LOGIN_FAILS: dict[str, list[float]] = {}

LOGIN_WINDOW_SECONDS = 300
LOGIN_MAX_ATTEMPTS = 5

TAX_PERCENTAGE = float(
    os.environ.get(
        "TAX_PERCENTAGE",
        "5",
    )
)


# ============================================================
# RAZORPAY CONFIG
# ============================================================

RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET", "")
# ============================================================
# DATABASE
# ============================================================

def db_connect():
    return mysql.connector.connect(**MYSQL_CONFIG)


def ensure_lite_order_schema(conn):
    """Ensure OrderPad Lite kitchen status and timestamp columns exist."""

    cur = conn.cursor()

    try:
        # --------------------------------------------------------
        # kitchen_status
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'kitchen_status'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN kitchen_status VARCHAR(30)
                NOT NULL DEFAULT 'NOT_SENT'
                AFTER order_status
                """
            )

        # --------------------------------------------------------
        # sent_to_kitchen
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'sent_to_kitchen'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN sent_to_kitchen BOOLEAN
                NOT NULL DEFAULT FALSE
                AFTER kitchen_status
                """
            )

        # --------------------------------------------------------
        # sent_at
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'sent_at'
            """
            ,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN sent_at DATETIME NULL
                AFTER sent_to_kitchen
                """
            )

        # --------------------------------------------------------
        # preparing_at
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'preparing_at'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN preparing_at DATETIME NULL
                AFTER sent_at
                """
            )

        # --------------------------------------------------------
        # ready_at
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'ready_at'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN ready_at DATETIME NULL
                AFTER preparing_at
                """
            )

        # --------------------------------------------------------
        # delivered_at
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'delivered_at'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN delivered_at DATETIME NULL
                AFTER ready_at
                """
            )

        # --------------------------------------------------------
        # razorpay_order_id (for payment reconciliation)
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'razorpay_order_id'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN razorpay_order_id VARCHAR(64) NULL
                AFTER total_minor
                """
            )

        # --------------------------------------------------------
        # razorpay_payment_id (for payment reconciliation)
        # --------------------------------------------------------

        cur.execute(
            """
            SELECT COUNT(*)
            FROM information_schema.columns
            WHERE table_schema = %s
              AND table_name = 'orders'
              AND column_name = 'razorpay_payment_id'
            """,
            (MYSQL_CONFIG["database"],),
        )

        if int(cur.fetchone()[0]) == 0:
            cur.execute(
                """
                ALTER TABLE orders
                ADD COLUMN razorpay_payment_id VARCHAR(64) NULL
                AFTER razorpay_order_id
                """
            )

        conn.commit()

    finally:
        cur.close()


# Run schema migration once at startup
try:
    _startup_conn = db_connect()
    ensure_lite_order_schema(_startup_conn)
    _startup_conn.close()
    print("[STARTUP] Schema migration check completed.")
except Exception as _startup_err:
    print(f"[STARTUP] Schema migration warning: {_startup_err}")


# ============================================================
# GENERAL HELPERS
# ============================================================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def json_error(
    message: str,
    status: int = 400,
    code: str = "BAD_REQUEST",
):
    return (
        jsonify(
            {
                "ok": False,
                "error": {
                    "code": code,
                    "message": message,
                },
            }
        ),
        status,
    )


def require_auth(fn):
    @wraps(fn)
    def wrapped(*args, **kwargs):
        if not session.get("admin_authenticated"):

            if request.path.startswith("/api/"):
                return json_error(
                    "Authentication required.",
                    401,
                    "UNAUTHORIZED",
                )

            return redirect(
                url_for(
                    "login",
                    next=request.path,
                )
            )

        return fn(*args, **kwargs)

    return wrapped


def require_csrf() -> None:
    token = session.get("csrf_token")
    supplied = request.headers.get("X-CSRF-Token")

    if (
        not token
        or not supplied
        or not secrets.compare_digest(
            token,
            supplied,
        )
    ):
        abort(403)


# ============================================================
# AUDIT
# ============================================================

def audit(
    cur,
    actor: str,
    action: str,
    entity_type: str,
    entity_id: str | None,
    before: Any,
    after: Any,
):
    cur.execute(
        """
        INSERT INTO audit_logs
        (
            actor,
            action,
            entity_type,
            entity_id,
            before_json,
            after_json
        )
        VALUES (%s, %s, %s, %s, %s, %s)
        """,
        (
            actor,
            action,
            entity_type,
            entity_id,
            json.dumps(
                before,
                ensure_ascii=False,
                default=str,
            )
            if before is not None
            else None,
            json.dumps(
                after,
                ensure_ascii=False,
                default=str,
            )
            if after is not None
            else None,
        ),
    )


# ============================================================
# DATABASE QUERY HELPERS
# ============================================================

def fetch_one(
    cur,
    query: str,
    params=(),
):
    cur.execute(query, params)
    return cur.fetchone()


def fetch_all(
    cur,
    query: str,
    params=(),
):
    cur.execute(query, params)
    return cur.fetchall()


def row_to_dict(
    row,
    columns,
):
    return {
        columns[i]: row[i]
        for i in range(len(columns))
    }


# ============================================================
# MONEY
# ============================================================

def money_to_minor(value: Any) -> float:

    if isinstance(value, bool):
        raise ValueError("Invalid price.")

    try:
        val = float(value)
        if val < 0:
            raise ValueError
        return round(val, 2)

    except (
        ValueError,
        TypeError,
    ):
        raise ValueError(
            "Price must be a non-negative number."
        )


def minor_to_major(
    value: Any,
) -> str:
    return f"{float(value):.2f}"


# ============================================================
# STRING VALIDATION
# ============================================================

def require_nonempty_string(
    value: Any,
    field: str,
    max_len: int,
) -> str:

    if not isinstance(value, str):
        raise ValueError(
            f"{field} must be text."
        )

    value = value.strip()

    if not value:
        raise ValueError(
            f"{field} is required."
        )

    if len(value) > max_len:
        raise ValueError(
            f"{field} is too long."
        )

    return value


def optional_string(
    value: Any,
    field: str,
    max_len: int,
) -> str | None:

    if value is None:
        return None

    if not isinstance(value, str):
        raise ValueError(
            f"{field} must be text."
        )

    value = value.strip()

    if not value:
        return None

    if len(value) > max_len:
        raise ValueError(
            f"{field} is too long."
        )

    return value


# ============================================================
# UNIT
# ============================================================

def get_single_unit(cur):

    row = fetch_one(
        cur,
        """
        SELECT
            id,
            name,
            phone,
            email,
            address,
            logo_path,
            description,
            active,
            currency_code,
            currency_symbol,
            created_at,
            updated_at
        FROM units
        ORDER BY created_at
        LIMIT 1
        """,
    )

    if not row:
        return None

    cols = [
        "id",
        "name",
        "phone",
        "email",
        "address",
        "logo_path",
        "description",
        "active",
        "currency_code",
        "currency_symbol",
        "created_at",
        "updated_at",
    ]

    data = row_to_dict(
        row,
        cols,
    )

    data["price_display_example"] = (
        f"{data['currency_symbol']}100.00"
    )

    return data


# ============================================================
# CATEGORY
# ============================================================

def get_category(
    cur,
    category_id: str,
):

    row = fetch_one(
        cur,
        """
        SELECT
            id,
            name,
            description,
            image_path,
            display_order,
            active,
            created_at,
            updated_at
        FROM categories
        WHERE id=%s
        """,
        (category_id,),
    )

    if not row:
        return None

    return row_to_dict(
        row,
        [
            "id",
            "name",
            "description",
            "image_path",
            "display_order",
            "active",
            "created_at",
            "updated_at",
        ],
    )


# ============================================================
# ITEM
# ============================================================

def get_item(
    cur,
    item_id: str,
):

    row = fetch_one(
        cur,
        """
        SELECT
            id,
            category_id,
            name,
            description,
            price,
            image_path,
            is_veg,
            available,
            active,
            display_order,
            created_at,
            updated_at
        FROM items
        WHERE id=%s
        """,
        (item_id,),
    )

    if not row:
        return None

    d = row_to_dict(
        row,
        [
            "id",
            "category_id",
            "name",
            "description",
            "price",
            "image_path",
            "is_veg",
            "available",
            "active",
            "display_order",
            "created_at",
            "updated_at",
        ],
    )

    d["price"] = minor_to_major(d.pop("price"))

    return d


# ============================================================
# AUDIT ACTOR
# ============================================================

def audit_actor() -> str:
    return str(
        session.get(
            "admin_username",
            "admin",
        )
    )


# ============================================================
# API ERROR HANDLER
# ============================================================

def api_handler(fn):

    @wraps(fn)
    def wrapped(*args, **kwargs):

        try:
            return fn(*args, **kwargs)

        except HTTPException:
            raise

        except mysql.connector.Error:
            app.logger.exception(
                "Database error"
            )
            try:
                import traceback
                with open("C:/Users/bedha/.gemini/antigravity/brain/7917e616-8d47-4cab-aa51-bee09f6b193f/error_traceback.txt", "w", encoding="utf-8") as f:
                    traceback.print_exc(file=f)
            except Exception:
                pass

            return json_error(
                "Database operation failed.",
                500,
                "DATABASE_ERROR",
            )

        except ValueError as exc:
            return json_error(
                str(exc),
                400,
                "VALIDATION_ERROR",
            )

        except Exception:
            app.logger.exception(
                "Unhandled application error"
            )
            try:
                import traceback
                with open("C:/Users/bedha/.gemini/antigravity/brain/7917e616-8d47-4cab-aa51-bee09f6b193f/error_traceback.txt", "w", encoding="utf-8") as f:
                    traceback.print_exc(file=f)
            except Exception:
                pass

            return json_error(
                "Unexpected server error.",
                500,
                "INTERNAL_ERROR",
            )

    return wrapped


# ============================================================
# SECURITY HEADERS
# ============================================================

@app.after_request
def security_headers(response):

    response.headers[
        "X-Content-Type-Options"
    ] = "nosniff"

    response.headers[
        "X-Frame-Options"
    ] = "DENY"

    response.headers[
        "Referrer-Policy"
    ] = "no-referrer"

    response.headers[
        "Permissions-Policy"
    ] = (
        "camera=(), "
        "microphone=(), "
        "geolocation=()"
    )

    response.headers[
        "Content-Security-Policy"
    ] = (
        "default-src 'self'; "
        "script-src 'self' https://checkout.razorpay.com; "
        "style-src 'self' https://checkout.razorpay.com; "
        "img-src 'self' data: blob: https://checkout.razorpay.com; "
        "connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com; "
        "font-src 'self'; "
        "frame-src https://api.razorpay.com; "
        "object-src 'none'; "
        "base-uri 'self'; "
        "form-action 'self'; "
        "frame-ancestors 'none'"
    )

    return response


# ============================================================
# FILE SIZE
# ============================================================

@app.errorhandler(413)
def too_large(_):

    if request.path.startswith("/api/"):
        return json_error(
            "Uploaded file is too large.",
            413,
            "FILE_TOO_LARGE",
        )

    return (
        "File too large.",
        413,
    )


# ============================================================
# MEDIA
# ============================================================

@app.get("/media/<path:filename>")
def media_file(filename: str):

    safe = Path(filename).name

    if (
        safe != filename
        or safe.startswith(".")
    ):
        abort(404)

    return send_file(
        MEDIA_DIR / safe
    )


# ============================================================
# LOGIN
# ============================================================

@app.route(
    "/login",
    methods=["GET", "POST"],
)
def login():

    if request.method == "GET":
        return render_template(
            "admin.html",
            page="login",
        )

    data = request.form

    username = (
        data.get("username") or ""
    ).strip()

    password = (
        data.get("password") or ""
    )

    ip = (
        request.remote_addr
        or "unknown"
    )

    now = time.monotonic()

    attempts = [
        t
        for t in LOGIN_FAILS.get(ip, [])
        if now - t < LOGIN_WINDOW_SECONDS
    ]

    LOGIN_FAILS[ip] = attempts

    if len(attempts) >= LOGIN_MAX_ATTEMPTS:

        return (
            render_template(
                "admin.html",
                page="login",
                login_error=(
                    "Too many failed attempts. "
                    "Try again later."
                ),
            ),
            429,
        )

    if not ADMIN_PASSWORD_HASH:

        return (
            "Server administrator password hash is not configured.",
            500,
        )

    current_admin_user = os.environ.get("ADMIN_USERNAME", "admin").strip().lower()
    current_admin_hash = os.environ.get("ADMIN_PASSWORD_HASH", ADMIN_PASSWORD_HASH).strip()

    if (
        username.lower() != current_admin_user
        or not check_password_hash(
            current_admin_hash,
            password,
        )
    ):

        attempts.append(now)
        LOGIN_FAILS[ip] = attempts

        return (
            render_template(
                "admin.html",
                page="login",
                login_error="Invalid credentials.",
            ),
            401,
        )

    LOGIN_FAILS.pop(
        ip,
        None,
    )

    session.clear()

    session["admin_authenticated"] = True
    session["admin_username"] = username
    session["csrf_token"] = secrets.token_urlsafe(32)

    target = (
        request.args.get("next")
        or url_for("admin_page")
    )

    if (
        not target.startswith("/")
        or target.startswith("//")
    ):
        target = url_for("admin_page")

    return redirect(target)


# ============================================================
# LOGOUT
# ============================================================

@app.post("/logout")
@require_auth
@api_handler
def logout():

    require_csrf()

    session.clear()

    return jsonify({
        "ok": True
    })


# ============================================================
# ADMIN PAGE
# ============================================================

@app.get("/admin")
@require_auth
def admin_page():

    return render_template(
        "admin.html",
        page="admin",
    )
@app.get("/kitchen")
@require_auth
def kitchen_page():
    return render_template(
        "kitchen.html",
        page="kitchen",
    )

# ============================================================
# BOOTSTRAP
# ============================================================

@app.get("/api/bootstrap")
@require_auth
@api_handler
def bootstrap():

    conn = db_connect()

    try:

        cur = conn.cursor()

        unit = get_single_unit(cur)

        categories = fetch_all(
            cur,
            """
            SELECT
                id,
                name,
                description,
                image_path,
                display_order,
                active,
                updated_at
            FROM categories
            ORDER BY display_order, name
            """,
        )

        category_cols = [
            "id",
            "name",
            "description",
            "image_path",
            "display_order",
            "active",
            "updated_at",
        ]

        items = fetch_all(
            cur,
            """
            SELECT
                id,
                category_id,
                name,
                description,
                price,
                image_path,
                is_veg,
                available,
                active,
                display_order,
                updated_at
            FROM items
            ORDER BY category_id, display_order, name
            """,
        )

        item_cols = [
            "id",
            "category_id",
            "name",
            "description",
            "price",
            "image_path",
            "is_veg",
            "available",
            "active",
            "display_order",
            "updated_at",
        ]

        cat_list = [
            row_to_dict(
                r,
                category_cols,
            )
            for r in categories
        ]

        item_list = []

        for r in items:

            d = row_to_dict(
                r,
                item_cols,
            )

            d["price"] = minor_to_major(
                d.pop("price")
            )

            item_list.append(d)

        if not session.get("csrf_token"):
            session["csrf_token"] = secrets.token_urlsafe(32)

        return jsonify({
            "ok": True,
            "csrf_token": session["csrf_token"],
            "unit": unit,
            "categories": cat_list,
            "items": item_list,
            "server_time": now_iso(),
        })

    finally:
        conn.close()


# ============================================================
# UPDATE UNIT
# ============================================================

@app.put("/api/unit")
@require_auth
@api_handler
def update_unit():

    require_csrf()

    payload = (
        request.get_json(
            silent=True
        )
        or {}
    )

    conn = db_connect()

    try:

        cur = conn.cursor()

        current = get_single_unit(cur)

        if not current:
            return json_error(
                "Unit record does not exist.",
                404,
                "NOT_FOUND",
            )

        name = require_nonempty_string(
            payload.get("name"),
            "name",
            120,
        )

        phone = optional_string(
            payload.get("phone"),
            "phone",
            40,
        )

        email = optional_string(
            payload.get("email"),
            "email",
            254,
        )

        address = optional_string(
            payload.get("address"),
            "address",
            255,
        )

        description = optional_string(
            payload.get("description"),
            "description",
            2000,
        )

        logo_path = optional_string(
            payload.get("logo_path"),
            "logo_path",
            255,
        )

        currency_code = require_nonempty_string(
            payload.get(
                "currency_code",
                "INR",
            ),
            "currency_code",
            3,
        ).upper()

        currency_symbol = require_nonempty_string(
            payload.get(
                "currency_symbol",
                "₹",
            ),
            "currency_symbol",
            8,
        )

        if len(currency_code) != 3:
            raise ValueError(
                "currency_code must contain exactly 3 characters."
            )

        cur.execute(
            """
            UPDATE units
            SET
                name=%s,
                phone=%s,
                email=%s,
                address=%s,
                logo_path=%s,
                description=%s,
                currency_code=%s,
                currency_symbol=%s
            WHERE id=%s
            """,
            (
                name,
                phone,
                email,
                address,
                logo_path,
                description,
                currency_code,
                currency_symbol,
                current["id"],
            ),
        )

        after = {
            **current,
            "name": name,
            "phone": phone,
            "email": email,
            "address": address,
            "logo_path": logo_path,
            "description": description,
            "currency_code": currency_code,
            "currency_symbol": currency_symbol,
        }

        audit(
            cur,
            audit_actor(),
            "UPDATE",
            "unit",
            current["id"],
            current,
            after,
        )

        conn.commit()

        # IMPORTANT:
        # Only run extractor AFTER successful commit.
        run_data_extractor()

        return jsonify({
            "ok": True
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# CREATE CATEGORY
# ============================================================

@app.post("/api/categories")
@require_auth
@api_handler
def create_category():

    require_csrf()

    payload = (
        request.get_json(
            silent=True
        )
        or {}
    )

    name = require_nonempty_string(
        payload.get("name"),
        "name",
        120,
    )

    description = optional_string(
        payload.get("description"),
        "description",
        500,
    )

    image_path = optional_string(
        payload.get("image_path"),
        "image_path",
        255,
    )

    display_order = int(
        payload.get(
            "display_order",
            0,
        )
    )

    active = bool(
        payload.get(
            "active",
            True,
        )
    )

    if display_order < 0:
        raise ValueError(
            "display_order must be non-negative."
        )

    category_id = str(
        uuid.uuid4()
    )

    conn = db_connect()

    try:

        cur = conn.cursor()

        exists = fetch_one(
            cur,
            """
            SELECT id
            FROM categories
            WHERE LOWER(name)=LOWER(%s)
            """,
            (name,),
        )

        if exists:
            return json_error(
                "A category with this name already exists.",
                409,
                "DUPLICATE",
            )

        cur.execute(
            """
            INSERT INTO categories
            (
                id,
                name,
                description,
                image_path,
                display_order,
                active
            )
            VALUES (%s,%s,%s,%s,%s,%s)
            """,
            (
                category_id,
                name,
                description,
                image_path,
                display_order,
                active,
            ),
        )

        after = get_category(
            cur,
            category_id,
        )

        audit(
            cur,
            audit_actor(),
            "CREATE",
            "category",
            category_id,
            None,
            after,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True,
            "category": after,
        }), 201

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# UPDATE CATEGORY
# ============================================================

@app.put("/api/categories/<category_id>")
@require_auth
@api_handler
def update_category(
    category_id: str,
):

    require_csrf()

    payload = (
        request.get_json(
            silent=True
        )
        or {}
    )

    conn = db_connect()

    try:

        cur = conn.cursor()

        before = get_category(
            cur,
            category_id,
        )

        if not before:
            return json_error(
                "Category not found.",
                404,
                "NOT_FOUND",
            )

        name = require_nonempty_string(
            payload.get("name"),
            "name",
            120,
        )

        description = optional_string(
            payload.get("description"),
            "description",
            500,
        )

        image_path = optional_string(
            payload.get("image_path"),
            "image_path",
            255,
        )

        display_order = int(
            payload.get(
                "display_order",
                before["display_order"],
            )
        )

        active = bool(
            payload.get(
                "active",
                before["active"],
            )
        )

        if display_order < 0:
            raise ValueError(
                "display_order must be non-negative."
            )

        dup = fetch_one(
            cur,
            """
            SELECT id
            FROM categories
            WHERE LOWER(name)=LOWER(%s)
              AND id<>%s
            """,
            (
                name,
                category_id,
            ),
        )

        if dup:
            return json_error(
                "A category with this name already exists.",
                409,
                "DUPLICATE",
            )

        if (
            not active
            and before["active"]
        ):

            active_items = fetch_one(
                cur,
                """
                SELECT COUNT(*)
                FROM items
                WHERE category_id=%s
                  AND active=TRUE
                """,
                (category_id,),
            )[0]

            if active_items > 0:
                return json_error(
                    "Deactivate or move the category's active items before deactivating the category.",
                    409,
                    "CATEGORY_HAS_ACTIVE_ITEMS",
                )

        cur.execute(
            """
            UPDATE categories
            SET
                name=%s,
                description=%s,
                image_path=%s,
                display_order=%s,
                active=%s
            WHERE id=%s
            """,
            (
                name,
                description,
                image_path,
                display_order,
                active,
                category_id,
            ),
        )

        after = get_category(
            cur,
            category_id,
        )

        audit(
            cur,
            audit_actor(),
            "UPDATE",
            "category",
            category_id,
            before,
            after,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True,
            "category": after,
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# DELETE CATEGORY
# ============================================================

@app.delete("/api/categories/<category_id>")
@require_auth
@api_handler
def delete_category(
    category_id: str,
):

    require_csrf()

    conn = db_connect()

    try:

        cur = conn.cursor()

        before = get_category(
            cur,
            category_id,
        )

        if not before:
            return json_error(
                "Category not found.",
                404,
                "NOT_FOUND",
            )

        # Delete all items belonging to this category (both active and inactive)
        cur.execute(
            """
            DELETE FROM items
            WHERE category_id=%s
            """,
            (category_id,),
        )

        cur.execute(
            """
            DELETE FROM categories
            WHERE id=%s
            """,
            (category_id,),
        )

        audit(
            cur,
            audit_actor(),
            "DELETE",
            "category",
            category_id,
            before,
            None,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# CREATE ITEM
# ============================================================

@app.post("/api/items")
@require_auth
@api_handler
def create_item():

    require_csrf()

    payload = (
        request.get_json(
            silent=True
        )
        or {}
    )

    name = require_nonempty_string(
        payload.get("name"),
        "name",
        160,
    )

    category_id = require_nonempty_string(
        payload.get("category_id"),
        "category_id",
        36,
    )

    description = optional_string(
        payload.get("description"),
        "description",
        1000,
    )

    image_path = optional_string(
        payload.get("image_path"),
        "image_path",
        255,
    )

    price_minor = money_to_minor(
        payload.get(
            "price",
            "0",
        )
    )

    is_veg = bool(
        payload.get(
            "is_veg",
            False,
        )
    )

    available = bool(
        payload.get(
            "available",
            True,
        )
    )

    active = bool(
        payload.get(
            "active",
            True,
        )
    )

    display_order = int(
        payload.get(
            "display_order",
            0,
        )
    )

    if display_order < 0:
        raise ValueError(
            "display_order must be non-negative."
        )

    item_id = str(
        uuid.uuid4()
    )

    conn = db_connect()

    try:

        cur = conn.cursor()

        category = fetch_one(
            cur,
            """
            SELECT id, active
            FROM categories
            WHERE id=%s
            """,
            (category_id,),
        )

        if not category:
            return json_error(
                "Category not found.",
                404,
                "CATEGORY_NOT_FOUND",
            )

        if not category[1]:
            return json_error(
                "Cannot add an item to an inactive category.",
                409,
                "CATEGORY_INACTIVE",
            )

        duplicate = fetch_one(
            cur,
            """
            SELECT id
            FROM items
            WHERE category_id=%s
              AND LOWER(name)=LOWER(%s)
            """,
            (
                category_id,
                name,
            ),
        )

        if duplicate:
            return json_error(
                "An item with this name already exists in that category.",
                409,
                "DUPLICATE",
            )

        cur.execute(
            """
            INSERT INTO items
            (
                id,
                category_id,
                name,
                description,
                price,
                image_path,
                is_veg,
                available,
                active,
                display_order
            )
            VALUES
            (
                %s,%s,%s,%s,%s,
                %s,%s,%s,%s,%s
            )
            """,
            (
                item_id,
                category_id,
                name,
                description,
                price_minor,
                image_path,
                is_veg,
                available,
                active,
                display_order,
            ),
        )

        after = get_item(
            cur,
            item_id,
        )

        audit(
            cur,
            audit_actor(),
            "CREATE",
            "item",
            item_id,
            None,
            after,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True,
            "item": after,
        }), 201

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# UPDATE ITEM
# ============================================================

@app.put("/api/items/<item_id>")
@require_auth
@api_handler
def update_item(
    item_id: str,
):

    require_csrf()

    payload = (
        request.get_json(
            silent=True
        )
        or {}
    )

    conn = db_connect()

    try:

        cur = conn.cursor()

        before = get_item(
            cur,
            item_id,
        )

        if not before:
            return json_error(
                "Item not found.",
                404,
                "NOT_FOUND",
            )

        name = require_nonempty_string(
            payload.get("name"),
            "name",
            160,
        )

        category_id = require_nonempty_string(
            payload.get("category_id"),
            "category_id",
            36,
        )

        description = optional_string(
            payload.get("description"),
            "description",
            1000,
        )

        image_path = optional_string(
            payload.get("image_path"),
            "image_path",
            255,
        )

        price_minor = money_to_minor(
            payload.get(
                "price",
                before["price"],
            )
        )

        is_veg = bool(
            payload.get(
                "is_veg",
                before["is_veg"],
            )
        )

        available = bool(
            payload.get(
                "available",
                before["available"],
            )
        )

        active = bool(
            payload.get(
                "active",
                before["active"],
            )
        )

        display_order = int(
            payload.get(
                "display_order",
                before["display_order"],
            )
        )

        if display_order < 0:
            raise ValueError(
                "display_order must be non-negative."
            )

        category = fetch_one(
            cur,
            """
            SELECT id, active
            FROM categories
            WHERE id=%s
            """,
            (category_id,),
        )

        if not category:
            return json_error(
                "Category not found.",
                404,
                "CATEGORY_NOT_FOUND",
            )

        if (
            not category[1]
            and active
        ):
            return json_error(
                "Cannot activate an item inside an inactive category.",
                409,
                "CATEGORY_INACTIVE",
            )

        dup = fetch_one(
            cur,
            """
            SELECT id
            FROM items
            WHERE category_id=%s
              AND LOWER(name)=LOWER(%s)
              AND id<>%s
            """,
            (
                category_id,
                name,
                item_id,
            ),
        )

        if dup:
            return json_error(
                "An item with this name already exists in that category.",
                409,
                "DUPLICATE",
            )

        cur.execute(
            """
            UPDATE items
            SET
                category_id=%s,
                name=%s,
                description=%s,
                price=%s,
                image_path=%s,
                is_veg=%s,
                available=%s,
                active=%s,
                display_order=%s
            WHERE id=%s
            """,
            (
                category_id,
                name,
                description,
                price_minor,
                image_path,
                is_veg,
                available,
                active,
                display_order,
                item_id,
            ),
        )

        after = get_item(
            cur,
            item_id,
        )

        audit(
            cur,
            audit_actor(),
            "UPDATE",
            "item",
            item_id,
            before,
            after,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True,
            "item": after,
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# DEACTIVATE ITEM
# ============================================================

@app.delete("/api/items/<item_id>")
@require_auth
@api_handler
def deactivate_item(
    item_id: str,
):

    require_csrf()

    conn = db_connect()

    try:

        cur = conn.cursor()

        before = get_item(
            cur,
            item_id,
        )

        if not before:
            return json_error(
                "Item not found.",
                404,
                "NOT_FOUND",
            )

        cur.execute(
            """
            UPDATE items
            SET
                active=FALSE,
                available=FALSE
            WHERE id=%s
            """,
            (item_id,),
        )

        after = get_item(
            cur,
            item_id,
        )

        audit(
            cur,
            audit_actor(),
            "DEACTIVATE",
            "item",
            item_id,
            before,
            after,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# DELETE ITEM (HARD DELETE)
# ============================================================

@app.delete("/api/items/<item_id>/delete")
@require_auth
@api_handler
def hard_delete_item(
    item_id: str,
):

    require_csrf()

    conn = db_connect()

    try:

        cur = conn.cursor()

        before = get_item(
            cur,
            item_id,
        )

        if not before:
            return json_error(
                "Item not found.",
                404,
                "NOT_FOUND",
            )

        cur.execute(
            """
            DELETE FROM items
            WHERE id=%s
            """,
            (item_id,),
        )

        audit(
            cur,
            audit_actor(),
            "DELETE",
            "item",
            item_id,
            before,
            None,
        )

        conn.commit()

        run_data_extractor()

        return jsonify({
            "ok": True
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()


# ============================================================
# IMAGE UPLOAD
# ============================================================

@app.post("/api/images")
@require_auth
@api_handler
def upload_image():

    require_csrf()

    uploaded = request.files.get(
        "image"
    )

    if not uploaded or not uploaded.filename:
        return json_error(
            "Image file is required."
        )

    original = secure_filename(
        uploaded.filename
    )

    ext = (
        Path(original)
        .suffix
        .lower()
        .lstrip(".")
    )

    if ext not in ALLOWED_IMAGE_EXTENSIONS:
        return json_error(
            "Allowed image types: PNG, JPG, JPEG, WEBP."
        )

    try:

        data = uploaded.read()

        image = Image.open(
            io.BytesIO(data)
        )

        image.verify()

        image = Image.open(
            io.BytesIO(data)
        ).convert("RGB")

    except (
        UnidentifiedImageError,
        OSError,
    ) as exc:

        raise ValueError(
            f"Invalid image: {exc}"
        )

    output_name = (
        f"{uuid.uuid4()}.webp"
    )

    output_path = (
        MEDIA_DIR / output_name
    )

    image.thumbnail(
        (1600, 1600)
    )

    image.save(
        output_path,
        "WEBP",
        quality=88,
        method=6,
    )

    return jsonify({
        "ok": True,
        "path": f"/media/{output_name}",
    })


# ============================================================
# BACKUP EXPORT
# ============================================================

@app.get("/api/backup/export")
@require_auth
@api_handler
def export_backup():

    buffer = export_backup_internal()

    return send_file(
        buffer,
        mimetype="application/zip",
        as_attachment=True,
        download_name=(
            f"qsr_backup_"
            f"{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip"
        ),
    )


# ============================================================
# BACKUP RESTORE
# ============================================================

@app.post("/api/backup/restore")
@require_auth
@api_handler
def restore_backup():

    require_csrf()

    uploaded = request.files.get(
        "backup"
    )

    if not uploaded:
        return json_error(
            "Backup file is required."
        )

    raw = uploaded.read()

    if not zipfile.is_zipfile(
        io.BytesIO(raw)
    ):
        return json_error(
            "Backup must be a QSR backup ZIP file.",
            400,
            "INVALID_BACKUP",
        )

    with zipfile.ZipFile(
        io.BytesIO(raw),
        "r",
    ) as zf:

        names = zf.namelist()

        if "manifest.json" not in names:
            return json_error(
                "Backup is missing manifest.json.",
                400,
                "INVALID_BACKUP",
            )

        if any(
            Path(n).is_absolute()
            or ".." in Path(n).parts
            for n in names
        ):
            return json_error(
                "Backup contains unsafe paths.",
                400,
                "INVALID_BACKUP",
            )

        try:

            payload = json.loads(
                zf.read(
                    "manifest.json"
                ).decode("utf-8")
            )

        except (
            UnicodeDecodeError,
            json.JSONDecodeError,
        ) as exc:

            raise ValueError(
                f"Invalid backup manifest: {exc}"
            )

        if (
            payload.get("format")
            != "qsr-admin-backup-v2"
        ):
            return json_error(
                "Unsupported backup format.",
                400,
                "INVALID_BACKUP",
            )

        if (
            not isinstance(
                payload.get(
                    "categories"
                ),
                list,
            )
            or not isinstance(
                payload.get(
                    "items"
                ),
                list,
            )
        ):
            return json_error(
                "Backup structure is invalid.",
                400,
                "INVALID_BACKUP",
            )

        for c in payload["categories"]:
            if not isinstance(c, dict):
                return json_error(
                    "Backup contains an invalid category object.",
                    400,
                    "INVALID_BACKUP",
                )

        category_ids = {
            c.get("id")
            for c in payload["categories"]
        }

        if None in category_ids:
            return json_error(
                "Backup contains a category without an ID.",
                400,
                "INVALID_BACKUP",
            )

        for item in payload["items"]:
            if not isinstance(item, dict):
                return json_error(
                    "Backup contains an invalid item object.",
                    400,
                    "INVALID_BACKUP",
                )

            if (
                item.get("category_id")
                not in category_ids
            ):
                return json_error(
                    "Backup contains an item referencing a missing category.",
                    400,
                    "INVALID_BACKUP",
                )

        media_entries = [
            n
            for n in names
            if n.startswith("media/")
            and not n.endswith("/")
        ]

        if len(media_entries) > 500:
            return json_error(
                "Backup contains too many media files.",
                400,
                "INVALID_BACKUP",
            )

        total_media = 0

        for n in media_entries:

            info = zf.getinfo(n)

            total_media += info.file_size

            if info.file_size > 5 * 1024 * 1024:
                return json_error(
                    "A media file in the backup is too large.",
                    400,
                    "INVALID_BACKUP",
                )

            if (
                Path(n)
                .suffix
                .lower()
                .lstrip(".")
                not in ALLOWED_IMAGE_EXTENSIONS
            ):
                return json_error(
                    "Backup contains an unsupported media file.",
                    400,
                    "INVALID_BACKUP",
                )

        if total_media > 50 * 1024 * 1024:
            return json_error(
                "Backup media exceeds the safety limit.",
                400,
                "INVALID_BACKUP",
            )

        conn = db_connect()

        try:

            cur = conn.cursor()

            # --------------------------------------------
            # Pre-restore safety snapshot
            # --------------------------------------------

            stamp = datetime.now().strftime(
                "%Y%m%d_%H%M%S"
            )

            pre_path = (
                BACKUP_DIR
                / f"pre_restore_{stamp}.zip"
            )

            current_export = (
                export_backup_internal()
            )

            pre_path.write_bytes(
                current_export.getvalue()
            )

            # --------------------------------------------
            # Delete current catalog
            # --------------------------------------------

            cur.execute(
                "DELETE FROM items"
            )

            cur.execute(
                "DELETE FROM categories"
            )

            # --------------------------------------------
            # Restore categories
            # --------------------------------------------

            for c in payload["categories"]:

                cid = str(
                    c.get("id")
                )

                uuid.UUID(cid)

                name = require_nonempty_string(
                    c.get("name"),
                    "category.name",
                    120,
                )

                cur.execute(
                    """
                    INSERT INTO categories
                    (
                        id,
                        name,
                        description,
                        image_path,
                        display_order,
                        active
                    )
                    VALUES
                    (%s,%s,%s,%s,%s,%s)
                    """,
                    (
                        cid,
                        name,
                        optional_string(
                            c.get(
                                "description"
                            ),
                            "category.description",
                            500,
                        ),
                        optional_string(
                            c.get(
                                "image_path"
                            ),
                            "category.image_path",
                            255,
                        ),
                        int(
                            c.get(
                                "display_order",
                                0,
                            )
                        ),
                        bool(
                            c.get(
                                "active",
                                True,
                            )
                        ),
                    ),
                )

            # --------------------------------------------
            # Restore items
            # --------------------------------------------

            for i in payload["items"]:

                iid = str(
                    i.get("id")
                )

                uuid.UUID(iid)

                name = require_nonempty_string(
                    i.get("name"),
                    "item.name",
                    160,
                )

                cur.execute(
                    """
                    INSERT INTO items
                    (
                        id,
                        category_id,
                        name,
                        description,
                        price,
                        image_path,
                        is_veg,
                        available,
                        active,
                        display_order
                    )
                    VALUES
                    (
                        %s,%s,%s,%s,%s,
                        %s,%s,%s,%s,%s
                    )
                    """,
                    (
                        iid,
                        i["category_id"],
                        name,
                        optional_string(
                            i.get(
                                "description"
                            ),
                            "item.description",
                            1000,
                        ),
                        money_to_minor(
                            i.get(
                                "price",
                                "0",
                            )
                        ),
                        optional_string(
                            i.get(
                                "image_path"
                            ),
                            "item.image_path",
                            255,
                        ),
                        bool(
                            i.get(
                                "is_veg",
                                False,
                            )
                        ),
                        bool(
                            i.get(
                                "available",
                                True,
                            )
                        ),
                        bool(
                            i.get(
                                "active",
                                True,
                            )
                        ),
                        int(
                            i.get(
                                "display_order",
                                0,
                            )
                        ),
                    ),
                )

            # --------------------------------------------
            # Restore unit
            # --------------------------------------------

            if isinstance(
                payload.get("unit"),
                dict,
            ):

                unit = payload["unit"]

                existing = get_single_unit(
                    cur
                )

                if existing:

                    uname = require_nonempty_string(
                        unit.get("name"),
                        "unit.name",
                        120,
                    )

                    ccode = require_nonempty_string(
                        unit.get(
                            "currency_code",
                            "INR",
                        ),
                        "unit.currency_code",
                        3,
                    ).upper()

                    if len(ccode) != 3:
                        raise ValueError(
                            "currency_code must contain exactly 3 characters."
                        )

                    cur.execute(
                        """
                        UPDATE units
                        SET
                            name=%s,
                            phone=%s,
                            email=%s,
                            address=%s,
                            logo_path=%s,
                            description=%s,
                            active=%s,
                            currency_code=%s,
                            currency_symbol=%s
                        WHERE id=%s
                        """,
                        (
                            uname,
                            optional_string(
                                unit.get("phone"),
                                "unit.phone",
                                40,
                            ),
                            optional_string(
                                unit.get("email"),
                                "unit.email",
                                254,
                            ),
                            optional_string(
                                unit.get("address"),
                                "unit.address",
                                255,
                            ),
                            optional_string(
                                unit.get("logo_path"),
                                "unit.logo_path",
                                255,
                            ),
                            optional_string(
                                unit.get("description"),
                                "unit.description",
                                2000,
                            ),
                            bool(
                                unit.get(
                                    "active",
                                    True,
                                )
                            ),
                            ccode,
                            require_nonempty_string(
                                unit.get(
                                    "currency_symbol",
                                    "₹",
                                ),
                                "unit.currency_symbol",
                                8,
                            ),
                            existing["id"],
                        ),
                    )

            # --------------------------------------------
            # Restore media
            # --------------------------------------------

            extracted = []

            for n in media_entries:

                target = (
                    MEDIA_DIR
                    / Path(n).name
                )

                tmp = target.with_suffix(
                    target.suffix
                    + ".restore_tmp"
                )

                tmp.write_bytes(
                    zf.read(n)
                )

                with Image.open(tmp) as check_img:
                    check_img.verify()

                tmp.replace(target)

                extracted.append(
                    target.name
                )

            # --------------------------------------------
            # Audit
            # --------------------------------------------

            audit(
                cur,
                audit_actor(),
                "RESTORE",
                "catalog",
                None,
                None,
                {
                    "categories": len(
                        payload["categories"]
                    ),
                    "items": len(
                        payload["items"]
                    ),
                    "media": len(
                        extracted
                    ),
                    "pre_restore_backup": (
                        pre_path.name
                    ),
                },
            )

            # --------------------------------------------
            # COMMIT
            # --------------------------------------------

            conn.commit()

            # --------------------------------------------
            # REGENERATE JSON
            # --------------------------------------------

            run_data_extractor()

            return jsonify({
                "ok": True,
                "pre_restore_backup": (
                    pre_path.name
                ),
            })

        except Exception:

            conn.rollback()
            raise

        finally:

            conn.close()


# ============================================================
# INTERNAL BACKUP EXPORT
# ============================================================

def export_backup_internal() -> io.BytesIO:

    conn = db_connect()

    try:

        cur = conn.cursor()

        unit = get_single_unit(
            cur
        )

        categories = fetch_all(
            cur,
            """
            SELECT
                id,
                name,
                description,
                image_path,
                display_order,
                active
            FROM categories
            ORDER BY display_order, name
            """,
        )

        cat_cols = [
            "id",
            "name",
            "description",
            "image_path",
            "display_order",
            "active",
        ]

        items = fetch_all(
            cur,
            """
            SELECT
                id,
                category_id,
                name,
                description,
                price,
                image_path,
                is_veg,
                available,
                active,
                display_order
            FROM items
            ORDER BY category_id, display_order, name
            """,
        )

        item_cols = [
            "id",
            "category_id",
            "name",
            "description",
            "price",
            "image_path",
            "is_veg",
            "available",
            "active",
            "display_order",
        ]

        payload = {
            "format": "qsr-admin-backup-v2",
            "exported_at": now_iso(),
            "unit": unit,
            "categories": [
                row_to_dict(
                    x,
                    cat_cols,
                )
                for x in categories
            ],
            "items": [],
        }

        media_names = set()

        for row in items:

            d = row_to_dict(
                row,
                item_cols,
            )

            d["price"] = minor_to_major(
                d.pop("price")
            )

            payload["items"].append(d)

            if (
                d.get("image_path")
                and d["image_path"].startswith(
                    "/media/"
                )
            ):
                media_names.add(
                    Path(
                        d["image_path"]
                    ).name
                )

        for c in payload["categories"]:

            if (
                c.get("image_path")
                and c["image_path"].startswith(
                    "/media/"
                )
            ):
                media_names.add(
                    Path(
                        c["image_path"]
                    ).name
                )

        if (
            payload.get("unit")
            and payload["unit"].get(
                "logo_path"
            )
            and str(
                payload["unit"]["logo_path"]
            ).startswith("/media/")
        ):
            media_names.add(
                Path(
                    payload["unit"]["logo_path"]
                ).name
            )

        buf = io.BytesIO()

        with zipfile.ZipFile(
            buf,
            "w",
            zipfile.ZIP_DEFLATED,
        ) as z:

            z.writestr(
                "manifest.json",
                json.dumps(
                    payload,
                    ensure_ascii=False,
                    indent=2,
                    default=str,
                ),
            )

            for name in sorted(
                media_names
            ):

                fp = (
                    MEDIA_DIR / name
                )

                if fp.is_file():
                    z.write(
                        fp,
                        arcname=f"media/{name}",
                    )

        buf.seek(0)

        return buf

    finally:
        conn.close()


# ============================================================
# HEALTH
# ============================================================

@app.get("/api/health")
def health():

    try:

        conn = db_connect()

        conn.close()

        return jsonify({
            "ok": True,
            "database": "ok",
            "time": now_iso(),
        })

    except Exception:

        return jsonify({
            "ok": False,
            "database": "error",
        }), 503
def generate_daily_token(conn):
    today = datetime.now().date()

    cur = conn.cursor()

    cur.execute(
        """
        SELECT last_token
        FROM daily_token_counters
        WHERE token_date = %s
        FOR UPDATE
        """,
        (today,),
    )

    row = cur.fetchone()

    if row is None:
        token_number = 1

        cur.execute(
            """
            INSERT INTO daily_token_counters
            (
                token_date,
                last_token
            )
            VALUES (%s, %s)
            """,
            (today, token_number),
        )

    else:
        token_number = int(row[0]) + 1

        cur.execute(
            """
            UPDATE daily_token_counters
            SET last_token = %s
            WHERE token_date = %s
            """,
            (
                token_number,
                today,
            ),
        )

    cur.close()

    return today, token_number

# ============================================================
# ROOT
# ============================================================

@app.route("/")
def root():

    if session.get(
        "admin_authenticated"
    ):
        return redirect(
            url_for("admin_page")
        )

    return redirect(
        url_for("login")
    )


# ============================================================
# SHARED: CART VALIDATION & PRICING
# ============================================================

def _validate_and_price_cart(cur, cart):
    """
    Validate cart items against the database and compute pricing.

    Returns (order_items, subtotal, tax, total).
    Raises ValueError on invalid input.
    """

    item_ids = []
    quantities = {}

    for cart_item in cart:
        item_id = str(cart_item.get("item_id", "")).strip()

        try:
            quantity = int(cart_item.get("quantity", 0))
        except (TypeError, ValueError):
            raise ValueError("Invalid quantity.")

        if not item_id or quantity <= 0:
            raise ValueError("Invalid order item.")

        item_ids.append(item_id)
        quantities[item_id] = quantity

    placeholders = ",".join(["%s"] * len(item_ids))

    cur.execute(
        f"""
        SELECT id, name, price, available, active
        FROM items
        WHERE id IN ({placeholders})
        """,
        item_ids,
    )

    database_items = {row["id"]: row for row in cur.fetchall()}

    order_items = []
    subtotal = 0.0

    for item_id in item_ids:
        item = database_items.get(item_id)
        quantity = quantities[item_id]

        if not item:
            raise ValueError(f"Item not found: {item_id}")
        if not item["active"]:
            raise ValueError(f"Item is inactive: {item['name']}")
        if not item["available"]:
            raise ValueError(f"Item is unavailable: {item['name']}")

        unit_price = round(float(item["price"]), 2)
        line_total = round(unit_price * quantity, 2)
        subtotal += line_total

        order_items.append({
            "item_id": item["id"],
            "item_name": item["name"],
            "quantity": quantity,
            "unit_price": unit_price,
            "line_total": line_total,
        })

    subtotal = round(subtotal, 2)
    tax = round(subtotal * TAX_PERCENTAGE / 100, 2)
    total = round(subtotal + tax, 2)

    return order_items, subtotal, tax, total


@app.post("/api/orders/prepare")
@api_handler
def prepare_order():
    """Create a CASH order and token. Order goes to admin queue."""
    # Use force=True so JSON is parsed even if Content-Type is slightly off
    data = request.get_json(silent=True, force=True) or {}
    cart = data.get("items")
    customer_name = optional_string(data.get("customer_name"), "customer_name", 120)

    if not isinstance(cart, list) or not cart:
        app.logger.warning("prepare_order: cart is empty or missing. raw data keys: %s", list(data.keys()))
        return json_error("Cart is empty.")

    conn = db_connect()
    try:
        
        conn.start_transaction()
        cur = conn.cursor(dictionary=True)

        order_items, subtotal, tax, total = (
            _validate_and_price_cart(cur, cart)
        )

        order_id = str(uuid.uuid4())
        token_date, token_number = generate_daily_token(conn)

        cur.execute(
            """
            INSERT INTO orders
            (id, token_date, token_number, customer_name,
             payment_mode, payment_status, order_status,
             kitchen_status, sent_to_kitchen,
             subtotal, tax, total)
            VALUES
            (%s, %s, %s, %s,
             'CASH', 'NOT_APPLICABLE', 'CREATED',
             'NOT_SENT', FALSE,
             %s, %s, %s)
            """,
            (order_id, token_date, token_number, customer_name,
             subtotal, tax, total),
        )

        for item in order_items:
            cur.execute(
                """
                INSERT INTO order_items
                (order_id, item_id, item_name, quantity,
                 unit_price, line_total)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (order_id, item["item_id"], item["item_name"],
                 item["quantity"], item["unit_price"], item["line_total"]),
            )

        conn.commit()

        return jsonify({
            "ok": True,
            "order": {
                "order_id": order_id,
                "token_number": token_number,
                "token_date": str(token_date),
                "timestamp": now_iso(),
                "customer_name": customer_name,
                "order_status": "CREATED",
                "kitchen_status": "NOT_SENT",
                "payment_mode": "CASH",
                "subtotal": subtotal,
                "tax": tax,
                "total": total,
                "items": order_items,
            },
        })
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ============================================================
# CREATE RAZORPAY ORDER (UPI)
# ============================================================

@app.post("/api/orders/create-razorpay-order")
@api_handler
def create_razorpay_order():
    """Step 1 of UPI flow: create a Razorpay order and a pending QSR order."""

    if not RAZORPAY_KEY_ID or not RAZORPAY_KEY_SECRET:
        return json_error(
            "Razorpay is not configured on this server.",
            503,
            "RAZORPAY_NOT_CONFIGURED",
        )

    data = request.get_json(silent=True, force=True) or {}
    cart = data.get("items")
    customer_name = optional_string(
        data.get("customer_name"), "customer_name", 120
    )

    if not isinstance(cart, list) or not cart:
        app.logger.warning("create_razorpay_order: cart missing. keys=%s", list(data.keys()))
        return json_error("Cart is empty.")

    conn = db_connect()
    try:
        
        conn.start_transaction()
        cur = conn.cursor(dictionary=True)

        order_items, subtotal, tax, total = (
            _validate_and_price_cart(cur, cart)
        )

        order_id = str(uuid.uuid4())
        token_date, token_number = generate_daily_token(conn)

        # ---- Create Razorpay order via their API ----

        rp_payload = json.dumps({
            "amount": int(round(total * 100)),          # amount in paise
            "currency": "INR",
            "receipt": order_id[:40],
            "payment_capture": 1,
        }).encode()

        rp_req = urllib.request.Request(
            "https://api.razorpay.com/v1/orders",
            data=rp_payload,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

        # Basic auth with key_id:key_secret
        credentials = base64.b64encode(
            f"{RAZORPAY_KEY_ID}:{RAZORPAY_KEY_SECRET}".encode()
        ).decode()
        rp_req.add_header("Authorization", f"Basic {credentials}")

        try:
            with urllib.request.urlopen(rp_req, timeout=15) as resp:
                rp_data = json.loads(resp.read())
        except urllib.error.HTTPError as exc:
            body = exc.read().decode(errors="replace")
            app.logger.error("Razorpay order creation failed: %s %s", exc.code, body)
            conn.rollback()
            return json_error(
                "Payment gateway error. Please verify your Razorpay API keys.",
                502,
                "RAZORPAY_ERROR",
            )
        except (urllib.error.URLError, TimeoutError) as exc:
            app.logger.error("Razorpay connection error: %s", exc)
            conn.rollback()
            return json_error(
                "Could not connect to payment gateway. Please check your internet connection.",
                502,
                "RAZORPAY_NETWORK_ERROR",
            )

        razorpay_order_id = rp_data.get("id", "")
        if not razorpay_order_id:
            conn.rollback()
            return json_error(
                "Payment gateway returned an invalid response.",
                502,
                "RAZORPAY_ERROR",
            )

        # ---- Insert PENDING order in DB ----
        cur.execute(
            """
            INSERT INTO orders
            (id, token_date, token_number, customer_name,
             payment_mode, payment_status, order_status,
             kitchen_status, sent_to_kitchen,
             subtotal, tax, total,
             razorpay_order_id)
            VALUES
            (%s, %s, %s, %s,
             'UPI', 'PENDING', 'CREATED',
             'NOT_SENT', FALSE,
             %s, %s, %s,
             %s)
            """,
            (
                order_id, token_date, token_number, customer_name,
                subtotal, tax, total,
                razorpay_order_id,
            ),
        )

        for item in order_items:
            cur.execute(
                """
                INSERT INTO order_items
                (order_id, item_id, item_name, quantity,
                 unit_price, line_total)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (
                    order_id, item["item_id"], item["item_name"],
                    item["quantity"], item["unit_price"],
                    item["line_total"],
                ),
            )

        conn.commit()

        return jsonify({
            "ok": True,
            "razorpay_order_id": razorpay_order_id,
            "key_id": RAZORPAY_KEY_ID,
            "order_id": order_id,
            "token_number": token_number,
            "token_date": str(token_date),
            "customer_name": customer_name,
            "total": total,
            "subtotal": subtotal,
            "tax": tax,
            "items": order_items,
        })

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


# ============================================================
# VERIFY UPI PAYMENT + SEND TO KITCHEN
# ============================================================

@app.post("/api/orders/verify-upi-payment")
@api_handler
def verify_upi_payment():
    """Step 2 of UPI flow: verify Razorpay signature, mark PAID, auto-send to kitchen."""

    if not RAZORPAY_KEY_SECRET:
        return json_error(
            "Razorpay is not configured on this server.",
            503,
            "RAZORPAY_NOT_CONFIGURED",
        )

    data = request.get_json(silent=True, force=True) or {}

    razorpay_order_id = str(data.get("razorpay_order_id", "")).strip()
    razorpay_payment_id = str(data.get("razorpay_payment_id", "")).strip()
    razorpay_signature = str(data.get("razorpay_signature", "")).strip()
    order_id = str(data.get("order_id", "")).strip()

    if not all([razorpay_order_id, razorpay_payment_id, razorpay_signature, order_id]):
        return json_error("Missing payment verification fields.")

    # ---- Verify HMAC-SHA256 signature ----
    message = f"{razorpay_order_id}|{razorpay_payment_id}"
    expected = hmac.new(
        RAZORPAY_KEY_SECRET.encode(),
        message.encode(),
        hashlib.sha256,
    ).hexdigest()

    if not secrets.compare_digest(expected, razorpay_signature):
        return json_error(
            "Payment signature verification failed.",
            400,
            "SIGNATURE_MISMATCH",
        )

    # ---- Update order: PAID + send directly to kitchen ----
    conn = db_connect()
    try:
        
        conn.start_transaction()
        cur = conn.cursor(dictionary=True)

        cur.execute(
            """
            SELECT id, payment_status, kitchen_status, token_number, token_date,
                   customer_name, subtotal, tax, total
            FROM orders
            WHERE id = %s
            FOR UPDATE
            """,
            (order_id,),
        )
        order = cur.fetchone()

        if not order:
            conn.rollback()
            return json_error("Order not found.", 404, "NOT_FOUND")

        # Idempotency — if already verified, just return success
        if order["payment_status"] == "PAID":
            conn.rollback()
            # Fetch items for response
            cur2 = conn.cursor(dictionary=True)
            cur2.execute(
                """
                SELECT item_id, item_name, quantity, unit_price, line_total
                FROM order_items WHERE order_id = %s ORDER BY id
                """,
                (order_id,),
            )
            items = cur2.fetchall()
            cur2.close()
            return jsonify({
                "ok": True,
                "order": {
                    "order_id": order_id,
                    "token_number": order["token_number"],
                    "token_date": str(order["token_date"]),
                    "timestamp": now_iso(),
                    "customer_name": order["customer_name"],
                    "order_status": "CONFIRMED",
                    "kitchen_status": "SENT",
                    "payment_mode": "UPI",
                    "subtotal": float(order["subtotal"]),
                    "tax": float(order["tax"]),
                    "total": float(order["total"]),
                    "items": items,
                },
            })

        # Mark PAID, CONFIRMED, and immediately send to kitchen
        cur.execute(
            """
            UPDATE orders
            SET
                payment_status      = 'PAID',
                order_status        = 'CONFIRMED',
                kitchen_status      = 'SENT',
                sent_to_kitchen     = TRUE,
                sent_at             = CURRENT_TIMESTAMP,
                razorpay_payment_id = %s
            WHERE id = %s
            """,
            (razorpay_payment_id, order_id),
        )

        # Fetch order items for the response
        cur.execute(
            """
            SELECT item_id, item_name, quantity, unit_price, line_total
            FROM order_items WHERE order_id = %s ORDER BY id
            """,
            (order_id,),
        )
        order_items = cur.fetchall()

        conn.commit()

        return jsonify({
            "ok": True,
            "order": {
                "order_id": order_id,
                "token_number": order["token_number"],
                "token_date": str(order["token_date"]),
                "timestamp": now_iso(),
                "customer_name": order["customer_name"],
                "order_status": "CONFIRMED",
                "kitchen_status": "SENT",
                "payment_mode": "UPI",
                "subtotal": float(order["subtotal"]),
                "tax": float(order["tax"]),
                "total": float(order["total"]),
                "items": order_items,
            },
        })

    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


@app.get("/api/kitchen/orders")
@require_auth
@api_handler
def kitchen_orders():
    conn = db_connect()

    try:
        cur = conn.cursor(dictionary=True)

        cur.execute(
            """
            SELECT
                id,
                token_date,
                token_number,
                customer_name,
                payment_mode,
                kitchen_status,
                order_status,
                sent_to_kitchen,
                subtotal,
                tax,
                total,
                created_at,
                sent_at,
                preparing_at,
                ready_at,
                delivered_at
            FROM orders
            WHERE kitchen_status IN (
                'SENT',
                'PREPARING',
                'READY'
            )
            ORDER BY created_at ASC
            """
        )

        orders = cur.fetchall()

        # Batch-fetch all order items in one query (fix N+1)
        order_ids = [o["id"] for o in orders]
        items_by_order = {oid: [] for oid in order_ids}

        if order_ids:
            ph = ",".join(["%s"] * len(order_ids))
            cur.execute(
                f"""
                SELECT
                    order_id,
                    item_id,
                    item_name,
                    quantity,
                    unit_price,
                    line_total
                FROM order_items
                WHERE order_id IN ({ph})
                ORDER BY id
                """,
                order_ids,
            )
            for row in cur.fetchall():
                row["unit_price"] = float(row["unit_price"])
                row["line_total"] = float(row["line_total"])
                items_by_order[row["order_id"]].append(row)

        for order in orders:
            order["items"] = items_by_order.get(order["id"], [])
            order["order_id"] = order.pop("id")
            order["subtotal"] = float(order["subtotal"])
            order["tax"] = float(order["tax"])
            order["total"] = float(order["total"])

            if order["token_date"]:
                order["token_date"] = str(order["token_date"])

            for ts_field in ("created_at", "sent_at", "preparing_at", "ready_at", "delivered_at"):
                if order[ts_field]:
                    order[ts_field] = order[ts_field].isoformat()

            order["sent_to_kitchen"] = bool(
                order["sent_to_kitchen"]
            )

        return jsonify({
            "ok": True,
            "orders": orders
        })

    finally:
        conn.close()
        
@app.get("/api/admin/orders")
@require_auth
@api_handler
def admin_orders():
    conn = db_connect()

    try:
        cur = conn.cursor(dictionary=True)

        cur.execute(
            """
            SELECT
                id,
                token_date,
                token_number,
                customer_name,
                payment_mode,
                kitchen_status,
                order_status,
                sent_to_kitchen,
                subtotal,
                tax,
                total,
                created_at,
                sent_at,
                preparing_at,
                ready_at,
                delivered_at
            FROM orders
            ORDER BY created_at DESC
            LIMIT 100
            """
        )

        orders = cur.fetchall()

        # Batch-fetch all order items in one query (fix N+1)
        order_ids = [o["id"] for o in orders]
        items_by_order = {oid: [] for oid in order_ids}

        if order_ids:
            ph = ",".join(["%s"] * len(order_ids))
            cur.execute(
                f"""
                SELECT
                    order_id,
                    item_id,
                    item_name,
                    quantity,
                    unit_price,
                    line_total
                FROM order_items
                WHERE order_id IN ({ph})
                ORDER BY id
                """,
                order_ids,
            )
            for row in cur.fetchall():
                row["unit_price"] = float(row["unit_price"])
                row["line_total"] = float(row["line_total"])
                items_by_order[row["order_id"]].append(row)

        for order in orders:
            order["items"] = items_by_order.get(order["id"], [])
            order["order_id"] = order.pop("id")
            order["token_date"] = str(order["token_date"])
            order["subtotal"] = float(order["subtotal"])
            order["tax"] = float(order["tax"])
            order["total"] = float(order["total"])

            for ts_field in ("created_at", "sent_at", "preparing_at", "ready_at", "delivered_at"):
                if order[ts_field]:
                    order[ts_field] = order[ts_field].isoformat()

            order["sent_to_kitchen"] = bool(order["sent_to_kitchen"])

        return jsonify({
            "ok": True,
            "orders": orders
        })

    finally:
        conn.close()


@app.post("/api/admin/orders/<order_id>/send-to-kitchen")
@require_auth
@api_handler
def send_order_to_kitchen(order_id):
    require_csrf()

    conn = db_connect()

    try:
        

        conn.start_transaction()

        cur = conn.cursor(dictionary=True)

        cur.execute(
            """
            SELECT id, kitchen_status
            FROM orders
            WHERE id = %s
            FOR UPDATE
            """,
            (order_id,)
        )

        order = cur.fetchone()

        if not order:
            conn.rollback()
            return json_error(
                "Order not found.",
                404,
                "NOT_FOUND"
            )

        if order["kitchen_status"] != "NOT_SENT":
            conn.rollback()

            return jsonify({
                "ok": True,
                "message": "Order is already in the kitchen flow.",
                "order_id": order_id,
                "kitchen_status": order["kitchen_status"]
            })

        cur.execute(
            """
            UPDATE orders
            SET
                kitchen_status = 'SENT',
                sent_to_kitchen = TRUE,
                sent_at = CURRENT_TIMESTAMP
            WHERE id = %s
            """,
            (order_id,)
        )

        conn.commit()

        return jsonify({
            "ok": True,
            "order_id": order_id,
            "kitchen_status": "SENT"
        })

    except Exception:
        conn.rollback()
        raise

    finally:
        conn.close()
@app.post("/api/kitchen/orders/<order_id>/status")
@require_auth
@api_handler
def update_kitchen_status(order_id):
    require_csrf()
    data = request.get_json(silent=True) or {}
    status = str(data.get("status", "")).upper().strip()
    allowed = {"PREPARING", "READY", "COMPLETED"}
    if status not in allowed:
        return json_error("Invalid kitchen status.")

    conn = db_connect()
    try:
        
        cur = conn.cursor()
        
        
        if status == "PREPARING":
            cur.execute("""
        UPDATE orders
        SET
            kitchen_status = 'PREPARING',
            preparing_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (order_id,))

        elif status == "READY":
            cur.execute("""
        UPDATE orders
        SET
            kitchen_status = 'READY',
            ready_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (order_id,))

        elif status == "COMPLETED":
            cur.execute("""
        UPDATE orders
        SET
            kitchen_status = 'COMPLETED',
            delivered_at = CURRENT_TIMESTAMP
        WHERE id = %s
    """, (order_id,))
            
            
            
        if cur.rowcount == 0:
            conn.rollback()
            return json_error("Order not found.", 404, "NOT_FOUND")
        conn.commit()
        return jsonify({"ok": True, "order_id": order_id, "kitchen_status": status})
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()



# ============================================================
# COMPLETED ORDERS (with filtering)
# ============================================================

@app.get("/api/admin/orders/completed")
@require_auth
@api_handler
def admin_completed_orders():
    """Return COMPLETED orders with optional query-param filtering."""

    payment = request.args.get("payment", "").upper().strip()
    from_date = request.args.get("from", "").strip()
    to_date = request.args.get("to", "").strip()
    search = request.args.get("search", "").strip()
    sort = request.args.get("sort", "desc").lower().strip()

    conn = db_connect()
    try:
        cur = conn.cursor(dictionary=True)

        conditions = ["kitchen_status = 'COMPLETED'"]
        params: list = []

        if payment in ("CASH", "UPI"):
            conditions.append("payment_mode = %s")
            params.append(payment)

        if from_date:
            conditions.append("DATE(created_at) >= %s")
            params.append(from_date)

        if to_date:
            conditions.append("DATE(created_at) <= %s")
            params.append(to_date)

        if search:
            conditions.append(
                "(CAST(token_number AS CHAR) LIKE %s OR id LIKE %s)"
            )
            like = f"%{search}%"
            params.extend([like, like])

        order_dir = "ASC" if sort == "asc" else "DESC"
        where = " AND ".join(conditions)

        cur.execute(
            f"""
            SELECT
                id,
                token_date,
                token_number,
                customer_name,
                payment_mode,
                kitchen_status,
                order_status,
                subtotal,
                tax,
                total,
                created_at,
                sent_at,
                preparing_at,
                ready_at,
                delivered_at
            FROM orders
            WHERE {where}
            ORDER BY created_at {order_dir}
            LIMIT 300
            """,
            params,
        )

        orders = cur.fetchall()
        order_ids = [o["id"] for o in orders]
        items_by_order: dict = {oid: [] for oid in order_ids}

        if order_ids:
            ph = ",".join(["%s"] * len(order_ids))
            cur.execute(
                f"""
                SELECT order_id, item_name, quantity, unit_price, line_total
                FROM order_items
                WHERE order_id IN ({ph})
                ORDER BY id
                """,
                order_ids,
            )
            for row in cur.fetchall():
                row["unit_price"] = float(row["unit_price"])
                row["line_total"] = float(row["line_total"])
                items_by_order[row["order_id"]].append(row)

        result = []
        for order in orders:
            order["items"] = items_by_order.get(order["id"], [])
            order["order_id"] = order.pop("id")
            order["token_date"] = str(order["token_date"])
            order["subtotal"] = float(order["subtotal"])
            order["tax"] = float(order["tax"])
            order["total"] = float(order["total"])
            for ts_field in (
                "created_at",
                "sent_at",
                "preparing_at",
                "ready_at",
                "delivered_at",
            ):
                if order[ts_field]:
                    order[ts_field] = order[ts_field].isoformat()
            result.append(order)

        return jsonify({"ok": True, "orders": result, "count": len(result)})

    finally:
        conn.close()


if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=5000,
        debug=False
    )