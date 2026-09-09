import os
import json
import sqlite3
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DB_NAME = os.environ.get("SQLITE_DB_NAME", "qweble_handling_data.db")
DB_PATH = BASE_DIR / DB_NAME

def get_db_connection():
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. Pricing Tiers Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS pricing_tiers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            tagline TEXT,
            price_monthly INTEGER NOT NULL,
            price_annual INTEGER NOT NULL,
            popular INTEGER DEFAULT 0,
            color TEXT DEFAULT 'slate',
            features TEXT NOT NULL,
            not_included TEXT NOT NULL
        )
    """)

    # 2. FAQs Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS faqs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            display_order INTEGER DEFAULT 0
        )
    """)

    # 3. Contact Inquiries Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS contact_inquiries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            restaurant TEXT NOT NULL,
            phone TEXT NOT NULL,
            email TEXT,
            outlets TEXT,
            plan TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # 4. System Settings Table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS system_settings (
            key TEXT PRIMARY KEY,
            value TEXT
        )
    """)

    # Seed Initial Pricing Tiers if empty
    cursor.execute("SELECT COUNT(*) as cnt FROM pricing_tiers")
    if cursor.fetchone()["cnt"] == 0:
        initial_plans = [
            (
                "base",
                "Base",
                "Ideal for small cafes & standalone food counters",
                599,
                499,
                0,
                "slate",
                json.dumps([
                    "Standalone Offline POS Terminal",
                    "Daily Token Counter Engine",
                    "Cash & Counter Reconciliation",
                    "Thermal Printer ESC/POS & PDF Receipts",
                    "Local SQLite Database",
                    "Inventory Tracking & Stock Alerts",
                    "On-Screen Keyboard & Customer Display"
                ]),
                json.dumps([
                    "Multi-screen touch kiosk pairing",
                    "Automated cloud backup & sync",
                    "AI sales & demand forecasting"
                ])
            ),
            (
                "pro",
                "Pro",
                "For fast food, busy bistros & multi-screen counters",
                699,
                579,
                1,
                "teal",
                json.dumps([
                    "Everything in Base Plan",
                    "Unlimited Self-Ordering Touch Kiosks",
                    "Real-Time Kitchen Display System (KDS)",
                    "Automated Cloud Data Sync",
                    "Live Internet Diagnostics & Auto-Failover",
                    "Razorpay QR / Dynamic UPI Payments",
                    "Multi-device LAN Device Authorization Gate",
                    "Priority Phone & WhatsApp Support"
                ]),
                json.dumps([
                    "AI automated inventory demand forecasting"
                ])
            ),
            (
                "ultra",
                "Ultra",
                "For high-volume chains, franchises & food courts",
                899,
                749,
                0,
                "coral",
                json.dumps([
                    "Everything in Pro Plan",
                    "AI Demand & Rush Hour Forecasting",
                    "Smart Ingredient & Stock Depletion Predictions",
                    "Multi-Outlet Master Dashboard & Rollups",
                    "Custom Cloud Domain & Web Reporting",
                    "Automated Cryptographic Tamper-Proof Audit Logs",
                    "Dedicated Technical Account Manager"
                ]),
                json.dumps([])
            )
        ]
        cursor.executemany("""
            INSERT INTO pricing_tiers (id, name, tagline, price_monthly, price_annual, popular, color, features, not_included)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, initial_plans)

    # Seed Initial FAQs if empty
    cursor.execute("SELECT COUNT(*) as cnt FROM faqs")
    if cursor.fetchone()["cnt"] == 0:
        initial_faqs = [
            (
                "What happens when the restaurant internet disconnects?",
                "Nothing stops. QWeble operates 100% on your local LAN with its embedded SQLite database. Customer touch kiosks take orders, kitchen displays show tickets, and tokens print instantly. As soon as the internet returns, QWeble silently syncs all transactions to the cloud in the background.",
                1
            ),
            (
                "Do I need expensive proprietary POS terminals or iPad stands?",
                "No. QWeble is hardware-agnostic. You can run the cashier admin on any Windows PC or laptop, and run the customer self-ordering kiosk on any tablet, touchscreen monitor, or iPad using modern browser lockdown mode.",
                2
            ),
            (
                "How does UPI payment verification work if the internet is down?",
                "When offline, QWeble automatically switches to Cash & Counter Payment mode so you never accept unverified digital payments. When online, customers scan dynamic Razorpay QR codes with instant webhook signature validation.",
                3
            ),
            (
                "Can I connect multiple kitchen screens and customer kiosks?",
                "Yes. With the Cloud Sync plan, you can pair multiple customer kiosks and chef screens over your local Wi-Fi router in seconds using intuitive 6-digit screen pairing codes.",
                4
            ),
            (
                "How do I export sales data for accounting and GST filing?",
                "The admin portal includes a 1-click comprehensive PDF business report generator detailing daily tokens, GST breakdown, payment method distribution, and itemized sales.",
                5
            )
        ]
        cursor.executemany("""
            INSERT INTO faqs (question, answer, display_order)
            VALUES (?, ?, ?)
        """, initial_faqs)

    conn.commit()
    conn.close()
    print(f"[DB] Initialized SQLite Database at: {DB_PATH}")

if __name__ == "__main__":
    init_db()
