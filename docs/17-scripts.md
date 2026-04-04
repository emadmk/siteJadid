# 17. Scripts & Utilities

All scripts are in the `scripts/` directory.

## Elasticsearch

### `es-index-products.js`
Index all active products into Elasticsearch.

```bash
ELASTICSEARCH_NODE=http://127.0.0.1:9200 node scripts/es-index-products.js
```

- Deletes old index, creates new with mappings
- Bulk indexes in batches of 500
- Includes brand, category, TAA status

**When to run**: After bulk imports, initial setup, or to refresh search index.

## 3M Product Tools

### `fix-3m-prices.js`
Fix prices that were incorrectly multiplied by minOrderQty during import.

```bash
node scripts/fix-3m-prices.js           # Dry run (preview)
node scripts/fix-3m-prices.js --apply   # Apply changes
```

### `fix-3m-uom.py` + `apply-3m-uom.js`
Fix Unit of Measure (ea → case/carton/roll based on Excel data).

```bash
python3 scripts/fix-3m-uom.py > /tmp/3m-uom-fixes.json
node scripts/apply-3m-uom.js            # Dry run
node scripts/apply-3m-uom.js --apply    # Apply
```

## Image Import

### `import-3m-images.ts`
Match images to 3M products by SKU (with 3M- prefix handling).

```bash
# Unzip images to import-3m-images/
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/import-3m-images.ts
```

### `import-3m-images-batch2.ts`
Second batch with multi-image support (SKU-2.jpg for additional images).

```bash
npx ts-node --compiler-options '{"module":"commonjs"}' scripts/import-3m-images-batch2.ts
```

## Grainger Image Downloader

### `grainger-download.js`
Download standard quality product images from Grainger URLs.

```bash
node scripts/grainger-download.js start    # Start
node scripts/grainger-download.js resume   # Resume (skip existing)
node scripts/grainger-download.js status   # Check progress
node scripts/grainger-download.js stop     # Stop gracefully
node scripts/grainger-download.js errors   # Show error log

# Background mode:
nohup node scripts/grainger-download.js start > /tmp/grainger-download.log 2>&1 &
```

### `grainger-download-hq.js`
Download high-quality (original) images. Same commands as above.
Files saved with `_HQ` suffix in `public/uploads/grainger-hq/`.

### `grainger-dashboard.js`
Web dashboard to monitor downloads. Runs on port 9876.

```bash
pm2 start scripts/grainger-dashboard.js --name grainger-dashboard
# Access: http://SERVER_IP:9876 (password: 110110)
```

Features: Progress bar, speed/ETA, error log, Start/Stop/Resume buttons.

## Database

### Backup
```bash
docker exec ab0329d7240a pg_dump -U ecommerce_user ecommerce_db > ~/backup_$(date +%Y%m%d).sql
```

### Restore
```bash
docker exec -i ab0329d7240a psql -U ecommerce_user ecommerce_db < ~/backup_file.sql
```

---

*Next: [18 - Deployment](./18-deployment.md)*
