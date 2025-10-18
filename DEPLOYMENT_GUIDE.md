# 🚀 Deployment Guide - VPS + Supabase

## Hướng Dẫn Deploy Lên VPS với Supabase

### Tổng Quan

**Stack:**
- **Backend:** VPS (Railway/Render/DigitalOcean)
- **Frontend:** Vercel/Netlify (hoặc cùng VPS)
- **Database:** Supabase (PostgreSQL managed)
- **Redis:** Upstash (optional, cho caching)

## 🗄️ BƯỚC 1: Setup Supabase

### 1.1 Tạo Project

1. Truy cập: https://supabase.com
2. Sign up/Login (dùng GitHub)
3. Click **"New Project"**
4. Điền thông tin:
   - **Name:** `glossary-tool`
   - **Database Password:** Đặt password mạnh (ghi nhớ!)
   - **Region:** Singapore hoặc gần nhất
5. Wait 1-2 phút để project setup

### 1.2 Lấy Database URL

1. Vào project vừa tạo
2. Click **Settings** → **Database**
3. Scroll xuống **Connection String**
4. Chọn tab **"URI"**
5. Copy connection string:
   ```
   postgresql://postgres.[ref]:[password]@db.[region].supabase.com:5432/postgres
   ```

### 1.3 Run Migrations

```bash
# Local machine
cd apps/backend

# Update .env với Supabase URL
DATABASE_URL="postgresql://postgres.[ref]:[password]@..."

# Run migrations
npx prisma migrate deploy

# Seed data (tạo admin account)
npx prisma db seed
```

**Output:**
```
✅ Created ADMIN user: admin
   Email: admin@glossary-tool.com
   Password: admin123

✅ Created DEMO user: demo
   Email: demo@glossary-tool.com
   Password: demo123
```

**⚠️ GHI NHỚ ADMIN CREDENTIALS!**

## 🖥️ BƯỚC 2: Deploy Backend lên VPS

### Option A: Railway (Khuyến Nghị - Dễ Nhất)

**2.1 Prepare:**

```bash
# Tạo .env.production
cd apps/backend
cp .env.example .env.production

# Edit .env.production
DATABASE_URL="postgresql://..." # Supabase URL
OPENROUTER_API_KEY="sk-or-v1-..."
JWT_SECRET="random-secret-production"
NODE_ENV="production"
CORS_ORIGIN="https://your-frontend.vercel.app"
```

**2.2 Deploy:**

1. Visit https://railway.app
2. Sign up với GitHub
3. Click **"New Project"**
4. **"Deploy from GitHub repo"**
5. Chọn `glossary-tool` repository
6. **Root Directory:** `apps/backend`
7. **Build Command:** `npm run build`
8. **Start Command:** `npm start`

**2.3 Add Environment Variables:**

Railway Dashboard → Variables:
```
DATABASE_URL=postgresql://...
OPENROUTER_API_KEY=sk-or-v1-...
JWT_SECRET=your-secret
PORT=3001
NODE_ENV=production
```

**2.4 Deploy:**
- Railway tự động deploy
- URL: `https://glossary-backend.railway.app`

### Option B: DigitalOcean / Linode VPS

**2.1 Tạo Droplet:**

1. Tạo Ubuntu 22.04 droplet
2. SSH vào server:
   ```bash
   ssh root@your-vps-ip
   ```

**2.2 Install Dependencies:**

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PM2
npm install -g pm2

# Install Git
apt install -y git
```

**2.3 Clone & Setup:**

```bash
# Clone repo
cd /var/www
git clone <your-repo-url>
cd glossary-tool

# Install dependencies
npm install

# Build backend
cd apps/backend
npm run build

# Setup .env
nano .env
# Paste production config
```

**2.4 Start với PM2:**

```bash
# Start app
pm2 start dist/index.js --name glossary-backend

# Save PM2 config
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs glossary-backend
```

**2.5 Setup Nginx:**

```bash
# Install Nginx
apt install -y nginx

