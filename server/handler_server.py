import os
import json
from pathlib import Path
from datetime import datetime, timezone

from dotenv import load_dotenv
from flask import Flask, request, jsonify, render_template

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

from db import get_db_connection, init_db
from s3_service import check_s3_connection, compile_site_data, sync_to_s3

app = Flask(__name__, template_folder=str(BASE_DIR / "templates"))

# Enable CORS manually for all incoming origins
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# Ensure tables exist
init_db()

# ============================================================
# HANDLER ADMIN PAGES
# ============================================================

@app.route("/")
@app.route("/handler")
def handler_page():
    return render_template("handler.html")

# ============================================================
# STATUS & S3 SYNC API
# ============================================================

@app.route("/api/admin/status", methods=["GET"])
def api_status():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM system_settings WHERE key = 'last_s3_sync'")
    row = cursor.fetchone()
    last_sync = row["value"] if row else None
    conn.close()

    s3_status = check_s3_connection()
    return jsonify({
        "status": "online",
        "s3": s3_status,
        "last_sync": last_sync
    })

@app.route("/api/admin/sync-s3", methods=["POST"])
def api_sync_s3():
    conn = get_db_connection()
    result = sync_to_s3(conn)
    conn.close()
    return jsonify(result)

# ============================================================
# CONTACT INQUIRIES API (LEAD CAPTURE)
# ============================================================

@app.route("/api/contact", methods=["POST", "OPTIONS"])
def api_contact():
    if request.method == "OPTIONS":
        return jsonify({"ok": True}), 200

    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    restaurant = (data.get("restaurant") or "").strip()
    phone = (data.get("phone") or "").strip()
    email = (data.get("email") or "").strip()
    outlets = str(data.get("outlets") or "1").strip()
    plan = (data.get("plan") or "Pro").strip()
    notes = (data.get("notes") or "").strip()

    if not name or not restaurant or not phone:
        return jsonify({"success": False, "error": "Name, restaurant name, and phone are required."}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO contact_inquiries (name, restaurant, phone, email, outlets, plan, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (name, restaurant, phone, email, outlets, plan, notes))
        conn.commit()
        inquiry_id = cursor.lastrowid
        conn.close()

        print(f"[LEAD CAPTURED] New inquiry #{inquiry_id}: {name} ({restaurant}) - Phone: {phone} - Plan: {plan}")
        return jsonify({"success": True, "id": inquiry_id, "message": "Inquiry recorded successfully."}), 201
    except Exception as e:
        print(f"[LEAD ERROR] Failed to record inquiry: {e}")
        return jsonify({"success": False, "error": str(e)}), 500

@app.route("/api/admin/inquiries", methods=["GET"])
def api_get_inquiries():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM contact_inquiries ORDER BY id DESC")
    rows = cursor.fetchall()
    inquiries = [dict(r) for r in rows]
    conn.close()
    return jsonify(inquiries)

@app.route("/api/admin/inquiries/<int:inquiry_id>", methods=["DELETE"])
def api_delete_inquiry(inquiry_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM contact_inquiries WHERE id = ?", (inquiry_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})

# ============================================================
# PRICING API
# ============================================================

@app.route("/api/admin/pricing", methods=["GET"])
def api_get_pricing():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM pricing_tiers ORDER BY price_monthly ASC")
    rows = cursor.fetchall()
    plans = [dict(r) for r in rows]
    conn.close()
    return jsonify(plans)

@app.route("/api/admin/pricing/<tier_id>", methods=["POST"])
def api_update_pricing(tier_id):
    data = request.get_json(silent=True) or {}
    price_monthly = int(data.get("price_monthly", 599))
    price_annual = int(data.get("price_annual", 499))
    tagline = data.get("tagline", "")
    features = data.get("features", [])
    not_included = data.get("not_included", [])

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE pricing_tiers
        SET price_monthly = ?, price_annual = ?, tagline = ?, features = ?, not_included = ?
        WHERE id = ?
    """, (price_monthly, price_annual, tagline, json.dumps(features), json.dumps(not_included), tier_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "tier_id": tier_id})

# ============================================================
# FAQS API
# ============================================================

@app.route("/api/admin/faqs", methods=["GET"])
def api_get_faqs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM faqs ORDER BY display_order ASC, id ASC")
    rows = cursor.fetchall()
    faqs = [dict(r) for r in rows]
    conn.close()
    return jsonify(faqs)

@app.route("/api/admin/faqs", methods=["POST"])
def api_add_faq():
    data = request.get_json(silent=True) or {}
    q = (data.get("question") or "").strip()
    a = (data.get("answer") or "").strip()

    if not q or not a:
        return jsonify({"success": False, "error": "Question and answer are required"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO faqs (question, answer) VALUES (?, ?)", (q, a))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    return jsonify({"success": True, "id": new_id})

@app.route("/api/admin/faqs/<int:faq_id>", methods=["PUT"])
def api_update_faq(faq_id):
    data = request.get_json(silent=True) or {}
    q = (data.get("question") or "").strip()
    a = (data.get("answer") or "").strip()

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE faqs SET question = ?, answer = ? WHERE id = ?", (q, a, faq_id))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

@app.route("/api/admin/faqs/<int:faq_id>", methods=["DELETE"])
def api_delete_faq(faq_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM faqs WHERE id = ?", (faq_id,))
    conn.commit()
    conn.close()

    return jsonify({"success": True})

# ============================================================
# PUBLIC SITE-DATA (Local Mirror / Fallback)
# ============================================================

@app.route("/api/public/site-data", methods=["GET"])
def api_public_site_data():
    conn = get_db_connection()
    data = compile_site_data(conn)
    conn.close()
    return jsonify(data)

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    host = os.environ.get("HOST", "0.0.0.0")
    print(f"[HANDLER] Starting QWeble Handler Server on http://localhost:{port}")
    app.run(host=host, port=port, debug=False)
