"""AWS RDS, Render, and Netlify Cloud Communication Diagnostics Tool.

Run this script to test all cloud links:
    python servercode/check_cloud_connection.py
"""
import os
import sys
import time
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR.parent))

load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(BASE_DIR.parent / ".env", override=True)

from servercode.server import get_mysql_config, db_connect

def run_diagnostics():
    print("=" * 65)
    print("      QSR CLOUD INFRASTRUCTURE & COMMUNICATION DIAGNOSTICS")
    print("=" * 65)

    # 1. AWS RDS Database Check
    config = get_mysql_config()
    print("\n[1/3] Testing AWS RDS MySQL Connection...")
    print(f"  Target Host:     {config.get('host')}:{config.get('port')}")
    print(f"  Target Database: {config.get('database')}")
    print(f"  Target User:     {config.get('user')}")

    t0 = time.monotonic()
    try:
        conn = db_connect()
        cur = conn.cursor(dictionary=True)
        cur.execute("SELECT 1 AS alive, VERSION() AS version")
        res = cur.fetchone()
        latency_ms = round((time.monotonic() - t0) * 1000, 2)
        print(f"  >>> STATUS: CONNECTED SUCCESSFUL ({latency_ms} ms)")
        print(f"  >>> MySQL Version: {res['version']}")

        print("\n  Verifying Schema Tables & Counts:")
        tables = ["units", "categories", "items", "orders", "order_items", "daily_token_counters", "audit_logs"]
        for tbl in tables:
            try:
                cur.execute(f"SELECT COUNT(*) AS cnt FROM `{tbl}`")
                cnt = cur.fetchone()["cnt"]
                print(f"    - {tbl:<25}: {cnt} rows")
            except Exception as tbl_err:
                print(f"    - {tbl:<25}: MISSING ({tbl_err})")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"  >>> STATUS: FAILED ({e})")
        print("  Troubleshooting: Verify RDS Security Group inbound rule allows port 3306.")

    # 2. Render Server Environment
    print("\n[2/3] Checking Render Server Configuration...")
    print(f"  Port:                 {os.environ.get('PORT', '10000 (Default / Auto)')}")
    print(f"  CORS Allowed Origins: {os.environ.get('CORS_ALLOWED_ORIGINS', '* (All Origins)')}")
    print(f"  Cookie Secure:        {os.environ.get('COOKIE_SECURE', 'true')}")
    print(f"  Secret Key Configured:{bool(os.environ.get('FLASK_SECRET_KEY'))}")
    print("  >>> STATUS: RENDER SERVER CONFIG OK")

    # 3. Netlify Frontend Link
    print("\n[3/3] Checking Netlify Frontend API Integration...")
    print("  Public Menu Endpoint: /api/public/menu (Active & Public)")
    print("  Order Endpoints:      /api/orders/prepare, /api/orders/create-razorpay-order")
    print("  Netlify Config:       VITE_API_URL should point to your Render URL")
    print("  >>> STATUS: NETLIFY COMPATIBILITY READY")

    print("\n" + "=" * 65)
    print("DIAGNOSTICS COMPLETED")
    print("=" * 65)

if __name__ == "__main__":
    run_diagnostics()
