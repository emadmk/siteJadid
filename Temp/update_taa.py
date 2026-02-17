#!/usr/bin/env python3
"""
TAA/BAA Approved Updater
========================
Reads Excel files with TAA-approved items and sets taaApproved=true
on matching products in the database (by product SKU/style).

Only ADDS taa approval - never removes existing approvals.

Usage:
  python3 update_taa.py              # Dry run (no changes)
  python3 update_taa.py --apply      # Apply changes
"""

import sys
import os
import subprocess
from datetime import datetime

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

EXCEL_FILES = [
    {
        "file": os.path.join(SCRIPT_DIR, "Occunomix - List of TAA Items.xlsx"),
        "sheet": "Sheet1",
        "header_row": 1,       # Row 1 is header
        "data_start_row": 2,   # Data starts at row 2
        "style_col": 0,        # Column A = STYLE (product SKU)
        "sku_col": 1,          # Column B = Sku (variant-level, for reference)
    },
    {
        "file": os.path.join(SCRIPT_DIR, "PIP - List of TAA Items.xlsx"),
        "sheet": "Sheet1",
        "header_row": 5,       # Row 5 is header
        "data_start_row": 6,   # Data starts at row 6
        "style_col": 1,        # Column B = STYLE (product SKU)
        "sku_col": 2,          # Column C = SKU (variant-level, for reference)
    },
]

DRY_RUN = "--apply" not in sys.argv

# ---------------------------------------------------------------------------
# Database connection via environment or .env file
# ---------------------------------------------------------------------------
def get_db_url():
    url = os.environ.get("DATABASE_URL")
    if url:
        return url
    # Try to read from .env in project root
    env_path = os.path.join(SCRIPT_DIR, "..", ".env")
    if os.path.exists(env_path):
        with open(env_path) as f:
            for line in f:
                line = line.strip()
                if line.startswith("DATABASE_URL="):
                    val = line.split("=", 1)[1].strip().strip('"').strip("'")
                    return val
    return None

def clean_db_url(url):
    """Remove Prisma-specific query params (e.g. ?schema=public) that psycopg2 doesn't understand."""
    if "?" in url:
        url = url.split("?")[0]
    return url

# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    try:
        import openpyxl
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "openpyxl"])
        import openpyxl

    try:
        import psycopg2
    except ImportError:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary"])
        import psycopg2

    mode = "DRY RUN (no changes)" if DRY_RUN else "APPLY (will update database)"
    print("=" * 70)
    print(f"  TAA/BAA APPROVED UPDATE SCRIPT")
    print(f"  Mode: {mode}")
    print(f"  Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70)

    # Step 1: Read Excel files - collect unique product styles (SKUs)
    print("[1/5] Reading Excel files...")
    taa_styles = set()
    taa_variant_skus = set()

    for cfg in EXCEL_FILES:
        fname = os.path.basename(cfg["file"])
        wb = openpyxl.load_workbook(cfg["file"], read_only=True)
        ws = wb[cfg["sheet"]]
        count = 0
        for row in ws.iter_rows(min_row=cfg["data_start_row"], values_only=True):
            style = row[cfg["style_col"]]
            sku = row[cfg["sku_col"]]
            if style:
                taa_styles.add(str(style).strip())
            if sku:
                taa_variant_skus.add(str(sku).strip())
            count += 1
        wb.close()
        print(f"  {fname}: {count} rows, styles found: {len(taa_styles)}")

    print(f"  Total unique styles (product SKUs): {len(taa_styles)}")
    print(f"  Total unique variant SKUs: {len(taa_variant_skus)}")

    # Step 2: Connect to database
    print("[2/5] Connecting to database...")
    db_url = get_db_url()
    if not db_url:
        print("  ERROR: DATABASE_URL not found. Set it as environment variable or in .env")
        print("  Example: DATABASE_URL='postgresql://user:pass@localhost:5432/dbname' python3 update_taa.py")
        sys.exit(1)

    db_url = clean_db_url(db_url)
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()
    print("  Database connection OK")

    # Step 3: Find matching products
    print("[3/5] Finding matching products in database...")

    # Get all products with their current taaApproved status
    cur.execute('SELECT sku, "taaApproved" FROM "Product"')
    db_products = {}
    for row in cur.fetchall():
        db_products[row[0]] = row[1]  # sku -> taaApproved

    print(f"  Total products in DB: {len(db_products)}")

    # Match by style/SKU
    matched = []
    already_approved = []
    not_found = []

    for style in sorted(taa_styles):
        if style in db_products:
            if db_products[style]:
                already_approved.append(style)
            else:
                matched.append(style)
        else:
            not_found.append(style)

    # Step 4: Report
    print("[4/5] UPDATE REPORT")
    print("=" * 70)
    print(f"  Styles in Excel:              {len(taa_styles)}")
    print(f"  Already TAA approved in DB:   {len(already_approved)}")
    print(f"  Need to SET taaApproved=true: {len(matched)}")
    print(f"  Styles NOT found in DB:       {len(not_found)}")

    if matched:
        print(f"\n  --- Products to UPDATE (first 30 of {len(matched)}) ---")
        for s in matched[:30]:
            print(f"    {s}: taaApproved false → true")
        if len(matched) > 30:
            print(f"    ... and {len(matched) - 30} more")

    if already_approved:
        print(f"\n  --- Already approved (no change, first 20 of {len(already_approved)}) ---")
        for s in already_approved[:20]:
            print(f"    {s}: taaApproved = true (unchanged)")
        if len(already_approved) > 20:
            print(f"    ... and {len(already_approved) - 20} more")

    if not_found:
        print(f"\n  --- Styles NOT found in DB (first 20 of {len(not_found)}) ---")
        for s in not_found[:20]:
            print(f"    {s}")
        if len(not_found) > 20:
            print(f"    ... and {len(not_found) - 20} more")

    print("=" * 70)

    # Step 5: Apply or dry run
    if DRY_RUN:
        print("  DRY RUN complete. No changes were made.")
        print("  To apply changes, run:")
        print("    python3 update_taa.py --apply")

        # Save SQL for review
        sql_path = os.path.join(SCRIPT_DIR, "taa_updates.sql")
        with open(sql_path, "w") as f:
            f.write(f"-- TAA/BAA Update SQL - Generated {datetime.now()}\n")
            f.write(f"-- {len(matched)} products to update\n\n")
            if matched:
                skus_sql = ", ".join(f"'{s}'" for s in matched)
                f.write(f'UPDATE "Product" SET "taaApproved" = true WHERE sku IN ({skus_sql});\n')
            f.write(f"\n-- {len(already_approved)} products already approved (no change needed)\n")
        print(f"  SQL saved to: {sql_path}")
    else:
        if not matched:
            print("  Nothing to update - all matching products already have taaApproved=true")
        else:
            # Backup first
            backup_path = os.path.join(SCRIPT_DIR, f"taa_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.sql")
            skus_sql = ", ".join(f"'{s}'" for s in matched)

            # Save backup of current state
            cur.execute(f'SELECT sku, "taaApproved" FROM "Product" WHERE sku IN ({skus_sql})')
            with open(backup_path, "w") as f:
                f.write(f"-- BACKUP: TAA state before update - {datetime.now()}\n")
                for row in cur.fetchall():
                    f.write(f'UPDATE "Product" SET "taaApproved" = {str(row[1]).lower()} WHERE sku = \'{row[0]}\';\n')
            print(f"  Backup saved to: {backup_path}")

            # Apply update
            sql = f'UPDATE "Product" SET "taaApproved" = true WHERE sku IN ({skus_sql})'
            cur.execute(sql)
            updated = cur.rowcount
            conn.commit()
            print(f"  APPLIED: {updated} products updated (taaApproved = true)")

    cur.close()
    conn.close()
    print("=" * 70)

if __name__ == "__main__":
    main()
