# چک‌لیست سریع مهاجرت سرور

## قبل از شروع
- [ ] IP سرور جدید را یادداشت کنید: `_______________`
- [ ] دسترسی SSH به سرور جدید تست شده
- [ ] پسورد دیتابیس جدید: `_______________`

---

## بکاپ (سرور فعلی: 104.234.46.217)

```bash
# 1. بکاپ دیتابیس
pg_dump -U postgres -d DATABASE_NAME -F c -f ~/db_backup.dump

# 2. بکاپ uploads
tar -czvf ~/uploads.tar.gz /path/to/uploads/

# 3. بکاپ .env
cp /path/to/.env ~/env_backup
```

- [ ] دیتابیس بکاپ شد
- [ ] پوشه uploads بکاپ شد
- [ ] فایل .env بکاپ شد

---

## سرور جدید

### نصب نرم‌افزارها
```bash
# Update system
apt update && apt upgrade -y

# Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# PostgreSQL
apt install -y postgresql postgresql-contrib

# Nginx & Certbot
apt install -y nginx certbot python3-certbot-nginx

# PM2
npm install -g pm2
```

- [ ] Node.js نصب شد
- [ ] PostgreSQL نصب شد
- [ ] Nginx نصب شد
- [ ] PM2 نصب شد

---

### انتقال و تنظیم

```bash
# Clone project
cd /var/www
git clone YOUR_REPO adasupply
cd adasupply

# Restore database
sudo -u postgres createdb adasupply_db
sudo -u postgres pg_restore -d adasupply_db /root/db_backup.dump

# Copy uploads
cp -r /root/uploads/* /var/www/adasupply/public/uploads/
chown -R www-data:www-data /var/www/adasupply/public/uploads/

# Setup .env
nano .env  # Copy and edit from backup

# Install & Build
npm install
npx prisma generate
npm run build
```

- [ ] پروژه clone شد
- [ ] دیتابیس restore شد
- [ ] فایل‌های upload کپی شد
- [ ] فایل .env تنظیم شد
- [ ] npm install انجام شد
- [ ] پروژه build شد

---

### تنظیم DNS (در پنل دامنه)

| Type | Host | Value |
|------|------|-------|
| A | @ | IP_SERVER_JADID |
| A | www | IP_SERVER_JADID |

- [ ] DNS تنظیم شد
- [ ] DNS propagate شد (چک با: dnschecker.org)

---

### Nginx & SSL

```bash
# Create Nginx config
nano /etc/nginx/sites-available/adasupply

# Enable site
ln -s /etc/nginx/sites-available/adasupply /etc/nginx/sites-enabled/
nginx -t && systemctl restart nginx

# Get SSL
certbot --nginx -d adasupply.com -d www.adasupply.com
```

- [ ] Nginx تنظیم شد
- [ ] SSL فعال شد

---

### راه‌اندازی

```bash
# Start with PM2
pm2 start npm --name "adasupply" -- start
pm2 save
pm2 startup
```

- [ ] PM2 شروع شد
- [ ] سایت با HTTPS باز می‌شود

---

## تست نهایی

- [ ] https://adasupply.com باز می‌شود
- [ ] لاگین کار می‌کند
- [ ] تصاویر نمایش داده می‌شوند
- [ ] پرداخت کار می‌کند

---

## Environment Variables (.env)

```env
DATABASE_URL="postgresql://postgres:PASSWORD@localhost:5432/adasupply_db"
NEXT_PUBLIC_APP_URL="https://adasupply.com"
NEXTAUTH_URL="https://adasupply.com"
NEXTAUTH_SECRET="GENERATE_WITH_openssl_rand_-base64_32"
STRIPE_SECRET_KEY="sk_live_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_live_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
```
