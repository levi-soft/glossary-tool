# 🔧 Troubleshooting Guide

## Lỗi: "Failed to create project"

### Nguyên Nhân Phổ Biến

#### 1. Backend chưa chạy hoặc crashed

**Kiểm tra:**
```bash
# Mở browser
http://localhost:3001/health
```

**Kết quả mong đợi:**
```json
{"status":"ok","timestamp":"...","version":"1.0.0"}
```

**Nếu không kết nối được:**
- Backend chưa chạy hoặc đã crash
- Kiểm tra terminal đang chạy backend
- Tìm lỗi màu đỏ

**Giải pháp:**
```bash
cd C:\Users\Admin\Documents\glossary-tool
npm run dev:backend
```

#### 2. Database migration chưa chạy

**Triệu chứng:**
- Backend console có lỗi: "Table does not exist"
- Backend console có lỗi: "Invalid `prisma.project.create()`"

**Giải pháp:**
```bash
cd apps/backend

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Nếu lỗi, reset database và migrate lại
npx prisma migrate reset
npx prisma migrate dev
```

#### 3. Database connection failed

**Triệu chứng:**
- Backend console: "Can't reach database server"
- Backend console: "Authentication failed"

**Giải pháp:**

**A. Kiểm tra PostgreSQL đang chạy:**
```cmd
# Windows: Mở Services (Win + R → services.msc)
# Tìm "postgresql-x64-16"
# Status phải là "Running"
```

**B. Kiểm tra DATABASE_URL trong .env:**
```env
# Mở apps/backend/.env
# Kiểm tra username, password, database name

# Format đúng:
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/glossary_tool?schema=public"
```

**C. Test connection:**
```bash
cd apps/backend
npx prisma db push
```

#### 4. Validation Error

**Triệu chứng:**
- Toast message: "Validation error"
- Backend console: ZodError

**Nguyên nhân:**
- Form data không hợp lệ
- Thiếu field required

**Kiểm tra:**
- Tên project phải có ít nhất 1 ký tự
- gameFormat, sourceLang, targetLang phải có

#### 5. User/Owner Issue

**Triệu chứng:**
- Backend console: "Foreign key constraint failed"
- Error về `ownerId`

**Nguyên nhân:**
- User chưa tồn tại trong database

**Giải pháp:**
```bash
# Chạy seed để tạo default user
cd apps/backend
npm run seed
```

## 🔍 Debug Step-by-Step

### Step 1: Kiểm tra Backend Health

```bash
# Terminal
curl http://localhost:3001/health

# Hoặc mở browser
http://localhost:3001/health
```

**Nếu thấy `{"status":"ok",...}`** → Backend OK, chuyển Step 2
**Nếu không kết nối được** → Xem phần "Backend chưa chạy"

### Step 2: Kiểm tra Database

```bash
cd apps/backend
npx prisma studio
```

Sẽ mở http://localhost:5555 - GUI để xem database

**Kiểm tra:**
- Tables đã tồn tại chưa? (users, projects, text_entries, v.v.)
- Có user nào trong table `users` chưa?

**Nếu không có tables:**
```bash
npx prisma migrate dev
```

**Nếu không có users:**
```bash
npm run seed
```

### Step 3: Test API Trực Tiếp

```bash
# Test create project với curl
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Project\",\"gameFormat\":\"json\",\"sourceLang\":\"en\",\"targetLang\":\"vi\",\"ownerId\":\"default-user\"}"
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Test Project",
    ...
  }
}
```

**Nếu lỗi:**
- Đọc error message trong response
- Kiểm tra backend terminal có lỗi gì

### Step 4: Kiểm tra Browser Console

1. Mở DevTools (F12)
2. Tab **Console**
3. Click "Tạo Dự Án" để trigger lỗi
4. Xem error message

**Các lỗi thường gặp:**

**"Network Error" hoặc "ERR_CONNECTION_REFUSED"**
→ Backend chưa chạy

**"404 Not Found"**
→ API endpoint không đúng, kiểm tra routes

**"500 Internal Server Error"**
→ Backend error, check terminal backend

**"CORS Error"**
→ Frontend và Backend khác origin, check CORS settings

### Step 5: Kiểm tra Network Request

1. Mở DevTools (F12)
2. Tab **Network**
3. Click "Tạo Dự Án"
4. Tìm request `/api/projects` (màu đỏ nếu lỗi)
5. Click vào request đó
6. Xem **Response** tab để đọc error message

## 🛠️ Quick Fixes

### Fix 1: Reset Toàn Bộ

```bash
# Stop tất cả terminals (Ctrl+C)

# Xóa node_modules và reinstall
npm run clean
npm install

# Reset database
cd apps/backend
npx prisma migrate reset --force

# Generate Prisma Client
npx prisma generate

# Migrate lại
npx prisma migrate dev

# Seed data
npm run seed

# Restart dev server
cd ../..
npm run dev
```

### Fix 2: Kiểm Tra .env File

```bash
# Mở apps/backend/.env
# Đảm bảo có đủ các biến này:

DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/glossary_tool?schema=public"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### Fix 3: Test Backend Manually

```bash
# Chạy riêng backend
cd apps/backend
npm run dev

# Trong terminal khác, test API
curl http://localhost:3001/api/projects
```

## 📋 Checklist Debug

Hãy check từng bước:

- [ ] Node.js đã cài (`node --version`)
- [ ] npm install đã chạy thành công
- [ ] PostgreSQL đang chạy
- [ ] Database `glossary_tool` đã tạo
- [ ] File `.env` đã config đúng
- [ ] `npx prisma generate` đã chạy
- [ ] `npx prisma migrate dev` đã chạy thành công
- [ ] `npm run seed` đã chạy (tùy chọn)
- [ ] Backend chạy tại http://localhost:3001 (check /health)
- [ ] Frontend chạy tại http://localhost:5173
- [ ] Browser console không có lỗi màu đỏ

## 🆘 Nếu Vẫn Không Được

### Option 1: Dùng Supabase (Cloud Database)

Thay vì PostgreSQL local, dùng Supabase miễn phí:

1. Truy cập: https://supabase.com
2. Tạo project mới
3. Copy connection string
4. Update `.env`:
```env
DATABASE_URL="postgresql://postgres.[ref]:[password]@db.[region].supabase.co:5432/postgres"
```
5. Chạy lại migrations:
```bash
cd apps/backend
npx prisma migrate dev
npm run seed
```

### Option 2: Gửi Lỗi Chi Tiết

Nếu vẫn gặp lỗi, hãy gửi cho tôi:

1. **Backend terminal output** (toàn bộ text màu đỏ)
2. **Browser console errors** (F12 → Console → Screenshot)
3. **Network request details** (F12 → Network → Click request lỗi → Screenshot)

Với thông tin này tôi sẽ giúp bạn fix chính xác!

---

## 🎯 Common Solutions

### Lỗi: "Table `users` does not exist"
```bash
cd apps/backend
npx prisma migrate dev
```

### Lỗi: "Foreign key constraint failed on ownerId"
```bash
# User chưa tồn tại
cd apps/backend
npm run seed
```

### Lỗi: "Cannot find module '@prisma/client'"
```bash
cd apps/backend
npx prisma generate
```

### Lỗi: "Port 3001 already in use"
```cmd
# Tìm và kill process
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F