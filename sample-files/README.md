# Sample Files for Testing Import/Export

Thư mục này chứa các file mẫu để test chức năng Import/Export.

## 📁 Files

### 1. sample.json
**Format:** Generic JSON
**Content:** Dialogue, menu options, items, quests
**Use case:** Generic JSON game data

**How to use:**
1. Create a new project
2. Click "Import" button
3. Select `sample.json`
4. Choose format: JSON (or Auto)
5. Click Import

**Expected result:** ~15 text entries extracted

---

### 2. sample.csv
**Format:** CSV
**Content:** Mixed game texts with context
**Use case:** Spreadsheet-based translation workflow

**Columns:**
- ID: Entry ID
- Context: Type of text (dialogue, menu, item, etc.)
- Original: Original text
- Translation: (empty for import, filled for export)

**How to use:**
1. Import như file JSON
2. App sẽ tự detect CSV format
3. Entries được tạo từ "Original" column

**Expected result:** 10 text entries

---

### 3. sample.rpy
**Format:** Ren'Py Script
**Content:** Visual novel dialogue and menu
**Use case:** Ren'Py visual novel games

**Features extracted:**
- Character dialogues: `hero "text"`
- Narrator text: `"text"`
- Menu options: Inside `menu:` blocks
- Labels and jumps

**How to use:**
1. Import và chọn format "Ren'Py"
2. Parser sẽ extract dialogue từ script

**Expected result:** ~12 dialogue/narrator entries

---

## 🧪 Testing Workflow

### Test Import

```bash
# 1. Start app
npm run dev

# 2. Create a project in UI
# 3. Click Import button
# 4. Upload sample.json
# 5. Verify entries created
```

### Test Export

```bash
# 1. Import sample file first
# 2. Translate some entries (manually or with AI)
# 3. Click Export button
# 4. Choose format (JSON, CSV, etc.)
# 5. Download and verify file
```

### Test with cURL

```bash
# Import via API
curl -X POST http://localhost:3001/api/import/PROJECT_ID \
  -F "file=@sample.json" \
  -F "format=json" \
  -F "autoApplyGlossary=true"

# Export via API
curl "http://localhost:3001/api/export/PROJECT_ID?format=csv" \
  --output exported.csv
```

## 🎯 Expected Behavior

### Import
1. File upload successful
2. Parser auto-detects format
3. Text strings extracted
4. Duplicates removed
5. Entries created in database
6. Toast notification: "Import thành công! X entries được tạo"

### Export
1. Fetch all entries (hoặc filter)
2. Convert to chosen format
3. Download file
4. File contains translations
5. Can re-import for verification

## 📊 Sample Data Stats

| File | Format | Entries | Size |
|------|--------|---------|------|
| sample.json | JSON | ~15 | < 1KB |
| sample.csv | CSV | 10 | < 1KB |
| sample.rpy | Ren'Py | ~12 | < 1KB |

## 💡 Tips

1. **Test với file nhỏ trước** - Verify parser works
2. **Check entries sau import** - Đảm bảo text đúng
3. **Thử nhiều formats** - JSON, CSV, Ren'Py
4. **Test export ngay sau import** - Verify round-trip
5. **Test với glossary** - Auto-apply should work

## 🐛 Troubleshooting

### Import fails
- Check file size (< 10MB)
- Check file format supported
- Check backend logs for parser errors

### Duplicates created
- Parser có deduplication
- Nếu vẫn duplicate, check logic trong parser

### Missing text
- Some parsers có thể miss complex structures
- Check parser implementation
- Add custom extraction rules nếu cần

## 🔄 Create Your Own Sample

### JSON Format
```json
{
  "dialogue": ["text1", "text2"],
  "items": { "item1": "name", "item2": "name" }
}
```

### CSV Format
```csv
ID,Context,Original,Translation
001,dialogue,Hello,
002,menu,Start,
```

### Ren'Py Format
```python
label start:
    character "Dialogue text"
    "Narrator text"
```

---

Happy Testing! 🚀