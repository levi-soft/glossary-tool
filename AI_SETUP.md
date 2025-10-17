# 🤖 AI Translation Setup Guide

## Tổng Quan

Glossary Tool hỗ trợ AI translation với:
- **Google Gemini** (Miễn phí)
- **OpenAI GPT-4** (Trả phí) - Coming soon
- **Anthropic Claude** (Trả phí) - Coming soon

## 🆓 Setup Google Gemini (Miễn Phí)

### Bước 1: Lấy API Key

1. **Truy cập Google AI Studio:**
   ```
   https://makersuite.google.com/app/apikey
   ```

2. **Đăng nhập** với tài khoản Google của bạn

3. **Tạo API Key:**
   - Click **"Get API key"** hoặc **"Create API key"**
   - Chọn **"Create API key in new project"**
   - Copy API key được tạo ra

4. **Lưu API Key:**
   ```bash
   # Mở file apps/backend/.env
   # Thêm hoặc update dòng này:
   GEMINI_API_KEY="AIzaSy..."  # Paste API key của bạn
   USE_GEMINI=true
   ```

### Bước 2: Restart Backend

```bash
# Stop backend hiện tại (Ctrl + C)
# Chạy lại
cd C:\Users\Admin\Documents\glossary-tool
npm run dev:backend
```

### Bước 3: Kiểm Tra

```bash
# Test AI capabilities endpoint
curl http://localhost:3001/api/ai/capabilities
```

**Kết quả mong đợi:**
```json
{
  "success": true,
  "data": {
    "provider": "Google Gemini",
    "model": "gemini-pro",
    "maxTokens": 30720,
    "rateLimit": "60 requests/minute",
    "cost": "Free (with limits)"
  }
}
```

## 🎯 Sử Dụng AI Translation

### Trong UI (Frontend)

1. **Mở một project** (vào trang translation sheet)

2. **Click vào một text entry chưa dịch** (row trong bảng)

3. **AI Suggestion Panel sẽ hiện ở dưới**

4. **Click "Request AI Translation"**
   - Đợi 2-5 giây
   - AI sẽ trả về bản dịch

5. **Review bản dịch:**
   - Xem translation chính
   - Xem alternatives (nếu có)
   - Xem reasoning (AI giải thích)
   - Xem confidence score

6. **Apply translation:**
   - Click "Apply" để sử dụng bản dịch chính
   - Hoặc click "Use" ở alternative để dùng bản thay thế

### Qua API (Backend)

#### Translate Single Text

```bash
curl -X POST http://localhost:3001/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello, brave adventurer!",
    "sourceLang": "en",
    "targetLang": "vi",
    "contextType": "dialogue",
    "projectId": "your-project-id",
    "useGlossary": true
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "translation": "Xin chào, chiến binh dũng cảm!",
    "confidence": 0.95,
    "alternatives": [
      "Chào bạn, nhà thám hiểm dũng cảm!",
      "Chào mừng, chiến binh can trường!"
    ],
    "reasoning": "Used 'chiến binh' from glossary for 'warrior/adventurer'",
    "cached": false
  }
}
```

#### Translate Specific Entry

```bash
curl -X POST http://localhost:3001/api/ai/translate/entry/ENTRY_ID \
  -H "Content-Type: application/json" \
  -d '{"useGlossary": true}'
```

#### Batch Translate

```bash
curl -X POST http://localhost:3001/api/ai/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Start Game", "Health Potion"],
    "sourceLang": "en",
    "targetLang": "vi",
    "projectId": "your-project-id",
    "useGlossary": true
  }'
```

## ⚙️ AI Features

### 1. Context-Aware Translation

AI sẽ xem xét:
- **Context Type:** dialogue, menu, item, quest, etc.
- **Game Genre:** (nếu có metadata)
- **Previous Dialogue:** (sẽ thêm sau)

### 2. Glossary Integration

**Automatic:**
- AI tự động nhận glossary terms từ project
- Sử dụng đúng thuật ngữ đã định nghĩa

**Example:**
```
Glossary: "Dragon" → "Rồng"

Original: "Beware of the Dragon!"
AI Output: "Cẩn thận với Rồng!"  ← Dùng đúng thuật ngữ
```

### 3. Caching System

**L1 + L2 Caching:**
- Mỗi translation được cache trong database
- Cache key = hash(text + context + languages)
- Cache expires sau 7 ngày
- Reuse cache cho same requests → Tiết kiệm API calls

**Cache Stats:**
- Hit count tracking
- Cache warming (planned)

### 4. Confidence Scoring

