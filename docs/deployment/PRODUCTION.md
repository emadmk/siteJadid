# Production Deployment Guide

## Server Requirements

- Ubuntu/Debian Linux (20.04 LTS or higher)
- Node.js 18.x or higher
- PostgreSQL 14 or higher
- Redis 6.x or higher
- Nginx (for reverse proxy)
- PM2 (process manager)
- 4GB RAM minimum
- 40GB disk space

## Pre-Deployment Steps

### 1. Clone Repository
```bash
cd /home/user
git clone https://github.com/your-repo/siteJadid.git
cd siteJadid
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
```bash
cp .env.example .env
nano .env
```

**Required Variables:**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/sitejadid"
NEXTAUTH_SECRET="generate-random-secret"
NEXTAUTH_URL="https://yourdomain.com"
REDIS_HOST="localhost"
REDIS_PORT="6379"
STRIPE_SECRET_KEY="sk_live_..."
```

### 4. Database Setup
```bash
# Create database
sudo -u postgres psql
CREATE DATABASE sitejadid;
CREATE USER siteuser WITH PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE sitejadid TO siteuser;
\q

# Apply schema
npx prisma db push

# Or with migrations
npx prisma migrate deploy
```

### 5. Build Application
```bash
npm run build
```

## PM2 Deployment

### 1. Install PM2
```bash
npm install -g pm2
```

### 2. Start Application
```bash
pm2 start npm --name "siteJadid" -- start
```

### 3. Configure Startup
```bash
pm2 startup
pm2 save
```

### 4. PM2 Commands
```bash
pm2 restart siteJadid
pm2 stop siteJadid
pm2 delete siteJadid
pm2 logs siteJadid
pm2 monit
```

## Nginx Configuration

### 1. Install Nginx
```bash
sudo apt update
sudo apt install nginx
```

### 2. Configure Site
```bash
sudo nano /etc/nginx/sites-available/sitejadid
```

**Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 3. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/sitejadid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Database Backup

### Automatic Daily Backup
```bash
nano /home/user/backup-db.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
pg_dump -U siteuser sitejadid | gzip > $BACKUP_DIR/sitejadid_$DATE.sql.gz
# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete
```

```bash
chmod +x /home/user/backup-db.sh
crontab -e
# Add: 0 2 * * * /home/user/backup-db.sh
```

## Monitoring

### PM2 Monitoring
```bash
pm2 monit
pm2 list
pm2 info siteJadid
```

### Logs
```bash
pm2 logs siteJadid --lines 100
```

## Updates & Maintenance

### Deploy Updates
```bash
cd /home/user/siteJadid
git pull
npm install
npx prisma generate
npm run build
pm2 restart siteJadid
```

## Security Checklist

- ✅ Firewall configured (UFW)
- ✅ SSL certificate installed
- ✅ Database secured (no remote access)
- ✅ Redis password set
- ✅ Environment variables secured
- ✅ Regular backups scheduled
- ✅ PM2 startup configured
- ✅ Nginx rate limiting enabled

## Troubleshooting

### App Won't Start
```bash
pm2 logs siteJadid
# Check for errors in logs
```

### Database Connection Issues
```bash
sudo systemctl status postgresql
# Verify DATABASE_URL in .env
```

### Redis Issues
```bash
sudo systemctl status redis
redis-cli ping
```

**Last Updated:** November 2024
