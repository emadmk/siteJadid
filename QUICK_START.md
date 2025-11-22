# 🚀 Quick Start Guide

**Get SiteJadid E-commerce Platform running in minutes!**

---

## 📋 Table of Contents

1. [Option 1: Automated Installation (Recommended)](#option-1-automated-installation-recommended)
2. [Option 2: Docker Installation](#option-2-docker-installation)
3. [Option 3: Manual Installation](#option-3-manual-installation)
4. [First-Time Setup](#first-time-setup)
5. [Verify Installation](#verify-installation)
6. [Common Commands](#common-commands)
7. [Troubleshooting](#troubleshooting)

---

## Option 1: Automated Installation (Recommended)

**One-command installation for Ubuntu/Debian servers.**

### Prerequisites
- Ubuntu 20.04+ or Debian 10+
- 4GB RAM minimum
- 40GB disk space
- sudo privileges

### Installation

```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/your-repo/siteJadid/main/install.sh | bash

# Or download first, then run
wget https://raw.githubusercontent.com/your-repo/siteJadid/main/install.sh
chmod +x install.sh
./install.sh
```

### What It Does
- ✅ Updates system packages
- ✅ Installs Node.js 18.x
- ✅ Installs PostgreSQL 14
- ✅ Installs Redis 6.x
- ✅ Installs Nginx
- ✅ Installs PM2
- ✅ Creates database and user
- ✅ Configures environment variables
- ✅ Builds application
- ✅ Sets up PM2 auto-restart
- ✅ Configures Nginx reverse proxy
- ✅ Optionally sets up SSL certificate

### After Installation

1. Visit: `http://your-domain.com/setup-admin`
2. Create admin account
3. Configure Stripe keys in `.env`
4. Start selling!

---

## Option 2: Docker Installation

**Easiest way to run locally or in production.**

### Prerequisites
- Docker 20.10+
- Docker Compose 2.0+

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/your-repo/siteJadid.git
cd siteJadid

# 2. Copy environment file
cp .env.docker.example .env.docker

# 3. Edit environment variables
nano .env.docker
# Update DB_PASSWORD, REDIS_PASSWORD, NEXTAUTH_SECRET, Stripe keys

# 4. Generate secrets
openssl rand -base64 32  # Use this for NEXTAUTH_SECRET

# 5. Start all services
docker-compose --env-file .env.docker up -d

# 6. Wait for services to be healthy (30-60 seconds)
docker-compose ps

# 7. Run database migrations
docker-compose exec app npx prisma db push

# 8. Visit application
open http://localhost:3000
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f app

# Restart app
docker-compose restart app

# Execute command in container
docker-compose exec app npm run build

# Database backup
docker-compose exec postgres pg_dump -U siteuser sitejadid > backup.sql

# Remove everything (including data)
docker-compose down -v
```

---

## Option 3: Manual Installation

**Step-by-step manual installation for any Linux system.**

### 1. Install Dependencies

#### Node.js 18.x
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version  # Should be v18.x.x
```

#### PostgreSQL 14+
```bash
sudo apt-get install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Redis 6.x
```bash
sudo apt-get install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 2. Setup Database

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE sitejadid;
CREATE USER siteuser WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE sitejadid TO siteuser;
ALTER USER siteuser CREATEDB;
\q
```

### 3. Clone & Install

```bash
# Clone repository
git clone https://github.com/your-repo/siteJadid.git
cd siteJadid

# Install dependencies
npm install
```

### 4. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Generate secrets
openssl rand -base64 32  # For NEXTAUTH_SECRET

# Edit .env file
nano .env
```

**Required Variables:**
```env
DATABASE_URL="postgresql://siteuser:your_secure_password@localhost:5432/sitejadid"
NEXTAUTH_SECRET="generated_secret_here"
NEXTAUTH_URL="http://localhost:3000"
REDIS_HOST="localhost"
REDIS_PORT="6379"
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
```

### 5. Setup Database Schema

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database
npx prisma db push

# OR use migrations
npx prisma migrate dev
```

### 6. Build & Run

```bash
# Development mode
npm run dev

# OR Production mode
npm run build
npm start
```

### 7. Setup PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start npm --name "siteJadid" -- start

# Save PM2 configuration
pm2 save

# Setup auto-restart on boot
pm2 startup
# Run the command it outputs

# View status
pm2 status
pm2 logs siteJadid
```

### 8. Setup Nginx (Optional)

```bash
# Install Nginx
sudo apt-get install -y nginx

# Create site configuration
sudo nano /etc/nginx/sites-available/sitejadid
```

**Nginx Configuration:**
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

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/sitejadid /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 9. Setup SSL (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## First-Time Setup

### 1. Create Admin Account

Visit: `http://localhost:3000/setup-admin` (or your domain)

Fill in:
- Email
- Password
- Name

This creates the first SUPER_ADMIN user.

### 2. Configure Stripe

1. Get your Stripe keys from https://dashboard.stripe.com/test/apikeys
2. Update `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```
3. Restart application:
   ```bash
   pm2 restart siteJadid
   # OR
   docker-compose restart app
   ```

### 3. Add Your First Product

1. Login as admin
2. Go to `/admin/products/new`
3. Fill in:
   - SKU
   - Name
   - Description
   - Base Price
   - Stock Quantity
   - Category
   - Images
4. Set status to **ACTIVE**
5. Save

### 4. Create Categories

1. Go to `/admin/categories`
2. Click "Create Category"
3. Add categories:
   - Head Protection
   - Eye Protection
   - Hand Protection
   - etc.

### 5. Configure Shipping Methods

1. Go to `/admin/settings`
2. Add shipping methods:
   - Standard Shipping
   - Express Shipping
   - Free Shipping (over $100)

---

## Verify Installation

### Health Checks

```bash
# Check if all services are running

# Node.js
node --version

# PostgreSQL
sudo systemctl status postgresql
psql -U siteuser -d sitejadid -c "SELECT version();"

# Redis
redis-cli ping  # Should return PONG

# Nginx (if installed)
sudo systemctl status nginx

# PM2 (if installed)
pm2 status

# Application
curl http://localhost:3000
```

### Database Verification

```bash
# Connect to database
psql -U siteuser -d sitejadid

# Check tables
\dt

# Check user table
SELECT COUNT(*) FROM "User";

# Exit
\q
```

### Application Verification

Open browser and visit:
- Homepage: `http://localhost:3000/`
- Admin: `http://localhost:3000/admin`
- API Health: `http://localhost:3000/api/health` (you may need to create this)

---

## Common Commands

### Development

```bash
# Start dev server
npm run dev

# Run linter
npm run lint

# Type check
npm run type-check

# Format code
npm run format
```

### Database

```bash
# Open Prisma Studio
npx prisma studio

# Generate Prisma Client
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name

# Deploy migrations
npx prisma migrate deploy

# Reset database (DANGER: Deletes all data)
npx prisma migrate reset
```

### Production

```bash
# Build application
npm run build

# Start production server
npm start

# PM2 commands
pm2 restart siteJadid
pm2 stop siteJadid
pm2 logs siteJadid
pm2 monit

# View logs
tail -f logs/error.log
```

### Docker

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Logs
docker-compose logs -f

# Rebuild
docker-compose up -d --build

# Execute commands
docker-compose exec app npm run build
```

---

## Troubleshooting

### Application Won't Start

```bash
# Check logs
pm2 logs siteJadid
# OR
docker-compose logs app

# Check port 3000
lsof -i :3000
# Kill process if needed
kill -9 PID

# Check environment variables
cat .env
# Make sure DATABASE_URL is correct

# Rebuild
npm run build
pm2 restart siteJadid
```

### Database Connection Failed

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Test connection
psql -U siteuser -d sitejadid -h localhost

# Check DATABASE_URL format
# postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Prisma Client Not Found

```bash
# Regenerate Prisma Client
npx prisma generate

# Make sure schema is synced
npx prisma db push
```

### Redis Connection Failed

```bash
# Check Redis is running
sudo systemctl status redis

# Test connection
redis-cli ping

# Check credentials
redis-cli -a your_password ping

# Restart Redis
sudo systemctl restart redis
```

### Build Errors

```bash
# Clear caches
rm -rf .next node_modules
npm install
npx prisma generate
npm run build
```

### Permission Errors (Docker)

```bash
# Fix permissions
sudo chown -R $USER:$USER .

# Rebuild containers
docker-compose down
docker-compose up -d --build
```

---

## Next Steps

1. **Read Full Documentation:**
   - [Complete API Reference](docs/api/COMPLETE_API_REFERENCE.md)
   - [Database Schema](docs/database/COMPLETE_SCHEMA.md)
   - [Frontend Guide](docs/frontend/COMPLETE_FRONTEND_GUIDE.md)
   - [Cheat Sheet](docs/COMPLETE_CHEATSHEET.md)

2. **Configure Features:**
   - B2B customer groups
   - Tiered pricing
   - Loyalty program
   - GSA contracts

3. **Customize:**
   - Update branding
   - Add your products
   - Configure payment methods
   - Set up email templates

4. **Go Live:**
   - Configure domain
   - Setup SSL
   - Update Stripe to live keys
   - Test checkout process
   - Enable production mode

---

## Support

- **Documentation:** `/docs`
- **Issues:** GitHub Issues
- **Email:** support@yoursite.com

---

**🎉 Congratulations! Your e-commerce platform is ready!**

**Last Updated:** November 2024
