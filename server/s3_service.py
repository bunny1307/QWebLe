import os
import json
from datetime import datetime, timezone
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

AWS_S3_BUCKET_NAME = os.environ.get("AWS_S3_BUCKET_NAME", "qweble-items-media")
AWS_S3_REGION = os.environ.get("AWS_S3_REGION", "eu-north-1")
AWS_S3_FOLDER = os.environ.get("AWS_S3_FOLDER", "qweble-cms").strip("/")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY", "")

def get_s3_client():
    try:
        import boto3
        if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY:
            return boto3.client(
                "s3",
                region_name=AWS_S3_REGION,
                aws_access_key_id=AWS_ACCESS_KEY_ID,
                aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
            )
        else:
            return boto3.client("s3", region_name=AWS_S3_REGION)
    except Exception as e:
        print(f"[S3] Error initializing boto3 client: {e}")
        return None

def check_s3_connection():
    """Verify AWS S3 connectivity, bucket accessibility and folder readiness."""
    s3 = get_s3_client()
    if not s3:
        return {
            "connected": False,
            "bucket": AWS_S3_BUCKET_NAME,
            "region": AWS_S3_REGION,
            "folder": AWS_S3_FOLDER,
            "message": "AWS Boto3 client could not be initialized. Check credentials."
        }
    
    try:
        # Check bucket access
        s3.head_bucket(Bucket=AWS_S3_BUCKET_NAME)
        return {
            "connected": True,
            "bucket": AWS_S3_BUCKET_NAME,
            "region": AWS_S3_REGION,
            "folder": AWS_S3_FOLDER,
            "public_url": f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_S3_REGION}.amazonaws.com/{AWS_S3_FOLDER}/site-data.json",
            "message": f"Connected to AWS S3 bucket '{AWS_S3_BUCKET_NAME}' in region '{AWS_S3_REGION}'"
        }
    except Exception as e:
        return {
            "connected": False,
            "bucket": AWS_S3_BUCKET_NAME,
            "region": AWS_S3_REGION,
            "folder": AWS_S3_FOLDER,
            "message": f"AWS S3 access failed: {str(e)}"
        }

def compile_site_data(db_conn):
    """Compiles all pricing tiers and FAQs from SQLite into a clean dictionary."""
    cursor = db_conn.cursor()

    # Pricing tiers
    cursor.execute("SELECT * FROM pricing_tiers ORDER BY price_monthly ASC")
    rows = cursor.fetchall()
    plans = []
    for r in rows:
        features = []
        not_included = []
        try:
            features = json.loads(r["features"])
        except Exception:
            pass
        try:
            not_included = json.loads(r["not_included"])
        except Exception:
            pass

        plans.append({
            "id": r["id"],
            "name": r["name"],
            "tagline": r["tagline"] or "",
            "priceMonthly": r["price_monthly"],
            "priceAnnual": r["price_annual"],
            "popular": bool(r["popular"]),
            "color": r["color"] or "slate",
            "features": features,
            "notIncluded": not_included,
        })

    # FAQs
    cursor.execute("SELECT * FROM faqs ORDER BY display_order ASC, id ASC")
    faq_rows = cursor.fetchall()
    faqs = []
    for f in faq_rows:
        faqs.append({
            "id": f["id"],
            "q": f["question"],
            "a": f["answer"],
        })

    return {
        "version": "1.0",
        "updatedAt": datetime.now(timezone.utc).isoformat(),
        "plans": plans,
        "faqs": faqs,
    }

def sync_to_s3(db_conn):
    """Compiles SQLite content and uploads it to s3://<bucket>/<folder>/site-data.json"""
    s3 = get_s3_client()
    if not s3:
        return {"success": False, "error": "AWS S3 client not available."}

    data = compile_site_data(db_conn)
    json_bytes = json.dumps(data, indent=2).encode("utf-8")
    s3_key = f"{AWS_S3_FOLDER}/site-data.json"

    try:
        s3.put_object(
            Bucket=AWS_S3_BUCKET_NAME,
            Key=s3_key,
            Body=json_bytes,
            ContentType="application/json",
            CacheControl="no-cache, no-store, must-revalidate",
        )

        public_url = f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_S3_REGION}.amazonaws.com/{s3_key}"

        # Update last sync timestamp in settings
        cursor = db_conn.cursor()
        cursor.execute("""
            INSERT INTO system_settings (key, value) VALUES ('last_s3_sync', ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value
        """, (datetime.now(timezone.utc).isoformat(),))
        db_conn.commit()

        return {
            "success": True,
            "key": s3_key,
            "url": public_url,
            "timestamp": data["updatedAt"]
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
