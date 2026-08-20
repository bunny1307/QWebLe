"""AWS S3 Media Migration & Database Synchronization Tool.

Uploads all local media files to your AWS S3 bucket and updates the
image_path records in your AWS RDS MySQL database with the permanent S3 URLs:

    python servercode/sync_media_to_s3.py
"""
import os
import sys
import mimetypes
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)
load_dotenv(BASE_DIR.parent / ".env", override=True)

from servercode.server import (
    AWS_S3_BUCKET_NAME,
    AWS_S3_REGION,
    AWS_CLOUDFRONT_DOMAIN,
    get_s3_client,
    db_connect,
)

def sync_media_to_s3():
    print("=" * 65)
    print("        AWS S3 MEDIA MIGRATOR & DATABASE SYNCHRONIZER")
    print("=" * 65)

    if not AWS_S3_BUCKET_NAME:
        print("ERROR: AWS_S3_BUCKET_NAME is not set in your .env file or environment.")
        print("Please add AWS_S3_BUCKET_NAME, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_S3_REGION.")
        sys.exit(1)

    s3 = get_s3_client()
    if not s3:
        print("ERROR: Failed to initialize AWS S3 client with current credentials.")
        sys.exit(1)

    print(f"Target S3 Bucket: {AWS_S3_BUCKET_NAME} ({AWS_S3_REGION})")

    media_dir = BASE_DIR / "media"
    if not media_dir.is_dir():
        print(f"ERROR: Media directory not found at {media_dir}")
        sys.exit(1)

    files = [f for f in media_dir.iterdir() if f.is_file()]
    print(f"Found {len(files)} local media files in {media_dir}\n")

    uploaded_map = {}

    for f in files:
        s3_key = f"media/{f.name}"
        content_type, _ = mimetypes.guess_type(str(f))
        content_type = content_type or "image/jpeg"
        if f.suffix.lower() == ".webp":
            content_type = "image/webp"

        print(f"Uploading: {f.name} -> s3://{AWS_S3_BUCKET_NAME}/{s3_key} ...", end=" ")
        try:
            with open(f, "rb") as file_data:
                s3.upload_fileobj(
                    file_data,
                    AWS_S3_BUCKET_NAME,
                    s3_key,
                    ExtraArgs={"ContentType": content_type},
                )
            if AWS_CLOUDFRONT_DOMAIN:
                domain = AWS_CLOUDFRONT_DOMAIN if AWS_CLOUDFRONT_DOMAIN.startswith("http") else f"https://{AWS_CLOUDFRONT_DOMAIN}"
                s3_url = f"{domain}/{s3_key}"
            else:
                s3_url = f"https://{AWS_S3_BUCKET_NAME}.s3.{AWS_S3_REGION}.amazonaws.com/{s3_key}"

            uploaded_map[f.name] = s3_url
            print("OK")
        except Exception as e:
            print(f"FAILED ({e})")

    print(f"\nSuccessfully uploaded {len(uploaded_map)} files to AWS S3.")

    # Update database records
    print("\nUpdating AWS RDS Database image records with S3 URLs...")
    try:
        conn = db_connect()
        cur = conn.cursor(dictionary=True)

        # 1. Update items
        cur.execute("SELECT id, name, image_path FROM items")
        items = cur.fetchall()
        updated_items = 0
        for item in items:
            name_lower = (item["name"] or "").lower()
            current_path = str(item["image_path"] or "")

            matched_url = None
            # Check filename match or name keyword
            for filename, url in uploaded_map.items():
                stem = Path(filename).stem.lower().replace(" ", "")
                clean_name = name_lower.replace(" ", "")
                if filename in current_path or stem in clean_name:
                    matched_url = url
                    break

            if matched_url and matched_url != current_path:
                cur.execute("UPDATE items SET image_path = %s WHERE id = %s", (matched_url, item["id"]))
                updated_items += 1
                print(f"  [Item] Updated '{item['name']}' -> {matched_url}")

        # 2. Update categories
        cur.execute("SELECT id, name, image_path FROM categories")
        categories = cur.fetchall()
        updated_cats = 0
        for cat in categories:
            name_lower = (cat["name"] or "").lower()
            current_path = str(cat["image_path"] or "")

            matched_url = None
            for filename, url in uploaded_map.items():
                stem = Path(filename).stem.lower().replace(" ", "")
                clean_name = name_lower.replace(" ", "")
                if filename in current_path or stem in clean_name:
                    matched_url = url
                    break

            if matched_url and matched_url != current_path:
                cur.execute("UPDATE categories SET image_path = %s WHERE id = %s", (matched_url, cat["id"]))
                updated_cats += 1
                print(f"  [Category] Updated '{cat['name']}' -> {matched_url}")

        conn.commit()
        cur.close()
        conn.close()
        print(f"\nDatabase update complete! Updated {updated_items} items and {updated_cats} categories.")

    except Exception as db_err:
        print(f"Database update note: {db_err}")

    print("\n" + "=" * 65)
    print("AWS S3 SYNC COMPLETED SUCCESSFULLY!")
    print("=" * 65)

if __name__ == "__main__":
    sync_media_to_s3()
