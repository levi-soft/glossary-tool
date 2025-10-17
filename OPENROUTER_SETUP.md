# 🎯 OpenRouter Setup Guide

## Tổng Quan

OpenRouter là unified API cho nhiều AI providers:
- 🤖 **GPT-4, GPT-3.5** (OpenAI)
- 🧠 **Claude 3.5** (Anthropic)  
- ✨ **Gemini Pro** (Google)
- 🦙 **Llama 3.1** (Meta)
- Và 100+ models khác

**Lợi ích:**
- ✅ Một API key cho tất cả models
- ✅ Pay as you go (chỉ trả khi dùng)
- ✅ Không cần credit card để signup
- ✅ Free credits khi đăng ký
- ✅ Transparent pricing
- ✅ No rate limits (trong credit limit)

## 🚀 Quick Start

### Bước 1: Đăng Ký OpenRouter

1. **Truy cập:** https://openrouter.ai
2. **Click "Sign Up"** (góc trên bên phải)
3. **Đăng nhập bằng:**
   - Google account (khuyến nghị)
   - GitHub account
   - Email

4. **Verify email** (nếu dùng email)

### Bước 2: Lấy API Key

1. **Sau khi login, vào:** https://openrouter.ai/keys
2. **Click "Create Key"**
3. **Đặt tên:** "Glossary Tool"
4. **(Optional) Set credit limit:** $5/month
5. **Click "Create"**
6. **Copy API key** (chỉ hiện 1 lần!)
   ```
   sk-or-v1-...
   ```

### Bước 3: Thêm Credits (Optional)

OpenRouter cho free credits khi signup (~$1-2).

**Để thêm credits:**
1. Vào https://openrouter.ai/credits
2. Click "Add Credits"
3. Chọn số tiền ($5, $10, $20, v.v.)
4. Thanh toán qua credit card

**Lưu ý:** Bạn CHỈ trả khi dùng. Unused credits không expire.

### Bước 4: Config App

```bash
# Mở file
apps/backend/.env

# Thêm API key
OPENROUTER_API_KEY="sk-or-v1-..."
USE_OPENROUTER=true

# Tắt Gemini (vì không work)
USE_GEMINI=false

# Chọn model (optional, mặc định là Claude 3.5)
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"
```

### Bước 5: Restart Backend

```powershell
# Stop backend (Ctrl + C)
cd C:\Users\Admin\Documents\glossary-tool
npm run dev:backend
```

**Backend console sẽ hiển thị:**
```
🎯 Using OpenRouter AI
✅ OpenRouter initialized with model: anthropic/claude-3.5-sonnet
🚀 Server is running...
```

### Bước 6: Test

```powershell
.\test-ai.ps1
```

**Expected:**
```
✅ AI Service configured
   Provider: OpenRouter
✅ AI Translation SUCCESS!
   Translation: Xin chào, chiến binh dũng cảm!
```

## 💰 Pricing

### Recommended Models

| Model | Cost per 1M tokens | Quality | Speed | Best For |
|-------|-------------------|---------|-------|----------|
| **Claude 3.5 Sonnet** | $3 in, $15 out | ⭐⭐⭐⭐⭐ | Fast | General game translation |
| GPT-4 Turbo | $10 in, $30 out | ⭐⭐⭐⭐⭐ | Medium | Complex narratives |
| GPT-3.5 Turbo | $0.50 in, $1.50 out | ⭐⭐⭐ | Very Fast | Simple UI text |
| Gemini Pro | $0.125 in, $0.375 out | ⭐⭐⭐⭐ | Fast | Budget option |
| Llama 3.1 70B | $0.50 in, $0.75 out | ⭐⭐⭐ | Fast | Very budget |

### Cost Estimate

**For 1000 game texts** (~50k tokens):

| Model | Input | Output | Total | Per Text |
|-------|-------|--------|-------|----------|
| Claude 3.5 | $0.15 | $0.75 | **$0.90** | $0.0009 |
| GPT-4 Turbo | $0.50 | $1.50 | **$2.00** | $0.002 |
| GPT-3.5 | $0.025 | $0.075 | **$0.10** | $0.0001 |
| Gemini Pro | $0.006 | $0.019 | **$0.025** | $0.000025 |

**Recommendation:** Start với **Claude 3.5 Sonnet** (~$1 cho 1000 texts)

## 🎨 Model Selection

### Trong Code

```typescript
// Config trong .env
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"  // Best quality
OPENROUTER_MODEL="openai/gpt-3.5-turbo"         // Cheapest
OPENROUTER_MODEL="google/gemini-pro"            // Good balance
```

### Available Models

Xem full list: https://openrouter.ai/models

