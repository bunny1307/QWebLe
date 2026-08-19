"""AWS RDS MySQL Database Initialization & Verification Utility.

Run this script once to initialize all required database tables, indexes,
and seed records on your AWS RDS instance:

    python servercode/init_aws_db.py
"""
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment from servercode/.env or root .env
BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(BASE_DIR.parent / ".env", override=True)

from servercode.server import get_mysql_config, db_connect, ensure_lite_order_schema

def init_aws_database():
    config = get_mysql_config()
    print("=" * 60)
    print("QSR AWS RDS MySQL Initializer")
    print("=" * 60)
    print(f"Target Host:     {config.get('host')}")
    print(f"Target Port:     {config.get('port')}")
    print(f"Database Name:   {config.get('database')}")
    print(f"Database User:   {config.get('user')}")
    print(f"SSL Disabled:    {config.get('ssl_disabled', False)}")
    print("-" * 60)

    try:
        print("Connecting to database...")
        conn = db_connect()
        print("Connected successfully to MySQL server.")

        schema_file = BASE_DIR / "schema.sql"
        if not schema_file.is_file():
            print(f"ERROR: schema.sql not found at {schema_file}")
            sys.exit(1)

        with open(schema_file, "r", encoding="utf-8") as f:
            sql_script = f.read()

        cur = conn.cursor()

        # Split statements by semicolon while ignoring comments and empty lines
        statements = []
        current_stmt = []
        for line in sql_script.splitlines():
            clean_line = line.strip()
            if not clean_line or clean_line.startswith("--") or clean_line.startswith("/*"):
                continue
            current_stmt.append(line)
            if clean_line.endswith(";"):
                statements.append("\n".join(current_stmt))
                current_stmt = []

        print(f"\nExecuting {len(statements)} schema statements...")
        for i, stmt in enumerate(statements, start=1):
            stmt_clean = stmt.strip()
            if not stmt_clean:
                continue
            # Skip USE statement if RDS user has direct default DB
            if stmt_clean.upper().startswith("USE "):
                continue
            try:
                cur.execute(stmt_clean)
            except Exception as stmt_err:
                # If table already exists or duplicate key, continue gracefully
                err_msg = str(stmt_err)
                if "already exists" in err_msg.lower() or "duplicate" in err_msg.lower():
                    pass
                else:
                    print(f"  [Warning on statement {i}]: {err_msg}")

        conn.commit()

        # Ensure lite order schema migrations
        print("Verifying schema migrations...")
        ensure_lite_order_schema(conn)

        # Print table summary
        cur.execute("SHOW TABLES")
        tables = [row[0] for row in cur.fetchall()]
        print("\nActive Tables in Database:")
        for t in tables:
            cur.execute(f"SELECT COUNT(*) FROM `{t}`")
            count = cur.fetchone()[0]
            print(f"  - {t:<25} ({count} rows)")

        cur.close()
        conn.close()

        print("\n" + "=" * 60)
        print("SUCCESS: Your AWS RDS MySQL database is fully initialized!")
        print("=" * 60)

    except Exception as err:
        print("\n" + "!" * 60)
        print(f"FAILED: Database connection / initialization error:\n{err}")
        print("!" * 60)
        print("\nTroubleshooting Tips:")
        print("1. In AWS RDS Console, verify the DB instance is 'Available'.")
        print("2. In RDS Security Groups, verify inbound rule allows TCP port 3306 from anywhere (0.0.0.0/0) or your IP / Render IP.")
        print("3. Check that 'Publicly Accessible' is set to 'Yes' if connecting from outside AWS VPC.")
        print("4. Verify MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD in your .env file.")
        sys.exit(1)

if __name__ == "__main__":
    init_aws_database()
