# Deployment Guide

Complete guide for deploying the Enterprise E-commerce Platform to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [One-Click Deployment](#one-click-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Production Deployment](#production-deployment)
8. [Post-Deployment](#post-deployment)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: 18.0.0 or higher
- **npm**: 9.0.0 or higher
- **Docker**: 20.10.0 or higher
- **Docker Compose**: 2.0.0 or higher
- **Git**: 2.30.0 or higher

### System Requirements

**Minimum:**
- CPU: 2 cores
- RAM: 4 GB
- Storage: 20 GB

**Recommended:**
- CPU: 4+ cores
- RAM: 8+ GB
- Storage: 50+ GB SSD

## Environment Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd siteJadid
```

### 2. Environment Variables

Create `.env` file from template:

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# Application
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Database
DATABASE_URL="postgresql://username:password@host:5432/database"

# Redis
REDIS_URL="redis://host:6379"

# Elasticsearch
ELASTICSEARCH_NODE="http://host:9200"

# NextAuth
NEXTAUTH_URL=https://yourdomain.com
NEXTAUTH_SECRET=<generate-random-secret>

# Stripe
STRIPE_SECRET_KEY=sk_live_your_live_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Email
EMAIL_SERVER_HOST=smtp.yourprovider.com
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER=your-email@domain.com
EMAIL_SERVER_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

**Generate NextAuth Secret:**
```bash
openssl rand -base64 32
```

## Database Setup

### PostgreSQL

#### Option 1: Managed Database (Recommended)
Use managed PostgreSQL services:
- AWS RDS
- Google Cloud SQL
- Azure Database
- DigitalOcean Managed Databases
- Supabase
- Neon
- Railway

#### Option 2: Self-Hosted

Using Docker:
```bash
docker run -d \
  --name ecommerce-postgres \
  -e POSTGRES_USER=ecommerce_user \
  -e POSTGRES_PASSWORD=secure_password \
  -e POSTGRES_DB=ecommerce_db \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgres:16-alpine
```

### Redis

#### Option 1: Managed Redis
- AWS ElastiCache
- Google Cloud Memorystore
- Azure Cache for Redis
- Redis Cloud
- Upstash

#### Option 2: Self-Hosted
```bash
docker run -d \
  --name ecommerce-redis \
  -p 6379:6379 \
  -v redis_data:/data \
  redis:7-alpine redis-server --appendonly yes
```

### Elasticsearch

#### Option 1: Managed Elasticsearch
- Elastic Cloud
- AWS OpenSearch
- Bonsai

#### Option 2: Self-Hosted
```bash
docker run -d \
  --name ecommerce-elasticsearch \
  -e "discovery.type=single-node" \
  -e "ES_JAVA_OPTS=-Xms512m -Xmx512m" \
  -p 9200:9200 \
  -v elasticsearch_data:/usr/share/elasticsearch/data \
  docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

## One-Click Deployment

The easiest way to deploy:

```bash
bash scripts/deploy.sh
```

This script will:
1. ✅ Install dependencies
2. ✅ Start Docker services
3. ✅ Generate Prisma Client
4. ✅ Run database migrations
5. ✅ Seed database with sample data
6. ✅ Build application

## Manual Deployment

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Database Migration

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database (optional for production)
npm run prisma:seed
```

### Step 3: Build Application

```bash
npm run build
```

### Step 4: Start Application

```bash
npm run start
```

Application will be available at http://localhost:3000

## Docker Deployment

### Development

```bash
docker-compose up -d
```

### Production

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    restart: always
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    ports:
      - "3000:3000"
    depends_on:
      - postgres
      - redis
      - elasticsearch

  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    restart: always
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms1g -Xmx1g"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
```

Deploy:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## Production Deployment

### Platform Options

#### 1. Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Configure environment variables in Vercel dashboard.

**Note**: Use external databases (not Docker) for Vercel.

#### 2. AWS

**Using AWS Elastic Beanstalk:**

1. Install EB CLI
2. Initialize EB
3. Deploy

```bash
eb init
eb create production
eb deploy
```

**Using AWS ECS:**

1. Build Docker image
2. Push to ECR
3. Create ECS service
4. Deploy

#### 3. Google Cloud Platform

**Using Cloud Run:**

```bash
# Build image
gcloud builds submit --tag gcr.io/PROJECT_ID/ecommerce

# Deploy
gcloud run deploy ecommerce \
  --image gcr.io/PROJECT_ID/ecommerce \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 4. DigitalOcean

**Using App Platform:**

1. Connect GitHub repository
2. Configure build settings
3. Set environment variables
4. Deploy

#### 5. Self-Hosted VPS

On Ubuntu 22.04:

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install PM2
sudo npm install -g pm2

# Clone repository
git clone <repository-url>
cd siteJadid

# Install dependencies
npm install

# Setup environment
cp .env.example .env
nano .env

# Start services
docker-compose up -d

# Build application
npm run build

# Start with PM2
pm2 start npm --name "ecommerce" -- start
pm2 save
pm2 startup
```

### SSL Certificate

Using Let's Encrypt with Certbot:

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### Nginx Configuration

Create `/etc/nginx/sites-available/ecommerce`:

```nginx
upstream app {
    server localhost:3000;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://app;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/ecommerce /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Post-Deployment

### 1. Health Checks

Create health check endpoint at `/api/health`:

```typescript
export async function GET() {
  return Response.json({
    status: 'ok',
    timestamp: new Date().toISOString()
  });
}
```

### 2. Monitoring

Set up monitoring:
- Application: Sentry, LogRocket
- Infrastructure: Datadog, New Relic
- Uptime: UptimeRobot, Pingdom

### 3. Backups

**Database Backup:**
```bash
# Create backup script
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Schedule with cron
0 2 * * * /path/to/backup-script.sh
```

### 4. Initialize Elasticsearch

```bash
curl -X POST http://localhost:3000/api/admin/reindex
```

### 5. Create Admin Account

If not using seed data:

```bash
npx prisma studio
# Create user with SUPER_ADMIN role
```

### 6. Test Deployment

- ✅ Homepage loads
- ✅ Products page works
- ✅ Search functionality
- ✅ Login/Register
- ✅ Add to cart
- ✅ Checkout process
- ✅ Admin dashboard
- ✅ Payment processing

## Troubleshooting

### Database Connection Issues

```bash
# Test PostgreSQL connection
psql $DATABASE_URL

# Check Prisma connection
npx prisma db pull
```

### Redis Connection Issues

```bash
# Test Redis connection
redis-cli -u $REDIS_URL ping
```

### Elasticsearch Issues

```bash
# Check Elasticsearch status
curl http://localhost:9200/_cluster/health
```

### Build Failures

```bash
# Clear cache
rm -rf .next node_modules
npm install
npm run build
```

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Memory Issues

Increase Node.js memory:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Security Checklist

- [ ] Environment variables secured
- [ ] Database credentials rotated
- [ ] SSL certificate installed
- [ ] Firewall configured
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Security headers set
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitoring alerts configured

## Performance Optimization

### 1. Enable Caching

Nginx caching configuration already included.

### 2. CDN Setup

Use CDN for static assets:
- Cloudflare
- AWS CloudFront
- Fastly

### 3. Database Optimization

```sql
-- Create indexes
CREATE INDEX idx_products_status ON products(status);
CREATE INDEX idx_orders_user ON orders(user_id);
```

### 4. Image Optimization

Configure Next.js image optimization in `next.config.js`.

## Scaling

### Horizontal Scaling

Run multiple app instances behind load balancer:

```yaml
services:
  app:
    replicas: 3
    deploy:
      mode: replicated
```

### Database Scaling

- Read replicas for PostgreSQL
- Redis clustering
- Elasticsearch cluster

## Support

For deployment issues:
- Email: devops@ecommerce.com
- Docs: https://docs.ecommerce.com
- Community: https://community.ecommerce.com

---

**Last Updated**: 2024-01-01
