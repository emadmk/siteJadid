# Deployment Guide - Grainger-Level E-Commerce Platform

## Prerequisites
- Node.js 18+ installed
- PostgreSQL database
- Git repository access

## Step 1: Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd siteJadid

# Checkout the production-ready branch
git checkout claude/edited-01-01QoDMcC1W5ms4K9SdtbDBJ9

# Install dependencies
npm install
```

## Step 2: Environment Setup

Create `.env` file in root directory:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/sitejadid?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-generate-with-openssl-rand-base64-32"

# Optional: Email Configuration (for order notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@yoursite.com"

# Optional: Payment Gateway
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLIC_KEY="pk_test_..."

# Optional: File Upload
UPLOAD_DIR="/uploads"
MAX_FILE_SIZE="10485760"
```

## Step 3: Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Push schema to database (creates all tables)
npx prisma db push

# Optional: Seed initial data
npx prisma db seed
```

## Step 4: Verify TypeScript

```bash
# Check for TypeScript errors
npx tsc --noEmit
```

## Step 5: Build the Application

```bash
# Production build
npm run build
```

## Step 6: Run the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
# Start production server
npm start
```

## Step 7: Database Migrations (Production)

For production deployments, use migrations instead of `db push`:

```bash
# Create migration from current schema
npx prisma migrate dev --name init

# Apply migrations to production
npx prisma migrate deploy
```

## Step 8: Initial Admin User Setup

After first deployment, create admin user via Prisma Studio or SQL:

```bash
# Open Prisma Studio
npx prisma studio
```

Or run this SQL directly:

```sql
-- Create admin user
INSERT INTO "User" (id, name, email, "emailVerified", "accountType", "isActive")
VALUES (
  'admin-001',
  'Admin User',
  'admin@yoursite.com',
  NOW(),
  'B2B',
  true
);

-- Set admin role (you'll need to hash password separately)
-- Use NextAuth to create proper password hash
```

## Production Deployment Options

### Option 1: Vercel (Recommended for Next.js)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

Set environment variables in Vercel dashboard.

### Option 2: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/next.config.js ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:

```bash
# Build Docker image
docker build -t sitejadid .

# Run container
docker run -p 3000:3000 --env-file .env sitejadid
```

### Option 3: PM2 (Production Server)

```bash
# Install PM2 globally
npm install -g pm2

# Build the app
npm run build

# Start with PM2
pm2 start npm --name "sitejadid" -- start

# Save PM2 config
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

## Post-Deployment Checklist

- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Admin user created
- [ ] SMTP configured (for emails)
- [ ] Payment gateway configured
- [ ] File upload directory writable
- [ ] SSL certificate installed (HTTPS)
- [ ] Domain DNS configured
- [ ] Backup strategy implemented

## Database Backup

```bash
# Backup PostgreSQL database
pg_dump -U username -d sitejadid > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
psql -U username -d sitejadid < backup_YYYYMMDD_HHMMSS.sql
```

## Monitoring

```bash
# Check PM2 logs
pm2 logs sitejadid

# Monitor performance
pm2 monit

# Check application health
curl http://localhost:3000/api/health
```

## Troubleshooting

### Issue: Prisma Client errors
```bash
# Regenerate Prisma Client
npx prisma generate
npm run build
```

### Issue: Database connection errors
- Verify DATABASE_URL in .env
- Check PostgreSQL is running
- Verify firewall allows connection

### Issue: Build errors
```bash
# Clear cache and rebuild
rm -rf .next
npm run build
```

## Security Recommendations

1. **Change NEXTAUTH_SECRET**: Generate strong secret
   ```bash
   openssl rand -base64 32
   ```

2. **Database Security**: Use strong passwords, restrict access

3. **HTTPS Only**: Always use SSL in production

4. **Rate Limiting**: Implement API rate limiting

5. **Regular Updates**: Keep dependencies updated
   ```bash
   npm audit
   npm audit fix
   ```

## Performance Optimization

1. **Enable caching**: Configure Redis for session storage

2. **CDN**: Use CDN for static assets

3. **Database indexing**: Already configured in Prisma schema

4. **Image optimization**: Next.js Image component already used

## Support

For issues or questions:
- Check logs: `pm2 logs` or `docker logs`
- Review TypeScript errors: `npx tsc --noEmit`
- Database issues: `npx prisma studio`