**Popular for Translation:**
```
anthropic/claude-3.5-sonnet     - Best quality, reasonable cost
anthropic/claude-3-haiku        - Fast, cheap
openai/gpt-4-turbo              - Very good, expensive
openai/gpt-3.5-turbo            - Fast, very cheap
google/gemini-pro               - Good, cheap
meta-llama/llama-3.1-70b        - Open source, cheap
```

## 🔧 Advanced Config

### Multi-Model Setup

Trong app, bạn có thể dùng nhiều models cho mục đích khác nhau:

```env
# Main translation (quality)
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"

# Bulk translation (cost-effective) 
OPENROUTER_BULK_MODEL="google/gemini-pro"

# QA checking
OPENROUTER_QA_MODEL="openai/gpt-4-turbo"
```

### Per-Request Model

Qua API, bạn có thể specify model cho từng request:

```bash
curl -X POST http://localhost:3001/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello",
    "sourceLang": "en",
    "targetLang": "vi",
    "model": "openai/gpt-3.5-turbo"
  }'
```

## 📊 Monitoring Usage

### Check Credits

1. Vào https://openrouter.ai/activity
2. Xem usage history
3. Track spending by model
4. Set alerts

### In App

App tự động log cost cho mỗi translation:

```javascript
{
  translation: "...",
  cost: 0.0023,  // $0.0023 for this request
  model: "anthropic/claude-3.5-sonnet"
}
```

## 🎯 Best Practices

### 1. Start Small

```env
# Begin with cheap model to test
OPENROUTER_MODEL="google/gemini-pro"

# After confirming it works, upgrade
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"
```

### 2. Use Caching

App đã có caching system:
- Same text = reuse cache
- Save API calls
- Save money

### 3. Batch Wisely

```
Small projects (< 100 texts) → Use best model
Large projects (> 1000 texts) → Use cheaper model
Critical text (character names, story) → Manual review
```

## 🔐 Security

**Do NOT:**
- ❌ Commit API key to Git
- ❌ Share API key publicly
- ❌ Use same key across apps

**DO:**
- ✅ Store in `.env` (already in `.gitignore`)
- ✅ Rotate keys periodically
- ✅ Set spending limits
- ✅ Monitor usage

## ⚡ Quick Switch

### Use Mock AI (Free, Instant)
```env
USE_OPENROUTER=false
USE_GEMINI=false
# Mock AI tự động được dùng
```

### Use OpenRouter
```env
USE_OPENROUTER=true
OPENROUTER_API_KEY="sk-or-v1-..."
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"
```

### Use Gemini (If you have working key)
```env
USE_OPENROUTER=false
USE_GEMINI=true
GEMINI_API_KEY="AIzaSy..."
```

## 📚 Model Recommendations

### For Visual Novels
```
anthropic/claude-3.5-sonnet  - Best for narrative, dialogue
```

### For RPG Games
```
google/gemini-pro  - Good quality, cost-effective
```

### For Simple UI Text
```
openai/gpt-3.5-turbo  - Very fast, very cheap
```

### For Budget Projects
```
meta-llama/llama-3.1-70b  - Open source, cheapest
```

## 🎉 Complete Setup Example

```env
# Database
DATABASE_URL="postgresql://..."

# OpenRouter AI (Primary)
OPENROUTER_API_KEY="sk-or-v1-abc123..."
OPENROUTER_MODEL="anthropic/claude-3.5-sonnet"
USE_OPENROUTER=true

# Gemini (Backup/Free)
USE_GEMINI=false
GEMINI_API_KEY=""

# Server
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

## 🧪 Test OpenRouter

Sau khi setup:

```powershell
# Restart backend
npm run dev:backend

# Run test
.\test-ai.ps1

# Expected:
✅ Provider: OpenRouter
✅ AI Translation SUCCESS!
```

## 💡 Tips

1. **Start with $5 credits** - Enough for 5000+ translations
2. **Use Claude 3.5** - Best quality/price ratio
3. **Enable caching** - Already enabled in app
4. **Monitor usage** - Check OpenRouter dashboard weekly
5. **Set budget alerts** - Prevent overspending

## 🆘 Troubleshooting

### Invalid API Key
```
Error: 401 Unauthorized
```
→ Check API key có đúng không
→ Check đã add credits chưa

### Rate Limited
```
Error: 429 Too Many Requests
```
→ Có credit limit
→ Add more credits hoặc đợi

### Model Not Found
```
Error: 404 Model not found
```
→ Check model name đúng format
→ Xem available models tại: https://openrouter.ai/models

---

## 🚀 Ready to Go!

1. Get API key: https://openrouter.ai/keys
2. Add to `.env`: `OPENROUTER_API_KEY="sk-or-v1-..."`
3. Restart backend
4. Test: `.\test-ai.ps1`
5. Enjoy high-quality AI translation! ✨

**Questions?** Check OpenRouter docs: https://openrouter.ai/docs