AI trả về confidence score (0.0 - 1.0):
- **0.9 - 1.0:** Rất tự tin, có thể apply trực tiếp
- **0.7 - 0.9:** Tốt, nên review
- **< 0.7:** Không chắc chắn, cần human review

### 5. Multiple Alternatives

AI có thể trả về nhiều bản dịch:
- Translation chính (recommended)
- 2-3 alternatives
- User chọn bản phù hợp nhất

## 📊 Prompt Engineering

AI prompt được tối ưu cho game translation:

```
You are a professional game translator...

Context Type: dialogue
Game Genre: Visual Novel

Required Terminology (MUST USE):
- "Dragon" → "Rồng"
- "HP" → "Máu"

Text to Translate:
"Your HP is low! Beware of the Dragon!"

Requirements:
1. Keep same tone
2. Use glossary terms exactly
3. Sound natural in Vietnamese
4. Maintain special formatting
```

### Customize Prompt

Có thể customize trong [`apps/backend/src/services/aiService.ts`](apps/backend/src/services/aiService.ts:97)

## 🚦 Rate Limits

### Gemini Free Tier

- **60 requests/minute**
- **1500 requests/day**
- Unlimited usage trong rate limits

**Batch Processing:**
- App tự động batch requests
- Delay 1s giữa các batches
- Avoid hitting rate limit

## 💰 Cost Comparison

| Service | Model | Cost (per 1M tokens) | Quality |
|---------|-------|---------------------|---------|
| Gemini | gemini-pro | **FREE** | Good ⭐⭐⭐⭐ |
| OpenAI | gpt-4o | $5 input, $15 output | Excellent ⭐⭐⭐⭐⭐ |
| Claude | claude-sonnet | $3 input, $15 output | Excellent ⭐⭐⭐⭐⭐ |

**For 1000 game texts (~100k tokens):**
- Gemini: **$0** (miễn phí!)
- OpenAI: ~$2
- Claude: ~$1.8

## 🧪 Testing AI Translation

### Test 1: Simple Translation

1. Tạo một text entry:
```bash
curl -X POST http://localhost:3001/api/entries \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "context": "dialogue",
    "originalText": "Hello world"
  }'
```

2. Request AI translation:
```bash
curl -X POST http://localhost:3001/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello world",
    "sourceLang": "en",
    "targetLang": "vi"
  }'
```

### Test 2: With Glossary

1. Thêm glossary term:
```bash
curl -X POST http://localhost:3001/api/glossary \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "your-project-id",
    "sourceTerm": "Dragon",
    "targetTerm": "Rồng",
    "category": "Monsters"
  }'
```

2. Translate text có chứa "Dragon":
```bash
curl -X POST http://localhost:3001/api/ai/translate \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Beware of the Dragon!",
    "sourceLang": "en",
    "targetLang": "vi",
    "projectId": "your-project-id",
    "useGlossary": true
  }'
```

**Expected:** AI sẽ dùng "Rồng" từ glossary

### Test 3: Batch Translation

```bash
curl -X POST http://localhost:3001/api/ai/translate/batch \
  -H "Content-Type: application/json" \
  -d '{
    "texts": ["Hello", "Start Game", "Health Potion"],
    "sourceLang": "en",
    "targetLang": "vi",
    "projectId": "your-project-id"
  }'
```

## ⚠️ Troubleshooting

### Lỗi: "AI translation failed"

**1. API Key không đúng:**
```bash
# Kiểm tra .env
cat apps/backend/.env | grep GEMINI_API_KEY

# Test API key trực tiếp
curl https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=YOUR_API_KEY
```

**2. Rate limit exceeded:**
```
Error: 429 Resource has been exhausted
```
→ Đợi 1 phút và thử lại
→ Giảm batch size

**3. Network error:**
→ Kiểm tra internet connection
→ Firewall có block không?

### Lỗi: "GEMINI_API_KEY not set"

```bash
# Đảm bảo .env có key này
echo "GEMINI_API_KEY=your-key-here" >> apps/backend/.env

# Restart backend
npm run dev:backend
```

### AI trả về text không phải JSON

→ Normal, app sẽ parse và handle
→ Nếu muốn force JSON, có thể update prompt

## 🔐 Security Best Practices

1. **Không commit API key:**
   - `.env` đã có trong `.gitignore`
   - Không share API key publicly

2. **Rate limiting:**
   - Implement rate limiting trên API endpoint
   - Prevent abuse

3. **Input sanitization:**
   - Validate input trước khi gửi đến AI
   - Max length checks

## 📈 Performance Tips

