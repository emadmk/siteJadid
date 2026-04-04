# 19. Cheat Sheet

## Quick Commands

### Deploy
```bash
cd /var/www/siteJadid
git fetch origin BRANCH && git merge origin/BRANCH
npm run build && pm2 restart adasupply
```

### Deploy + DB changes
```bash
npx prisma db push && npm run build && pm2 restart all
```

### Restart
```bash
pm2 restart adasupply          # App only
pm2 restart all                # App + dashboard
pm2 restart grainger-dashboard # Dashboard only
```

### Logs
```bash
pm2 logs adasupply --lines 30  # App logs
pm2 logs --err --lines 20      # Errors only
```

### Database
```bash
# Backup
docker exec ab0329d7240a pg_dump -U ecommerce_user ecommerce_db > ~/backup_$(date +%Y%m%d).sql

# Prisma Studio (DB GUI)
npx prisma studio

# Quick query
node -e "
const { PrismaClient } = require('/var/www/siteJadid/node_modules/@prisma/client');
const db = new PrismaClient();
db.product.count({ where: { status: 'ACTIVE' } }).then(c => { console.log('Active:', c); db.\$disconnect(); });
"
```

### Elasticsearch
```bash
# Re-index all products
ELASTICSEARCH_NODE=http://127.0.0.1:9200 node scripts/es-index-products.js

# Check index
curl -s http://127.0.0.1:9200/_cat/indices -u elastic:PASSWORD

# Test search
curl -s 'http://127.0.0.1:9200/products/_search' \
  -u elastic:PASSWORD \
  -H 'Content-Type: application/json' \
  -d '{"query":{"multi_match":{"query":"tape","fields":["name^3","sku^2"]}},"size":3}'
```

### Grainger Images
```bash
# Dashboard: http://5.161.228.136:9876 (pass: 110110)
node scripts/grainger-download.js status   # Check progress
node scripts/grainger-download.js stop     # Stop
node scripts/grainger-download.js resume   # Resume
```

### Docker
```bash
docker ps                      # Running containers
docker-compose up -d           # Start services
docker-compose down            # Stop services
docker exec -it ab0329d7240a psql -U ecommerce_user ecommerce_db  # DB shell
```

## Key URLs

| URL | Description |
|-----|-------------|
| `https://adasupply.com` | Live site |
| `https://adasupply.com/admin` | Admin panel |
| `http://5.161.228.136:9876` | Grainger dashboard |
| `https://dashboard.stripe.com` | Stripe dashboard |
| `https://dash.cloudflare.com` | Turnstile settings |

## File Locations

| What | Path |
|------|------|
| App code | `/var/www/siteJadid/` |
| Environment | `/var/www/siteJadid/.env` |
| Product images | `/var/www/siteJadid/public/uploads/products/` |
| Grainger images (std) | `/root/grainger-images/` |
| Grainger images (HQ) | `/root/grainger-hq-images/` |
| DB backups | `/root/backup_*.sql` |
| PM2 logs | `~/.pm2/logs/` |
| Prisma schema | `/var/www/siteJadid/prisma/schema.prisma` |

## Common Fixes

### Site 502 / Won't Start
```bash
pm2 logs adasupply --err --lines 20  # Check error
npm run build                         # Rebuild
pm2 restart adasupply                 # Restart
```

### "Stack overflow" on Start
Too many files in `public/`. Move large image folders:
```bash
mv public/uploads/grainger /root/grainger-images
pm2 restart adasupply
```

### Search Not Working
```bash
# Check ES is running
curl -s http://127.0.0.1:9200 -u elastic:PASSWORD

# Check .env
grep ELASTICSEARCH /var/www/siteJadid/.env
# Must be: ELASTICSEARCH_NODE="http://127.0.0.1:9200" (not localhost!)

# Re-index
ELASTICSEARCH_NODE=http://127.0.0.1:9200 node scripts/es-index-products.js
```

### Build Type Error
Usually TypeScript issue. Check the exact error line and fix. Common:
- `string | null` mismatch: add `as any` or optional chaining `?.`
- Missing import: add the import
- `'use client'` must be first line (before `export const dynamic`)

### Email Not Sending
```bash
grep EMAIL /var/www/siteJadid/.env  # Check config
# Test: go to admin → Settings → Email → Send Test
```

### Prices Wrong After Import
```bash
node scripts/fix-3m-prices.js        # Preview
node scripts/fix-3m-prices.js --apply # Fix
```

## API Quick Test

```bash
# Search
curl -s 'http://localhost:3000/api/search?q=tape' | python3 -m json.tool | head -20

# Product count
curl -s 'http://localhost:3000/api/storefront/products?limit=1' | python3 -c "import sys,json;print(json.load(sys.stdin)['total'])"

# Health check
curl -s http://localhost:3000 -o /dev/null -w "%{http_code}"
```

## Git Workflow

```bash
# Current branch
git branch

# Pull latest
git fetch origin BRANCH
git merge origin/BRANCH

# View recent commits
git log --oneline -10

# Check uncommitted changes
git status
git diff --stat
```

---

*Next: [20 - Glossary](./20-glossary.md)*
