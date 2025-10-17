# 🚀 Quick Start Guide - Glossary Tool

Hướng dẫn nhanh để bắt đầu sử dụng công cụ dịch thuật game.

## ✅ Điều Kiện Tiên Quyết

Đảm bảo bạn đã:
- [x] Cài đặt Node.js
- [x] Setup PostgreSQL hoặc Supabase
- [x] Chạy `npm install` thành công
- [x] Config file `.env` đúng
- [x] Chạy migrations: `npm run db:migrate`

## 📝 Bước 1: Seed Database (Tùy Chọn)

Tạo dữ liệu mẫu để test:

```bash
cd apps/backend
npm run seed
```

Dữ liệu mẫu bao gồm:
- 1 user (demo@glossary-tool.com)
- 2 projects (Visual Novel RPG, RPG Maker Adventure)
- 5 glossary terms  
- 10 text entries

## 🎯 Bước 2: Khởi Động Ứng Dụng

### Option A: Chạy cả Backend và Frontend (Khuyến nghị)

```bash
# Từ thư mục root
cd C:\Users\Admin\Documents\glossary-tool
npm run dev
```

### Option B: Chạy riêng từng service

**Terminal 1 - Backend:**
```bash
npm run dev:backend
# Backend chạy tại: http://localhost:3001
```

**Terminal 2 - Frontend:**
```bash
npm run dev:frontend
# Frontend chạy tại: http://localhost:5173
```

## 🌐 Bước 3: Truy Cập Ứng Dụng

Mở trình duyệt và truy cập:
```
http://localhost:5173
```

## 📱 Bước 4: Sử Dụng Ứng Dụng

### A. Trang Danh Sách Dự Án

Khi mở lần đầu, bạn sẽ thấy:

**Nếu đã chạy seed:**
- 2 dự án mẫu hiển thị
- Progress bars cho từng dự án
- Thông tin: sourceLang → targetLang

**Nếu chưa seed (database trống):**
- Empty state với nút "Tạo Dự Án Mới"

### B. Tạo Dự Án Mới

1. Click nút **"Tạo Dự Án Mới"** (góc trên bên phải)
2. Điền form:
   - **Tên dự án:** VD: "My Visual Novel"
   - **Mô tả:** (tùy chọn)
   - **Ngôn ngữ gốc:** Chọn (English, 日本語, etc.)
   - **Ngôn ngữ đích:** Chọn (Tiếng Việt)
   - **Định dạng game:** JSON, CSV, Ren'Py, RPG Maker, XML
3. Click **"Tạo Dự Án"**
4. Dự án mới sẽ xuất hiện trong danh sách

### C. Vào Trang Dịch Thuật (Translation Sheet)

1. Click vào một dự án trong danh sách
2. Bạn sẽ thấy bảng translation sheet với các cột:
   - **ID:** Số thứ tự
   - **Context:** Loại text (dialogue, menu, item, v.v.)
   - **Original Text:** Text gốc từ game
   - **Translation:** Bản dịch (có thể edit trực tiếp)
   - **Status:** Trạng thái (Chưa dịch, Đã dịch, v.v.)
   - **AI:** Icon nếu có AI suggestion

### D. Dịch Text

**Cách 1: Dịch thủ công**
1. Click vào ô Translation
2. Gõ bản dịch của bạn
3. Tab hoặc click ra ngoài để auto-save
4. Status sẽ tự động chuyển sang "Đã dịch"

**Cách 2: Dùng AI Suggestion (Coming soon)**
1. Click vào row để select
2. Xem AI suggestion ở panel bên dưới
3. Click "Apply" để sử dụng suggestion

### E. Quản Lý Glossary

1. Click nút **"Glossary"** (góc trên bên phải)
2. Trang Glossary hiển thị:
   - Bảng tất cả thuật ngữ
   - Stats: Tổng số terms, categories
   - Search box

**Thêm Thuật Ngữ Mới:**
1. Click **"Thêm Thuật Ngữ"**
2. Điền form:
   - **Thuật ngữ gốc:** VD: "Dragon"
   - **Bản dịch:** VD: "Rồng"  
   - **Danh mục:** Items, Monsters, Game Terms, Story
   - **Mô tả:** Giải thích về term
   - **Auto-apply:** Check để tự động match với entries
3. Click **"Thêm Thuật Ngữ"**
4. Nếu auto-apply enabled, term sẽ tự động match với các entries có chứa nó

