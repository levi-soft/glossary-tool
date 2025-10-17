# Hướng Dẫn Cài Đặt - Glossary Tool

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 20.0.0
- npm >= 9.0.0
- PostgreSQL >= 15.0
- Redis (optional, cho caching)

## 🚀 Cài Đặt Nhanh

### 1. Clone và Install Dependencies

```bash
# Clone repository
git clone <your-repo-url>
cd glossary-tool

# Install dependencies cho tất cả packages
npm install
```

### 2. Setup Database

#### Option A: PostgreSQL Local

```bash
# Cài đặt PostgreSQL (nếu chưa có)
# Windows: Download từ https://www.postgresql.org/download/windows/
# Mac: brew install postgresql
# Linux: sudo apt-get install postgresql

# Tạo database
createdb glossary_tool

# Hoặc sử dụng psql
psql -U postgres
CREATE DATABASE glossary_tool;
\q
```

#### Option B: PostgreSQL Cloud (Supabase/Neon)

1. Đăng ký tài khoản tại [Supabase](https://supabase.com) hoặc [Neon](https://neon.tech)
2. Tạo project mới
3. Copy connection string

### 3. Setup Environment Variables

```bash
# Backend
cd apps/backend
cp .env.example .env

# Chỉnh sửa .env với thông tin của bạn
# DATABASE_URL="postgresql://user:password@localhost:5432/glossary_tool?schema=public"
# GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Database Migration

```bash
# Từ thư mục root
npm run db:migrate

# Hoặc từ apps/backend
cd apps/backend
npx prisma migrate dev
```

### 5. Generate Prisma Client

```bash
cd apps/backend
npx prisma generate
```

### 6. Start Development Server

```bash
# Từ thư mục root - chạy cả backend và frontend
npm run dev

# Hoặc chạy riêng từng service
npm run dev:backend  # Backend API: http://localhost:3001
npm run dev:frontend # Frontend: http://localhost:5173
```

## 🔑 Lấy API Keys

### Google Gemini (Miễn Phí)

1. Truy cập [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Đăng nhập với Google account
3. Click "Get API key"
4. Copy key và paste vào `GEMINI_API_KEY` trong `.env`

**Giới hạn miễn phí:**
- 60 requests/phút
- Unlimited usage (trong giới hạn rate limit)

### OpenAI (Trả Phí - Optional)

1. Truy cập [OpenAI Platform](https://platform.openai.com/api-keys)
2. Tạo account và thêm payment method
3. Tạo API key mới
4. Copy key và paste vào `OPENAI_API_KEY` trong `.env`

**Chi phí:**
- GPT-4o: ~$0.005/1K tokens (input), ~$0.015/1K tokens (output)

### Anthropic Claude (Trả Phí - Optional)

1. Truy cập [Anthropic Console](https://console.anthropic.com/)
2. Tạo account và verify email
3. Add payment method
4. Tạo API key
5. Copy key và paste vào `ANTHROPIC_API_KEY` trong `.env`

**Chi phí:**
- Claude Sonnet: ~$0.003/1K tokens (input), ~$0.015/1K tokens (output)

## 📁 Cấu Trúc Project

```
glossary-tool/
├── apps/
│   ├── backend/          # Node.js + Express API
│   │   ├── prisma/       # Database schema & migrations
│   │   ├── src/          # Source code
│   │   │   ├── routes/   # API routes
│   │   │   ├── services/ # Business logic
│   │   │   ├── utils/    # Utilities
│   │   │   └── index.ts  # Entry point
│   │   ├── .env          # Environment variables
│   │   └── package.json
│   │
│   └── frontend/         # React + Vite
│       ├── src/
│       │   ├── components/  # React components
│       │   ├── pages/       # Page components
│       │   ├── hooks/       # Custom hooks
│       │   ├── stores/      # Zustand stores
│       │   ├── lib/         # Utilities
│       │   └── App.tsx
│       └── package.json
│
├── packages/             # Shared packages (future)
├── ARCHITECTURE.md       # Kiến trúc hệ thống
├── README.md            # Tài liệu tổng quan
├── SETUP.md             # File này
└── package.json         # Root package
```

## 🛠️ Scripts Hữu Ích

### Development

```bash
# Start cả backend và frontend
npm run dev

# Chỉ backend
npm run dev:backend

# Chỉ frontend
npm run dev:frontend
```

### Database

```bash
# Chạy migrations
npm run db:migrate

# Seed database với test data
npm run db:seed

# Mở Prisma Studio (database GUI)
npm run db:studio

# Reset database
cd apps/backend
npx prisma migrate reset
```

### Build & Deploy

```bash
# Build tất cả
npm run build

# Build backend
npm run build:backend

# Build frontend
npm run build:frontend
```

### Testing

```bash
# Run tests
npm run test

# Type checking
npm run type-check

# Linting
npm run lint
```

## 🔧 Troubleshooting

### Lỗi "Cannot find module '@prisma/client'"

```bash
cd apps/backend
npx prisma generate
```

### Lỗi Database Connection

1. Kiểm tra PostgreSQL đang chạy:
```bash
# Windows
services.msc # Tìm PostgreSQL

# Mac/Linux
sudo service postgresql status
```

2. Kiểm tra DATABASE_URL trong `.env`
3. Test connection:
```bash
cd apps/backend
npx prisma db push
```

### Lỗi Port Already in Use

```bash
# Tìm process đang dùng port
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
```

### Frontend không kết nối được Backend

1. Kiểm tra backend đang chạy tại http://localhost:3001
2. Kiểm tra CORS settings trong `apps/backend/src/index.ts`
3. Kiểm tra proxy config trong `apps/frontend/vite.config.ts`

## 🌐 Redis Setup (Optional)

Redis dùng để cache AI translations và tăng performance.

### Local Installation

```bash
# Windows - Download từ
# https://github.com/microsoftarchive/redis/releases

# Mac
brew install redis
brew services start redis

# Linux
sudo apt-get install redis-server
sudo service redis-server start
```

### Cloud Redis (Upstash - Free)

1. Truy cập [Upstash](https://upstash.com/)
2. Tạo database mới
3. Copy connection URL
4. Update `REDIS_URL` trong `.env`

## 📚 Tài Liệu Bổ Sung

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/)
- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/)
- [TanStack Table](https://tanstack.com/table/latest)
- [Zustand](https://zustand-demo.pmnd.rs/)

## 🤝 Development Workflow

1. **Tạo feature branch:**
```bash
git checkout -b feature/ten-tinh-nang
```

2. **Làm việc với database schema:**
```bash
# Chỉnh sửa apps/backend/prisma/schema.prisma
# Sau đó tạo migration
cd apps/backend
npx prisma migrate dev --name ten-migration
```

3. **Test thay đổi:**
```bash
npm run dev
npm run test
```

4. **Commit và push:**
```bash
git add .
git commit -m "feat: thêm tính năng xyz"
git push origin feature/ten-tinh-nang
```

## 🎯 Next Steps

Sau khi setup xong, bạn có thể:

1. **Tạo project đầu tiên** - Xem hướng dẫn tại [README.md](README.md#sử-dụng)
2. **Setup AI services** - Thêm API keys cho Gemini/OpenAI/Claude
3. **Import game file** - Test với file JSON/CSV mẫu
4. **Customize UI** - Chỉnh sửa components trong `apps/frontend/src`

## 💡 Tips

- Dùng Prisma Studio để xem và chỉnh sửa database: `npm run db:studio`
- Check API endpoints tại http://localhost:3001/api
- Frontend hot reload tự động khi thay đổi code
- Backend restart tự động với `tsx watch`

## 📧 Support

Nếu gặp vấn đề, tạo issue tại GitHub hoặc liên hệ qua Discord/Email.

---

Happy Coding! 🚀