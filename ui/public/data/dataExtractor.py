import mysql.connector
import json
from pathlib import Path
from decimal import Decimal


import os
from dotenv import load_dotenv

# Try loading .env from servercode folder
env_path = Path(__file__).resolve().parents[3] / "servercode" / ".env"
if env_path.is_file():
    load_dotenv(env_path)

DB_CONFIG = {
    "host": os.environ.get("MYSQL_HOST", "127.0.0.1"),
    "port": int(os.environ.get("MYSQL_PORT", 3306)),
    "user": os.environ.get("MYSQL_USER", "root"),
    "password": os.environ.get("MYSQL_PASSWORD", ""),
    "database": os.environ.get("MYSQL_DATABASE", "qsr")
}

# Always write JSON files next to this script.
OUTPUT_DIR = Path(__file__).resolve().parent


# ============================================================
# JSON SERIALIZER
# ============================================================

def json_serializer(value):
    """
    Convert MySQL values into JSON-compatible values.

    Decimal values are converted to numbers.
    Other unsupported values are converted to strings.
    """

    if isinstance(value, Decimal):
        return float(value)

    return str(value)


# ============================================================
# CONNECT TO MYSQL
# ============================================================

print("Connecting to MySQL...")

db = mysql.connector.connect(
    host=DB_CONFIG["host"],
    port=DB_CONFIG["port"],
    user=DB_CONFIG["user"],
    password=DB_CONFIG["password"],
    database=DB_CONFIG["database"]
)

cursor = db.cursor()

print("Connected to MySQL.")
print(f"JSON output directory: {OUTPUT_DIR}")


# ============================================================
# GET ALL TABLE NAMES
# ============================================================

cursor.execute("SHOW TABLES")

tables = [
    row[0]
    for row in cursor.fetchall()
]

print("\nTables found:")

for table in tables:
    print(f"  - {table}")


# ============================================================
# EXTRACT EVERY TABLE
# ============================================================

for table in tables:

    # --------------------------------------------------------
    # Audit logs are not required by the frontend.
    # --------------------------------------------------------

    if table == "audit_logs":
        print(f"\nSkipping: {table}")
        continue

    print(f"\nExtracting: {table}")

    table_cursor = db.cursor(dictionary=True)

    # Backticks protect table names.
    table_cursor.execute(
        f"SELECT * FROM `{table}`"
    )

    rows = table_cursor.fetchall()

    table_cursor.close()

    # --------------------------------------------------------
    # Create JSON filenames and write to directories
    # --------------------------------------------------------

    dirs_to_write = [OUTPUT_DIR]
    dist_dir = OUTPUT_DIR.parents[2] / "dist" / "data"
    if dist_dir.is_dir():
        dirs_to_write.append(dist_dir)

    for target_dir in dirs_to_write:
        filename = target_dir / f"fromdb_{table}.json"

        with open(
            filename,
            "w",
            encoding="utf-8"
        ) as file:

            json.dump(
                rows,
                file,
                indent=4,
                ensure_ascii=False,
                default=json_serializer
            )

        print(
            f"Created: {filename}"
        )

    print(
        f"Rows exported: {len(rows)}"
    )


# ============================================================
# CLOSE DATABASE
# ============================================================

cursor.close()
db.close()

print("\nAll tables exported successfully!")