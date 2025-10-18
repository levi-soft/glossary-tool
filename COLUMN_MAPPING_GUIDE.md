# 🗂️ Flexible Column Mapping Feature

## Tính Năng

Cho phép import files với **bất kỳ tên cột nào** và map vào database fields:

### Ví Dụ Formats

**Format 1: Standard**
```
ID | Context | Original | Translation
```

**Format 2: Game IDs**
```
GameID | CharacterID | String_1 | String_2
```

**Format 3: Simple**
```
LineID | Text_EN | Text_VI
```

## Implementation Plan

### 1. Preview & Auto-Detection

Khi upload file → Show preview:

```
Detected 4 columns from file:
┌──────────────┬─────────────────────┐
│ File Column  │ Map to Database     │
├──────────────┼─────────────────────┤
│ GameID       │ [Skip/ID/Context]   │
│ CharacterID  │ [Skip/Context]      │
│ String_1     │ Original Text ✓     │
│ String_2     │ Translation         │
└──────────────┴─────────────────────┘
```

**Auto-detection rules:**
- Columns matching "ID", "id" → Skip or use as reference
- Columns matching "text", "original", "source" → Original Text
- Columns matching "translation", "target", "trans" → Translation
- Columns matching "context", "type", "category" → Context
- Columns matching "character", "speaker", "char" → Context (with character prefix)

### 2. Manual Mapping UI

```tsx
<ColumnMappingStep 
  columns={['GameID', 'CharacterID', 'String_1', 'String_2']}
  onMap={(mapping) => {...}}
>
  <ColumnMapping 
    fileColumn="GameID"
    options={['Skip', 'ID', 'Context']}
    selected="Skip"
  />
  <ColumnMapping
    fileColumn="CharacterID"
    options={['Skip', 'Context']}
    selected="Context"
    prefix="Character: "
  />
  <ColumnMapping
    fileColumn="String_1"
    options={['Original Text', 'Translation']}
    selected="Original Text"
    required
  />
  <ColumnMapping
    fileColumn="String_2"
    options={['Original Text', 'Translation']}
    selected="Translation"
  />
</ColumnMappingStep>
```

### 3. Backend Support

**Current:**
```typescript
// CSV parser expects specific columns
const originalText = record.original || record.Original || ...
```

**New:**
```typescript
// Accept column mapping from frontend
interface ColumnMapping {
  fileColumn: string
  dbField: 'id' | 'context' | 'originalText' | 'translation'
  prefix?: string  // For character names
}

const parseWithMapping = (record, mapping: ColumnMapping[]) => {
  const result = {}
  
  for (const map of mapping) {
    if (map.dbField !== 'skip') {
      let value = record[map.fileColumn]
      if (map.prefix) value = map.prefix + value
      result[map.dbField] = value
    }
  }
  
  return result
}
```

### 4. Context Options

```tsx
<ContextOption>
  <select>
    <option value="">No context</option>
    <option value="dialogue">Dialogue</option>
    <option value="menu">Menu</option>
    <option value="item">Item</option>
    <option value="quest">Quest</option>
    <option value="custom">Custom...</option>
  </select>
</ContextOption>
```

## Implementation Steps

### Step 1: Update CSV Parser (Backend)

```typescript
// apps/backend/src/services/parsers/csvParser.ts

interface ColumnMapping {
  fileColumn: string
  dbField: 'id' | 'context' | 'originalText' | 'translation' | 'skip'
  prefix?: string
}

class CSVParser {
  parseWithMapping(
    content: string,
    filename: string,
    columnMapping?: ColumnMapping[]
  ): ParsedEntry[] {
    const records = parse(content, { columns: true, ... })
    
    if (!columnMapping) {
      // Auto-detect (current logic)
      return this.parse(content, filename)
    }
    
    // Use mapping
    return records.map((record, index) => {
      const entry: any = {}
      
      for (const map of columnMapping) {
        if (map.dbField === 'skip') continue
        
        let value = record[map.fileColumn]
        if (map.prefix) value = map.prefix + value
        
        entry[map.dbField] = value
      }
      
      return {
        originalText: entry.originalText,
        currentTranslation: entry.translation,
        context: entry.context,
        lineNumber: index + 1,
        sourceFile: filename,
      }
    })
  }
}
```

### Step 2: Add Preview Endpoint (Backend)

