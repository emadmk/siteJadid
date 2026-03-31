"""
Fix 3M Product UOM (Unit of Measure)
Reads Excel file and outputs a JSON mapping of SKU → correct priceUnit
Then a JS script applies it.

Usage:
  python3 scripts/fix-3m-uom.py > /tmp/3m-uom-fixes.json
  node scripts/apply-3m-uom.js                    # dry run
  node scripts/apply-3m-uom.js --apply             # apply
"""
import json
import openpyxl

UOM_MAP = {
    'Each': 'ea',
    'Roll': 'roll',
    'Case': 'case',
    'Carton': 'carton',
    'Pack': 'pack',
    'Bag': 'bag',
    'Sheet': 'sheet',
    'Kit': 'kit',
    'Pair': 'pair',
    'Assortment': 'set',
    'Drum': 'drum',
}

wb = openpyxl.load_workbook('3M Item List - (Mar-26)-Working- Phase 1.xlsx', data_only=True)
ws = wb.active

fixes = {}
for row in ws.iter_rows(min_row=2, values_only=True):
    sku = row[2]  # Customer Part Number (3M-XXXXXXX)
    sales_uom = row[3]  # Sales UOM

    if not sku or not sales_uom:
        continue

    mapped = UOM_MAP.get(sales_uom, sales_uom.lower())

    # Only include non-"ea" UOMs (since most are already "ea" in DB)
    if mapped != 'ea':
        fixes[str(sku)] = mapped

print(json.dumps(fixes, indent=2))