**Edit/Delete Terms:**
- Click icon ✏️ để edit
- Click icon 🗑️ để delete

### F. Search và Filter

**Trang Translation Sheet:**
- Search box: Tìm text trong Original hoặc Translation
- Filter dropdown: Lọc theo Status (Chưa dịch, Đã dịch, v.v.)

**Trang Glossary:**
- Search box: Tìm trong Source Term, Target Term, Category

### G. Import/Export (Coming soon)

Các nút Import/Export sẽ được implement sau để:
- Upload file game (JSON, CSV, Ren'Py, v.v.)
- Export translations đã hoàn thành

## 🎨 Tính Năng UI

### Keyboard Shortcuts (Planned)
- `Tab`: Di chuyển giữa các ô trong bảng
- `Enter`: Edit ô được chọn
- `Ctrl+S`: Save tất cả
- `Ctrl+F`: Focus vào search box

### Auto-save
- Tất cả thay đổi đều được tự động lưu
- Bạn sẽ thấy toast notification khi save thành công

### Real-time Updates
- Dữ liệu tự động refresh sau mỗi thay đổi
- Pagination cho datasets lớn
- Virtual scrolling (planned)

## 🔍 Kiểm Tra Backend API

Mở browser hoặc dùng curl:

```bash
# Health check
http://localhost:3001/health

# API info
http://localhost:3001/api

# List projects
http://localhost:3001/api/projects

# List entries for a project
http://localhost:3001/api/entries?projectId=sample-project-1

# List glossary
http://localhost:3001/api/glossary?projectId=sample-project-1
```

## 📊 Workflow Mẫu

### Scenario: Dịch một Visual Novel Game

1. **Tạo Project:**
   - Name: "My Visual Novel"
   - Format: Ren'Py
   - EN → VI

2. **Setup Glossary:**
   - Add: "Main Character" → "Nhân vật chính"
   - Add: "Dragon" → "Rồng"
   - Add: "HP" → "Máu"

3. **Import Game File:** (Coming soon)
   - Upload file `script.rpy`
   - Auto-extract 500 text entries

4. **Dịch Thuật:**
   - Filter: "Chưa dịch"
   - Click vào từng entry
   - Dịch hoặc dùng AI suggestion
   - Review và approve

5. **Export:**
   - Click "Export"
   - Download file đã dịch
   - Import vào game

## 🐛 Troubleshooting

### Frontend không load projects

**Kiểm tra:**
1. Backend có đang chạy không? (http://localhost:3001/health)
2. Mở DevTools (F12) → Console tab
3. Xem có lỗi CORS không?
4. Xem có lỗi API không?

**Giải pháp:**
```bash
# Restart backend
cd apps/backend
npm run dev
```

### Không thấy dữ liệu mẫu

```bash
# Chạy seed lại
cd apps/backend
npm run seed
```

### Lỗi khi save translation

- Kiểm tra CORS settings trong backend `.env`
- Kiểm tra DATABASE_URL có đúng không

### Database connection error

Xem hướng dẫn chi tiết tại [`INSTALL_GUIDE.md`](INSTALL_GUIDE.md:1)

## 💡 Tips

### Development
- Sử dụng **VS Code** để code
- Install extension "Prisma" để highlight schema
- Install extension "Thunder Client" để test API
- Dùng React DevTools để debug

### Performance
- Database được index cho performance
- Pagination được enable cho large datasets
- React Query cache giảm số lần gọi API

### Best Practices
- Tạo glossary trước khi dịch
- Dùng categories để organize terms
- Enable auto-apply cho glossary terms
- Review translations trước khi approve

## 📚 Tài Liệu Khác

- [`ARCHITECTURE.md`](ARCHITECTURE.md:1) - Kiến trúc hệ thống
- [`README.md`](README.md:1) - Tổng quan dự án
- [`SETUP.md`](SETUP.md:1) - Hướng dẫn setup chi tiết
- [`INSTALL_GUIDE.md`](INSTALL_GUIDE.md:1) - Cài đặt từ đầu
- [`API_DOCUMENTATION.md`](API_DOCUMENTATION.md:1) - API endpoints

## 🎉 Chúc Mừng!

Bạn đã sẵn sàng để bắt đầu dịch game! Nếu gặp vấn đề, tham khảo các file tài liệu hoặc tạo issue.

---

Happy Translating! 🎮✨