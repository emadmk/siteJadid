# Quick Start - دستورات سریع نصب

## نصب سریع (Quick Installation)

### 1. نصب Dependencies
```bash
npm install
```

### 2. تنظیم Environment Variables
ایجاد فایل `.env` در root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/sitejadid"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-command-below"
```

برای تولید NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. راه‌اندازی Database
```bash
# تولید Prisma Client
npx prisma generate

# ایجاد جداول در Database
npx prisma db push

# (اختیاری) باز کردن Prisma Studio برای مشاهده دیتابیس
npx prisma studio
```

### 4. اجرای پروژه

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
# ساخت نسخه Production
npm run build

# اجرای Production
npm start
```

---

## دستورات مهم (Important Commands)

### چک کردن TypeScript
```bash
npx tsc --noEmit
```

### مدیریت Database

```bash
# Generate Prisma Client (بعد از تغییر schema)
npx prisma generate

# Push schema to database (Development)
npx prisma db push

# Create migration (Production)
npx prisma migrate dev --name migration_name

# Apply migrations (Production)
npx prisma migrate deploy

# Open database viewer
npx prisma studio
```

### Build و Deploy

```bash
# Build برای Production
npm run build

# Test production build locally
npm start

# چک کردن خطاها
npm run lint
npx tsc --noEmit
```

### Git Commands

```bash
# چک کردن وضعیت
git status

# کامیت تغییرات
git add .
git commit -m "your message"

# Push to remote
git push origin claude/edited-01-01QoDMcC1W5ms4K9SdtbDBJ9
```

---

## ترتیب نصب اولیه (First Time Setup)

```bash
# 1. Clone repository
git clone <your-repo>
cd siteJadid

# 2. Checkout branch
git checkout claude/edited-01-01QoDMcC1W5ms4K9SdtbDBJ9

# 3. Install
npm install

# 4. Setup .env file
# (ایجاد فایل .env و پر کردن متغیرها)

# 5. Database setup
npx prisma generate
npx prisma db push

# 6. Run dev
npm run dev
```

پروژه روی http://localhost:3000 اجرا می‌شود

---

## Deployment به Production

### گزینه 1: Vercel (ساده‌ترین)
```bash
npm i -g vercel
vercel login
vercel --prod
```

### گزینه 2: PM2 (Server)
```bash
npm install -g pm2
npm run build
pm2 start npm --name "sitejadid" -- start
pm2 save
```

### گزینه 3: Docker
```bash
docker build -t sitejadid .
docker run -p 3000:3000 --env-file .env sitejadid
```

---

## مشکلات رایج (Troubleshooting)

### خطای Prisma Client
```bash
npx prisma generate
npm run build
```

### خطای Build
```bash
rm -rf .next
rm -rf node_modules
npm install
npm run build
```

### خطای Database Connection
- چک کردن DATABASE_URL در .env
- مطمئن شوید PostgreSQL در حال اجرا است
- چک کردن username/password

---

## Features Implemented ✅

- ✅ Multi-user B2B system
- ✅ Approval workflows
- ✅ Quote management
- ✅ Contract management
- ✅ Purchase orders
- ✅ Shopping lists
- ✅ Wishlist
- ✅ Product comparison
- ✅ Bulk order entry
- ✅ Analytics & reports
- ✅ Email campaigns
- ✅ Complete APIs
- ✅ Admin panels
- ✅ Customer portals
- ✅ GSA dashboard

Total: 51 files (42 new, 9 modified)
