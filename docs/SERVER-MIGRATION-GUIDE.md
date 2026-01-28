# راهنمای مهاجرت سرور - ADA Supply
## انتقال به سرور جدید و اتصال دامنه adasupply.com

---

## فهرست مطالب
1. [پیش‌نیازها](#1-پیش-نیازها)
2. [بکاپ از سرور فعلی](#2-بکاپ-از-سرور-فعلی)
3. [آماده‌سازی سرور جدید](#3-آماده-سازی-سرور-جدید)
4. [انتقال فایل‌ها](#4-انتقال-فایل‌ها)
5. [تنظیم دیتابیس](#5-تنظیم-دیتابیس)
6. [تنظیم Environment Variables](#6-تنظیم-environment-variables)
7. [اتصال دامنه](#7-اتصال-دامنه)
8. [تنظیم SSL](#8-تنظیم-ssl)
9. [راه‌اندازی اپلیکیشن](#9-راه-اندازی-اپلیکیشن)
10. [تست نهایی](#10-تست-نهایی)

---

## 1. پیش‌نیازها

### سرور جدید باید داشته باشد:
- **سیستم‌عامل**: Ubuntu 22.04 LTS (پیشنهادی)
- **RAM**: حداقل 4GB (پیشنهادی 8GB)
- **CPU**: حداقل 2 Core
- **Storage**: حداقل 50GB SSD
- **پورت‌های باز**: 22 (SSH), 80 (HTTP), 443 (HTTPS), 5432 (PostgreSQL)

### نرم‌افزارهای مورد نیاز:
- Node.js 18.x یا بالاتر
- PostgreSQL 14 یا بالاتر
- Nginx
- PM2 (Process Manager)
- Certbot (برای SSL)
- Git

---

## 2. بکاپ از سرور فعلی

### 2.1 بکاپ دیتابیس PostgreSQL

```bash
# در سرور فعلی (104.234.46.217)
ssh root@104.234.46.217

# بکاپ کامل دیتابیس
pg_dump -U postgres -h localhost -d your_database_name -F c -b -v -f ~/backup_$(date +%Y%m%d_%H%M%S).dump

# یا با فرمت SQL (قابل خواندن)
pg_dump -U postgres -h localhost -d your_database_name > ~/backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2.2 بکاپ فایل‌های آپلود شده

```bash
# بکاپ پوشه uploads
tar -czvf ~/uploads_backup_$(date +%Y%m%d).tar.gz /path/to/your/app/public/uploads/

# یا فقط کپی
cp -r /path/to/your/app/public/uploads ~/uploads_backup/
```

### 2.3 بکاپ فایل‌های تنظیمات

```bash
# بکاپ فایل .env
cp /path/to/your/app/.env ~/env_backup_$(date +%Y%m%d)

# بکاپ تنظیمات Nginx
cp /etc/nginx/sites-available/your-site ~/nginx_backup_$(date +%Y%m%d)

# بکاپ PM2 ecosystem (اگر وجود دارد)
cp /path/to/your/app/ecosystem.config.js ~/pm2_backup_$(date +%Y%m%d)
```

### 2.4 لیست فایل‌های مهم برای بکاپ

| فایل/پوشه | توضیح | اهمیت |
|-----------|-------|-------|
| `دیتابیس PostgreSQL` | تمام داده‌های سایت | **حیاتی** |
| `public/uploads/` | تصاویر محصولات و آپلودها | **حیاتی** |
| `.env` | متغیرهای محیطی | **حیاتی** |
| `prisma/schema.prisma` | ساختار دیتابیس | مهم |
| `/etc/nginx/sites-available/*` | تنظیمات Nginx | مهم |
| `ecosystem.config.js` | تنظیمات PM2 | متوسط |

---

## 3. آماده‌سازی سرور جدید

### 3.1 آپدیت سیستم

```bash
# اتصال به سرور جدید
ssh root@NEW_SERVER_IP

# آپدیت سیستم
apt update && apt upgrade -y
```

### 3.2 نصب Node.js 18.x

```bash
# نصب Node.js از NodeSource
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt install -y nodejs

# بررسی نسخه
node -v  # باید v18.x.x باشد
npm -v
```

### 3.3 نصب PostgreSQL

```bash
# نصب PostgreSQL
apt install -y postgresql postgresql-contrib

# شروع سرویس
systemctl start postgresql
systemctl enable postgresql

# تنظیم پسورد برای کاربر postgres
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'YOUR_STRONG_PASSWORD';"

# ساخت دیتابیس جدید
sudo -u postgres createdb adasupply_db
```

### 3.4 نصب Nginx

```bash
apt install -y nginx
systemctl start nginx
systemctl enable nginx
```

### 3.5 نصب PM2

```bash
npm install -g pm2
```

### 3.6 نصب Certbot (برای SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

### 3.7 نصب Git

```bash
apt install -y git
```

---

## 4. انتقال فایل‌ها

### 4.1 انتقال بکاپ دیتابیس به سرور جدید

```bash
# از کامپیوتر خود یا سرور قدیم
scp ~/backup_*.dump root@NEW_SERVER_IP:/root/

# یا با rsync (سریع‌تر برای فایل‌های بزرگ)
rsync -avz --progress ~/backup_*.dump root@NEW_SERVER_IP:/root/
```

### 4.2 انتقال فایل‌های آپلود

```bash
# انتقال پوشه uploads
scp -r ~/uploads_backup root@NEW_SERVER_IP:/root/

# یا با rsync
rsync -avz --progress ~/uploads_backup/ root@NEW_SERVER_IP:/root/uploads_backup/
```

### 4.3 کلون کردن پروژه از Git

```bash
# در سرور جدید
cd /var/www
git clone https://github.com/YOUR_USERNAME/siteJadid.git adasupply
cd adasupply
```

### 4.4 کپی فایل‌های آپلود به پروژه

```bash
# کپی uploads به مسیر پروژه
cp -r /root/uploads_backup/* /var/www/adasupply/public/uploads/

# تنظیم دسترسی‌ها
chown -R www-data:www-data /var/www/adasupply/public/uploads/
chmod -R 755 /var/www/adasupply/public/uploads/
```

---

## 5. تنظیم دیتابیس

### 5.1 ریستور دیتابیس

```bash
# ریستور از فایل dump
sudo -u postgres pg_restore -d adasupply_db -v /root/backup_*.dump

# یا اگر فایل SQL دارید
sudo -u postgres psql -d adasupply_db < /root/backup_*.sql
```

### 5.2 بررسی دیتابیس

```bash
# اتصال به دیتابیس
sudo -u postgres psql -d adasupply_db

# لیست جداول
\dt

# خروج
\q
```

---

## 6. تنظیم Environment Variables

### 6.1 ساخت فایل .env

```bash
cd /var/www/adasupply
nano .env
```

### 6.2 محتوای فایل .env

```env
# Database
DATABASE_URL="postgresql://postgres:YOUR_DB_PASSWORD@localhost:5432/adasupply_db"

# App URL - مهم: این باید با دامنه جدید تنظیم شود
NEXT_PUBLIC_APP_URL="https://adasupply.com"

# NextAuth
NEXTAUTH_URL="https://adasupply.com"
NEXTAUTH_SECRET="یک_رشته_تصادفی_طولانی_و_امن"

# Stripe (از داشبورد Stripe کپی کنید)
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (SMTP)
SMTP_HOST="smtp.your-provider.com"
SMTP_PORT="587"
SMTP_USER="your-email@domain.com"
SMTP_PASSWORD="your-email-password"
SMTP_FROM="noreply@adasupply.com"

# Elasticsearch (اختیاری)
ELASTICSEARCH_NODE="http://localhost:9200"

# Upload limits
MAX_FILE_SIZE="10485760"
```

### 6.3 تولید NEXTAUTH_SECRET

```bash
# تولید یک secret تصادفی
openssl rand -base64 32
```

---

## 7. اتصال دامنه

### 7.1 تنظیمات DNS در پنل دامنه

در پنل مدیریت دامنه (مثل Namecheap، GoDaddy، یا ایرانی‌ها مثل ایرنیک):

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A | @ | IP_SERER_JADID | 300 |
| A | www | IP_SERVER_JADID | 300 |
| CNAME | www | adasupply.com | 300 |

### 7.2 بررسی انتشار DNS

```bash
# بررسی A Record
dig adasupply.com +short
# باید IP سرور جدید را نشان دهد

# بررسی www
dig www.adasupply.com +short

# یا از سایت‌های آنلاین:
# https://dnschecker.org
# https://whatsmydns.net
```

**توجه**: انتشار DNS ممکن است 5 دقیقه تا 48 ساعت طول بکشد.

---

## 8. تنظیم SSL

### 8.1 تنظیم Nginx (قبل از SSL)

```bash
# ساخت فایل کانفیگ Nginx
nano /etc/nginx/sites-available/adasupply
```

**محتوای فایل:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name adasupply.com www.adasupply.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Static files
    location /uploads {
        alias /var/www/adasupply/public/uploads;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    client_max_body_size 50M;
}
```

### 8.2 فعال‌سازی سایت

```bash
# لینک به sites-enabled
ln -s /etc/nginx/sites-available/adasupply /etc/nginx/sites-enabled/

# حذف default (اختیاری)
rm /etc/nginx/sites-enabled/default

# تست کانفیگ
nginx -t

# ری‌استارت Nginx
systemctl restart nginx
```

### 8.3 دریافت SSL با Certbot

```bash
# دریافت گواهی SSL
certbot --nginx -d adasupply.com -d www.adasupply.com

# پاسخ به سوالات:
# - ایمیل: your-email@example.com
# - قبول شرایط: Y
# - اشتراک ایمیل: N (یا Y)
# - ریدایرکت HTTP به HTTPS: 2 (Redirect)
```

### 8.4 تنظیم تمدید خودکار SSL

```bash
# تست تمدید
certbot renew --dry-run

# اضافه کردن به cron (معمولاً خودکار اضافه می‌شود)
crontab -e
# اضافه کنید:
0 0 1 * * /usr/bin/certbot renew --quiet
```

---

## 9. راه‌اندازی اپلیکیشن

### 9.1 نصب وابستگی‌ها

```bash
cd /var/www/adasupply

# نصب packages
npm install

# یا با yarn
# yarn install
```

### 9.2 Generate Prisma Client

```bash
npx prisma generate
```

### 9.3 بیلد پروژه

```bash
npm run build
```

### 9.4 تنظیم PM2

```bash
# ساخت فایل ecosystem
nano ecosystem.config.js
```

**محتوای فایل:**

```javascript
module.exports = {
  apps: [
    {
      name: 'adasupply',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/adasupply',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    }
  ]
};
```

### 9.5 شروع اپلیکیشن

```bash
# شروع با PM2
pm2 start ecosystem.config.js --env production

# ذخیره تنظیمات PM2
pm2 save

# تنظیم استارت خودکار
pm2 startup
```

### 9.6 بررسی وضعیت

```bash
# وضعیت PM2
pm2 status

# لاگ‌ها
pm2 logs adasupply

# مانیتورینگ
pm2 monit
```

---

## 10. تست نهایی

### 10.1 چک‌لیست تست

- [ ] سایت با https://adasupply.com باز می‌شود
- [ ] ریدایرکت از http به https کار می‌کند
- [ ] ریدایرکت از www به non-www (یا بالعکس) کار می‌کند
- [ ] صفحه اصلی لود می‌شود
- [ ] تصاویر محصولات نمایش داده می‌شوند
- [ ] لاگین ادمین کار می‌کند
- [ ] ثبت سفارش کار می‌کند
- [ ] پرداخت Stripe کار می‌کند
- [ ] ایمیل‌ها ارسال می‌شوند

### 10.2 بررسی SSL

```bash
# بررسی گواهی SSL
curl -vI https://adasupply.com 2>&1 | grep -A 6 "Server certificate"

# یا از سایت آنلاین:
# https://www.ssllabs.com/ssltest/
```

### 10.3 بررسی Performance

```bash
# بررسی زمان پاسخ
curl -o /dev/null -s -w "Time: %{time_total}s\n" https://adasupply.com
```

---

## دستورات مفید

### ری‌استارت سرویس‌ها

```bash
# ری‌استارت اپلیکیشن
pm2 restart adasupply

# ری‌استارت Nginx
systemctl restart nginx

# ری‌استارت PostgreSQL
systemctl restart postgresql
```

### بررسی لاگ‌ها

```bash
# لاگ اپلیکیشن
pm2 logs adasupply --lines 100

# لاگ Nginx
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# لاگ سیستم
journalctl -xe
```

### آپدیت اپلیکیشن

```bash
cd /var/www/adasupply
git pull origin main
npm install
npm run build
pm2 restart adasupply
```

---

## عیب‌یابی مشکلات رایج

### مشکل 1: 502 Bad Gateway
```bash
# بررسی PM2
pm2 status
pm2 logs adasupply

# ری‌استارت
pm2 restart adasupply
```

### مشکل 2: دیتابیس وصل نمی‌شود
```bash
# بررسی PostgreSQL
systemctl status postgresql

# بررسی اتصال
psql -U postgres -h localhost -d adasupply_db
```

### مشکل 3: تصاویر لود نمی‌شوند
```bash
# بررسی دسترسی‌ها
ls -la /var/www/adasupply/public/uploads/

# تنظیم دسترسی
chown -R www-data:www-data /var/www/adasupply/public/uploads/
```

### مشکل 4: SSL کار نمی‌کند
```bash
# بررسی گواهی
certbot certificates

# تمدید دستی
certbot renew
```

---

## تماس و پشتیبانی

در صورت بروز مشکل:
1. لاگ‌های PM2 و Nginx را بررسی کنید
2. فایل .env را چک کنید
3. دسترسی‌های فایل‌ها را بررسی کنید
4. وضعیت سرویس‌ها را چک کنید

---

**آخرین به‌روزرسانی**: $(date +%Y-%m-%d)

**نسخه**: 1.0
