# 🚀 Hướng Dẫn Cài Đặt Từ Đầu - Windows

## Bước 1: Cài Đặt Node.js

### Cách 1: Cài từ trang chính thức (Khuyến nghị)

1. **Download Node.js:**
   - Truy cập: https://nodejs.org/
   - Chọn bản **LTS** (Long Term Support) - hiện tại là v20.x
   - Click "Windows Installer (.msi) - 64-bit"
   - Download file `.msi`

2. **Cài đặt:**
   - Chạy file `.msi` vừa download
   - Click "Next" để tiếp tục
   - Chấp nhận License Agreement
   - Chọn đường dẫn cài đặt (mặc định: `C:\Program Files\nodejs\`)
   - **Quan trọng:** Đảm bảo check vào "Automatically install the necessary tools"
   - Click "Install"
   - Chờ cài đặt hoàn tất
   - Click "Finish"

3. **Verify cài đặt:**
   - Mở **Command Prompt** mới (Phím Windows + R, gõ `cmd`, Enter)
   - Chạy lệnh:
   ```cmd
   node --version
   npm --version
   ```
   - Bạn sẽ thấy version numbers (ví dụ: v20.10.0 và 10.2.3)

### Cách 2: Cài qua Chocolatey (Nếu đã có Chocolatey)

```cmd
choco install nodejs-lts
```

### Cách 3: Cài qua Winget (Windows 11)

```cmd
winget install OpenJS.NodeJS.LTS
```

## Bước 2: Cài Đặt Git (Nếu chưa có)

1. Download từ: https://git-scm.com/download/win
2. Chạy installer
3. Chọn các options mặc định
4. Verify: 
```cmd
git --version
```

## Bước 3: Clone hoặc Setup Project

### Nếu project đã có sẵn trong máy:

Bạn đang ở đây rồi! Tiếp tục bước 4.

### Nếu clone từ Git:

```cmd
git clone <your-repository-url>
cd glossary-tool
```

## Bước 4: Cài Đặt Dependencies

Mở **Command Prompt** hoặc **PowerShell** tại thư mục project:

```cmd
cd C:\Users\Admin\Documents\glossary-tool
npm install
```

**Lưu ý:** Quá trình này có thể mất 5-10 phút tùy vào tốc độ mạng.

## Bước 5: Cài Đặt PostgreSQL

### Option A: PostgreSQL Desktop (Khuyến nghị cho người mới)

1. **Download:**
   - Truy cập: https://www.postgresql.org/download/windows/
   - Click "Download the installer"
   - Chọn phiên bản mới nhất (PostgreSQL 16.x)
   - Download và chạy installer

2. **Cài đặt:**
   - Chọn đường dẫn cài đặt
   - Chọn components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Chọn data directory (mặc định)
   - **Đặt password cho user 'postgres'** - GHI NHỚ PASSWORD NÀY!
   - Port: 5432 (mặc định)
   - Locale: Default locale
   - Click "Next" và "Finish"

3. **Tạo Database:**

   **Cách 1: Dùng pgAdmin 4 (GUI)**
   - Mở pgAdmin 4
   - Nhập master password (password bạn vừa đặt)
   - Right-click "Databases" → "Create" → "Database"
   - Database name: `glossary_tool`
   - Click "Save"

   **Cách 2: Dùng Command Line**
   ```cmd
   # Mở cmd với quyền Administrator
   cd C:\Program Files\PostgreSQL\16\bin
   createdb -U postgres glossary_tool
   # Nhập password khi được hỏi
   ```

### Option B: PostgreSQL Cloud (Không cần cài)

**Sử dụng Supabase (Miễn phí):**

1. Truy cập: https://supabase.com
2. Đăng ký tài khoản (dùng GitHub/Google)
3. Click "New Project"
4. Nhập thông tin:
   - Name: `glossary-tool`
   - Database Password: Đặt password mạnh
   - Region: Chọn gần bạn nhất
5. Chờ project được tạo (1-2 phút)
6. Vào Settings → Database
7. Copy "Connection string" (URI mode)
8. Connection string sẽ có dạng:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres
   ```

## Bước 6: Cấu Hình Environment Variables

1. **Tạo file .env:**
   ```cmd
   cd apps\backend
   copy .env.example .env
   ```

2. **Chỉnh sửa file .env:**
   - Mở file `apps\backend\.env` bằng Notepad hoặc VS Code
   - Cập nhật thông tin:

   ```env
   # Nếu dùng PostgreSQL local:
   DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/glossary_tool?schema=public"
   
   # Nếu dùng Supabase:
   DATABASE_URL="postgresql://postgres:[YOUR-PASSWORD]@db.xxxxx.supabase.co:5432/postgres"
   
   # Redis (tạm thời comment, không bắt buộc)
   # REDIS_URL="redis://localhost:6379"
   
   # JWT Secret (đổi thành chuỗi ngẫu nhiên)
   JWT_SECRET="thay-doi-thanh-secret-cua-ban-o-day-123456"
   
   # Gemini API (sẽ lấy sau)
   GEMINI_API_KEY=""
   USE_GEMINI=true
   
   # Server
   PORT=3001
   NODE_ENV="development"
   
   CORS_ORIGIN="http://localhost:5173"
   ```

## Bước 7: Lấy Google Gemini API Key (Miễn Phí)

1. Truy cập: https://makersuite.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Click "Create API Key"
4. Chọn "Create API key in new project" hoặc chọn project có sẵn
5. Copy API key
6. Paste vào file `.env`:
   ```env
   GEMINI_API_KEY="your-api-key-here"
   ```

**Giới hạn miễn phí:**
- 60 requests/phút
- Unlimited usage trong rate limit
- Không cần thẻ tín dụng

## Bước 8: Setup Database Schema

```cmd
# Từ thư mục root
cd C:\Users\Admin\Documents\glossary-tool

# Chạy migration
npm run db:migrate

# Generate Prisma Client
cd apps\backend
npx prisma generate
```

**Nếu gặp lỗi:** "Prisma is not found"
```cmd
cd apps\backend
npm install
npx prisma generate
npx prisma migrate dev
```

## Bước 9: Khởi Động Development Server

### Option 1: Chạy cả Backend và Frontend

```cmd
cd C:\Users\Admin\Documents\glossary-tool
npm run dev
```

### Option 2: Chạy riêng từng service

**Terminal 1 - Backend:**
```cmd
cd C:\Users\Admin\Documents\glossary-tool
npm run dev:backend
```

**Terminal 2 - Frontend:**
```cmd
cd C:\Users\Admin\Documents\glossary-tool
npm run dev:frontend
```

## Bước 10: Kiểm Tra

1. **Backend API:**
   - Mở browser: http://localhost:3001/health
   - Sẽ thấy: `{"status":"ok","timestamp":"..."}`

2. **Frontend:**
   - Mở browser: http://localhost:5173
   - Sẽ thấy giao diện Welcome page

## ❗ Troubleshooting Phổ Biến

### Lỗi: "npm is not recognized"
- **Giải pháp:** Cài đặt Node.js (Bước 1)
- Sau khi cài, **đóng và mở lại Command Prompt**

### Lỗi: Database connection failed
- **Kiểm tra:** PostgreSQL có đang chạy không?
  ```cmd
  # Mở Services (Win + R, gõ services.msc)
  # Tìm "postgresql" service
  # Đảm bảo status là "Running"
  ```
- **Kiểm tra:** DATABASE_URL trong .env có đúng không?
- **Kiểm tra:** Password có đúng không?

### Lỗi: Port 3001 already in use
```cmd
# Tìm process đang dùng port
netstat -ano | findstr :3001

# Kill process (thay PID bằng số bạn tìm được)
taskkill /PID 1234 /F
```

### Lỗi: "Cannot find module '@prisma/client'"
```cmd
cd apps\backend
npx prisma generate
```

### Lỗi: Dependencies installation failed
```cmd
# Clear cache và thử lại
npm cache clean --force
npm install
```

## 📝 Checklist Hoàn Thành

- [ ] Node.js đã cài (node --version hoạt động)
- [ ] npm đã cài (npm --version hoạt động)
- [ ] PostgreSQL đã cài và đang chạy
- [ ] Database `glossary_tool` đã tạo
- [ ] File `.env` đã tạo và config đúng
- [ ] Gemini API key đã lấy và thêm vào .env
- [ ] `npm install` chạy thành công
- [ ] Database migration hoàn tất
- [ ] Backend chạy tại http://localhost:3001
- [ ] Frontend chạy tại http://localhost:5173

## 🎉 Hoàn Thành!

Sau khi hoàn thành tất cả các bước trên, bạn có thể:

1. Truy cập http://localhost:5173 để xem frontend
2. Truy cập http://localhost:3001/api để xem API docs
3. Bắt đầu phát triển tính năng!

## 📚 Tài Nguyên Bổ Sung

- [Node.js Documentation](https://nodejs.org/docs/)
- [PostgreSQL Tutorial](https://www.postgresql.org/docs/current/tutorial.html)
- [Prisma Getting Started](https://www.prisma.io/docs/getting-started)
- [React Tutorial](https://react.dev/learn)

## 💡 Tips

- Sử dụng VS Code để code: https://code.visualstudio.com/
- Install extension "Prisma" cho VS Code để highlight schema
- Install extension "ESLint" và "Prettier" cho code formatting
- Dùng Git Bash thay vì CMD để có terminal tốt hơn

---

Nếu gặp bất kỳ vấn đề nào, hãy tạo issue hoặc liên hệ support!