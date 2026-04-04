# 18. Deployment & Infrastructure

## Server Details

| Spec | Value |
|------|-------|
| **Provider** | Hetzner VPS |
| **IP** | 5.161.228.136 |
| **OS** | Ubuntu 22.04 LTS |
| **CPU** | Shared vCPU |
| **RAM** | 32 GB |
| **Disk** | 225 GB SSD |
| **Node.js** | v22.22.0 |

## Architecture

```
Internet → Nginx (80/443) → Next.js (3000) via PM2
                          → Grainger Dashboard (9876)
           Docker:
             ├── PostgreSQL 16 (5432)
             ├── Redis 7 (6379)
             └── Elasticsearch 8.11 (9200)
```

## PM2 Services

| ID | Name | Port | Script |
|----|------|------|--------|
| 0 | `adasupply` | 3000 | `npm start` (next start) |
| 1 | `grainger-dashboard` | 9876 | `scripts/grainger-dashboard.js` |

### PM2 Commands

```bash
pm2 list                    # Show all services
pm2 restart adasupply       # Restart main app
pm2 restart all             # Restart everything
pm2 logs adasupply          # View app logs
pm2 logs --lines 50         # Last 50 lines all
pm2 monit                   # Live monitoring
```

## Docker Services

```bash
docker ps                   # List running containers
docker-compose up -d        # Start all services
docker-compose down         # Stop all services
docker-compose logs postgres # View DB logs
```

### Container IDs (current)

| Container | Image | ID |
|-----------|-------|----|
| PostgreSQL | postgres:16-alpine | ab0329d7240a |
| Redis | redis:7-alpine | 0b696430c768 |
| Elasticsearch | elasticsearch:8.11.0 | b89679052b70 |

## Deployment Workflow

### Standard Deploy (code changes)

```bash
cd /var/www/siteJadid
git fetch origin claude/fix-order-access-permissions-IZI23
git merge origin/claude/fix-order-access-permissions-IZI23
npm run build
pm2 restart adasupply
```

### Deploy with DB Changes

```bash
cd /var/www/siteJadid
git fetch origin BRANCH && git merge origin/BRANCH
npx prisma db push          # Apply schema changes
npm run build
pm2 restart all
```

### Deploy with ES Re-index

```bash
cd /var/www/siteJadid
git fetch origin BRANCH && git merge origin/BRANCH
npm run build
pm2 restart adasupply
ELASTICSEARCH_NODE=http://127.0.0.1:9200 node scripts/es-index-products.js
```

## Backup

### Database Backup

```bash
# Create backup
docker exec ab0329d7240a pg_dump -U ecommerce_user ecommerce_db > ~/backup_$(date +%Y%m%d).sql

# Check size
ls -lh ~/backup_*.sql

# Restore
docker exec -i ab0329d7240a psql -U ecommerce_user ecommerce_db < ~/backup_file.sql
```

### File Backup

```bash
# Product images
tar -czf ~/uploads_backup.tar.gz /var/www/siteJadid/public/uploads/

# Grainger images (stored outside public/)
ls -lh /root/grainger-images/   # Standard quality (166K files, 3.2GB)
ls -lh /root/grainger-hq-images/ # High quality
```

## Environment File

Location: `/var/www/siteJadid/.env`

**Critical**: Never commit `.env` to git. Keep a secure backup.

## Firewall (UFW)

```bash
ufw status                  # Check firewall
ufw allow 9876/tcp          # Open Grainger dashboard port
```

Open ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 9876 (Grainger dashboard)

## SSL/TLS

Managed via Nginx + Let's Encrypt (certbot) for `adasupply.com`.

## Troubleshooting

| Issue | Solution |
|-------|----------|
| 502 Bad Gateway | `pm2 restart adasupply` |
| Build fails | Check `npm run build` output for errors |
| DB connection error | `docker ps` → check postgres running |
| ES search not working | Check `.env` has `ELASTICSEARCH_NODE=http://127.0.0.1:9200` |
| Stack overflow on start | Check `public/uploads/` for too many files (move to /root/) |
| Site shows old data | `npm run build && pm2 restart adasupply` |

---

*Next: [19 - Cheat Sheet](./19-cheatsheet.md)*