### 1. Enable Caching

Caching đã được implement tự động:
- Mỗi request được cache 7 ngày
- Duplicate requests return instantly
- Save API quota

### 2. Batch Operations

Khi dịch nhiều entries:
```typescript
// Better: Batch translate
aiApi.batchTranslate({
  texts: ['text1', 'text2', 'text3'],
  sourceLang: 'en',
  targetLang: 'vi'
})

// vs. Multiple single requests
texts.forEach(text => aiApi.translate({ text, ... }))
```

### 3. Use Glossary

- Setup glossary trước khi dịch
- Enable `useGlossary: true`
- Improve consistency và quality

## 🎓 Best Practices

### 1. Translation Quality

**Good Prompts:**
- Specific context type (dialogue, menu, item)
- Include game genre if known
- Provide glossary terms
- Add character context

**Example:**
```typescript
await aiApi.translate({
  text: "You found a legendary sword!",
  sourceLang: "en",
  targetLang: "vi",
  contextType: "item_description",
  projectId: "my-rpg-project",
  useGlossary: true
})
```

### 2. Review Process

1. Request AI translation
2. Review output
3. Edit if needed
4. Save to glossary if recurring term
5. Approve when satisfied

### 3. Glossary Management

**Before translating:**
- Add common game terms
- Add character names
- Add location names
- Add item/skill names

**During translation:**
- Add new terms discovered
- Update existing terms
- Categorize properly

## 📝 Examples

### Example 1: Visual Novel

**Input:**
```json
{
  "text": "I-It's not like I like you or anything! Baka!",
  "sourceLang": "en",
  "targetLang": "vi",
  "contextType": "dialogue",
  "characterContext": "Tsundere character"
}
```

**Output:**
```json
{
  "translation": "Đ-Đừng có nghĩ là tôi thích bạn nhé! Baka!",
  "confidence": 0.92,
  "alternatives": [
    "Không phải là tôi thích cậu đâu nhé! Ngốc!",
    "Đừng hiểu lầm, tôi không hề thích cậu! Baka!"
  ],
  "reasoning": "Kept 'Baka' untranslated (common in tsundere character speech)"
}
```

### Example 2: RPG Game

**Input:**
```json
{
  "text": "Your HP is critical! Use a health potion!",
  "glossary": [
    {"source": "HP", "target": "Máu"},
    {"source": "Health Potion", "target": "Thuốc hồi máu"}
  ]
}
```

**Output:**
```json
{
  "translation": "Máu của bạn sắp hết! Dùng Thuốc hồi máu!",
  "confidence": 0.98,
  "reasoning": "Used glossary terms: HP→Máu, Health Potion→Thuốc hồi máu"
}
```

## 🔮 Advanced Features (Coming Soon)

### 1. Custom AI Models

```env
# Use different Gemini models
GEMINI_MODEL="gemini-1.5-pro"  # More accurate
GEMINI_MODEL="gemini-1.5-flash"  # Faster, cheaper
```

### 2. OpenAI Integration

```env
OPENAI_API_KEY="sk-..."
USE_OPENAI=true
OPENAI_MODEL="gpt-4o"
```

### 3. Translation Memory

- Learn from approved translations
- Suggest based on similar past texts
- Improve over time

### 4. Custom Prompts

- Per-project custom prompts
- Genre-specific templates
- Character-specific styles

## 📊 Monitoring

### Check AI Usage

```sql
-- Trong Prisma Studio hoặc psql
SELECT 
  service,
  COUNT(*) as total_requests,
  COUNT(DISTINCT original_text) as unique_texts,
  AVG(hit_count) as avg_reuse
FROM ai_cache
GROUP BY service;
```

### Cache Performance

```sql
-- Top cached translations
SELECT 
  original_text,
  translation,
  hit_count,
  created_at
FROM ai_cache
ORDER BY hit_count DESC
LIMIT 10;
```

## ⚡ Tips for Best Results

1. **Setup glossary first** - Critical terms, names, locations
2. **Use context types** - dialogue, menu, item, etc.
3. **Review and edit** - AI is good but not perfect
4. **Build translation memory** - Save good translations
5. **Batch when possible** - Save time and API calls

## 🎉 You're All Set!

AI Translation đã sẵn sàng! 

**Next steps:**
1. Add Gemini API key vào `.env`
2. Restart backend
3. Open a project
4. Select an entry
5. Click "Request AI Translation"
6. Watch the magic happen! ✨

---

Questions? Check [`TROUBLESHOOTING.md`](TROUBLESHOOTING.md:1)