```typescript
// apps/backend/src/routes/import.ts

// POST /api/import/preview - Preview file columns
router.post('/preview', upload.single('file'), async (req, res) => {
  try {
    const content = fs.readFileSync(req.file.path, 'utf-8')
    
    // Parse first row to get columns
    const records = parse(content, { columns: true, to: 1 })
    const firstRecord = records[0]
    const columns = Object.keys(firstRecord)
    
    // Auto-detect mapping
    const suggestedMapping = columns.map(col => ({
      fileColumn: col,
      dbField: autoDetectField(col),
      confidence: getConfidence(col)
    }))
    
    // Clean up
    fs.unlinkSync(req.file.path)
    
    res.json({
      success: true,
      data: {
        columns,
        suggestedMapping,
        previewData: firstRecord
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Preview failed' })
  }
})

function autoDetectField(columnName: string): string {
  const lower = columnName.toLowerCase()
  
  if (lower.includes('original') || lower.includes('source') || lower.includes('text_en')) {
    return 'originalText'
  }
  if (lower.includes('translation') || lower.includes('target') || lower.includes('text_vi')) {
    return 'translation'
  }
  if (lower.includes('context') || lower.includes('type')) {
    return 'context'
  }
  if (lower.includes('character') || lower.includes('speaker')) {
    return 'context'
  }
  if (lower.match(/^(id|line|num)/i)) {
    return 'skip'
  }
  
  return 'skip'
}
```

### Step 3: Column Mapping UI (Frontend)

```tsx
// apps/frontend/src/components/ColumnMappingModal.tsx

export default function ColumnMappingModal({
  columns,
  previewData,
  onConfirm,
  onCancel
}: {
  columns: string[]
  previewData: any
  onConfirm: (mapping: ColumnMapping[]) => void
  onCancel: () => void
}) {
  const [mapping, setMapping] = useState<ColumnMapping[]>(
    columns.map(col => ({
      fileColumn: col,
      dbField: autoDetect(col),
      prefix: ''
    }))
  )
  
  return (
    <div className="modal">
      <h2>Map File Columns</h2>
      
      <table>
        <thead>
          <tr>
            <th>File Column</th>
            <th>Preview</th>
            <th>Map To</th>
            <th>Prefix</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, idx) => (
            <tr key={col}>
              <td className="font-medium">{col}</td>
              <td className="text-sm text-gray-600">
                {previewData[col]}
              </td>
              <td>
                <select
                  value={mapping[idx].dbField}
                  onChange={(e) => updateMapping(idx, 'dbField', e.target.value)}
                >
                  <option value="skip">Skip</option>
                  <option value="originalText">Original Text ⭐</option>
                  <option value="translation">Translation</option>
                  <option value="context">Context</option>
                </select>
              </td>
              <td>
                {mapping[idx].dbField === 'context' && (
                  <input
                    type="text"
                    placeholder="e.g., Character: "
                    value={mapping[idx].prefix}
                    onChange={(e) => updateMapping(idx, 'prefix', e.target.value)}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="actions">
        <button onClick={onCancel}>Cancel</button>
        <button onClick={() => onConfirm(mapping)}>
          Import với mapping này
        </button>
      </div>
    </div>
  )
}
```

### Step 4: Update ImportModal Flow

```tsx
// New flow:
1. User uploads file
2. → Preview & detect columns
3. → Show ColumnMappingModal
4. → User adjusts mapping
5. → Confirm
6. → Import with mapping
```

## Implementation Summary

**Backend:**
- Update CSV parser with mapping support
- Add preview endpoint
- Auto-detection logic

**Frontend:**
- ColumnMappingModal component
- Preview step in import flow
- Mapping state management

**Effort:** 4-6 hours

## Usage Example

**File: game_data.csv**
```
GameID,CharacterID,String_EN,String_VI,NoteContext
1,Hero,Hello!,,dialogue
2,NPC,Welcome,,dialogue
3,,Start Game,,menu
```

**Mapping:**
```
GameID → Skip
CharacterID → Context (prefix: "Character: ")
String_EN → Original Text
String_VI → Translation
NoteContext → Context (fallback if CharacterID empty)
```

**Result:**
```
Entry 1:
  context: "Character: Hero"
  originalText: "Hello!"
  currentTranslation: ""

Entry 2:
  context: "Character: NPC"
  originalText: "Welcome"
  
Entry 3:
  context: "menu"
  originalText: "Start Game"
```

---

**This is a major feature improvement!**

Would enable support for ANY game file format với minimal effort.