# Config
nano /etc/nginx/sites-available/glossary-tool
```

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/glossary-tool /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**2.6 SSL với Certbot:**

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL
certbot --nginx -d api.yourdomain.com

# Auto-renew
certbot renew --dry-run
```

## 🌐 BƯỚC 3: Deploy Frontend

### Option A: Vercel (Khuyến Nghị)

1. Visit https://vercel.com
2. Sign up với GitHub
3. **"New Project"**
4. Import `glossary-tool` repo
5. **Root Directory:** `apps/frontend`
6. **Framework:** Vite
7. **Build Command:** `npm run build`
8. **Output Directory:** `dist`

**Environment Variables:**
```
VITE_API_URL=https://glossary-backend.railway.app
```

**Deploy:** Automatic!

URL: `https://glossary-tool.vercel.app`

### Option B: Netlify

Similar to Vercel:
1. https://netlify.com
2. Import repo
3. Build settings:
   - Base directory: `apps/frontend`
   - Build command: `npm run build`
   - Publish directory: `dist`

## 🔐 BƯỚC 4: Security & Final Config

### 4.1 Update CORS

Backend `.env`:
```env
CORS_ORIGIN="https://glossary-tool.vercel.app,https://yourdomain.com"
```

### 4.2 Update Frontend API URL

Frontend `.env.production`:
```env
VITE_API_URL=https://glossary-backend.railway.app
```

### 4.3 Secure JWT Secret

```bash
# Generate random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Use in production .env
JWT_SECRET="generated-random-string"
```

## 📊 BƯỚC 5: First Login

1. Visit `https://glossary-tool.vercel.app`
2. Redirect to `/login`
3. Login với admin account:
   - Email: `admin@glossary-tool.com`
   - Password: `admin123`
4. ✅ Success! Full access!

## 🔧 Maintenance

### Update Code

```bash
# VPS
cd /var/www/glossary-tool
git pull
cd apps/backend
npm install
npm run build
pm2 restart glossary-backend
```

### Database Migrations

```bash
cd apps/backend
npx prisma migrate deploy
```

### Logs

```bash
# PM2 logs
pm2 logs glossary-backend

# Nginx logs
tail -f /var/log/nginx/error.log
```

## 💰 Cost Estimate

**Monthly:**
- Supabase: **Free** (500MB database, 2GB transfer)
- Railway: **$5** (Hobby plan)
- Vercel: **Free** (hobby projects)
- Domain: **$10-15/year**

**Total: ~$5/month + domain**

## 🎯 Production Checklist

- [x] Supabase database setup
- [x] Migrations deployed
- [x] Admin account created
- [ ] Backend deployed to VPS/Railway
- [ ] Frontend deployed to Vercel
- [ ] Environment variables configured
- [ ] CORS updated
- [ ] SSL certificates installed
- [ ] Custom domain (optional)
- [ ] Backup strategy

## 🔐 Admin Account

**Credentials:**
```
Email: admin@glossary-tool.com
Password: admin123
Role: ADMIN (full permissions)
```

**⚠️ CHANGE PASSWORD sau khi login lần đầu!**

## 🆘 Troubleshooting

### Database Connection Error

```
Error: Can't reach database server
```

→ Check Supabase connection string
→ Verify IP allowlist (Supabase allows all by default)

### CORS Error

```
Access to fetch blocked by CORS policy
```

→ Update CORS_ORIGIN trong backend .env
→ Restart backend

### Build Failed

→ Check Node version (need 20+)
→ Run `npm install` lại
→ Check build logs

---

## 🎉 Deployment Complete!

**Your app is now LIVE:**
- Frontend: https://glossary-tool.vercel.app
- Backend: https://glossary-backend.railway.app
- Database: Supabase (managed)

**Admin login ready:**
- Email: admin@glossary-tool.com
- Password: admin123

**🎮 Ready to translate games in production!**
