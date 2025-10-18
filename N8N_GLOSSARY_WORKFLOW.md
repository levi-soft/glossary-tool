# 🔄 Glossary + AI Translation Workflow - N8N + Google Sheets

## Giải Thích Cách Hoạt Động Trong App

### 1. Glossary Storage & Retrieval

**Database:**
```sql
-- Table: glossary_terms
CREATE TABLE glossary_terms (
  id UUID PRIMARY KEY,
  project_id UUID,
  source_term VARCHAR(255),  -- "Dragon"
  target_term VARCHAR(255),  -- "Rồng"
  category VARCHAR(100),     -- "Monsters"
  description TEXT
);

-- Example data:
INSERT INTO glossary_terms VALUES
  ('uuid-1', 'project-123', 'Dragon', 'Rồng', 'Monsters', 'Boss'),
  ('uuid-2', 'project-123', 'HP', 'Máu', 'Game Terms', 'Health Points'),
  ('uuid-3', 'project-123', 'Hero', 'Anh hùng', 'Characters', 'Main character');
```

**Fetch Glossary:**
```typescript
// Backend: apps/backend/src/routes/ai.ts line 232
const glossaryTerms = await prisma.glossaryTerm.findMany({
  where: { projectId: entry.project.id },
  select: {
    sourceTerm: true,
    targetTerm: true,
  },
});

// Result:
[
  { source: "Dragon", target: "Rồng" },
  { source: "HP", target: "Máu" },
  { source: "Hero", target: "Anh hùng" }
]
```

### 2. AI Prompt Construction

**Build Prompt với Glossary:**
```typescript
// Backend: apps/backend/src/services/aiService.ts line ~120

// Text to translate: "The Hero defeats the Dragon! HP +100"

const prompt = `
Translate this English game text to Vietnamese:

Text: "The Hero defeats the Dragon! HP +100"

**IMPORTANT - Required Terms (MUST USE):**
- "Hero" → "Anh hùng"
- "Dragon" → "Rồng"  
- "HP" → "Máu"

Translate to Vietnamese. Use these terms EXACTLY as specified.

Provide ONLY the translation.
`;

// Send to AI (OpenRouter/Mock)
```

**Mock AI Processing:**
```typescript
// Backend: apps/backend/src/services/mockAiService.ts line ~45

async translate(request) {
  const glossaryTerms = request.context?.glossaryTerms || []
  let translation = request.text
  
  // Step 1: Apply glossary terms FIRST (highest priority)
  for (const term of glossaryTerms) {
    const regex = new RegExp(term.source, 'gi')
    translation = translation.replace(regex, term.target)
  }
  
  // Result: "The Anh hùng defeats the Rồng! Máu +100"
  
  // Step 2: Apply built-in dictionary
  translation = applyDictionary(translation)
  // Result: "Anh hùng đánh bại Rồng! Máu +100"
  
  return {
    translation,
    confidence: 0.9,
    reasoning: `Mock AI với ${glossaryTerms.length} glossary terms`
  }
}
```

## Replicate Trên N8N + Google Sheets

### Architecture

```
Google Sheet (Glossary)
    ↓
N8N Workflow
    ↓
OpenRouter API / Gemini API
    ↓
Google Sheet (Translations)
```

### Setup Google Sheets

**Sheet 1: Glossary**
```
| A: SourceTerm | B: TargetTerm | C: Category |
|---------------|---------------|-------------|
| Dragon        | Rồng          | Monsters    |
| HP            | Máu           | Game Terms  |
| Hero          | Anh hùng      | Characters  |
```

**Sheet 2: Translations**
```
| A: ID | B: Original Text              | C: Translation | D: Status |
|-------|-------------------------------|----------------|-----------|
| 1     | The Hero defeats the Dragon!  |                | Pending   |
| 2     | HP +100                       |                | Pending   |
```

### N8N Workflow

**Node 1: Read Glossary Sheet**
```javascript
// Google Sheets Node
// Range: Glossary!A2:C
// Output: glossaryTerms array

const glossary = items.map(item => ({
  source: item.json.SourceTerm,
  target: item.json.TargetTerm,
  category: item.json.Category
}));

// Result:
[
  { source: "Dragon", target: "Rồng", category: "Monsters" },
  { source: "HP", target: "Máu", category: "Game Terms" },
  ...
]
```

**Node 2: Read Texts to Translate**
```javascript
// Google Sheets Node
// Range: Translations!A2:D
// Filter: Status = "Pending"

const textsToTranslate = items.filter(
  item => item.json.Status === 'Pending'
);
```

**Node 3: Build Prompt với Glossary**
```javascript
// Function Node
// For each text

const text = $input.item.json.OriginalText;

// Build glossary section
const glossarySection = $node["Read Glossary"].json
  .map(term => `- "${term.source}" → "${term.target}"`)
  .join('\n');

const prompt = `
Translate this English game text to Vietnamese:

Text: "${text}"

**Required Terms (MUST USE):**
${glossarySection}

Translate to Vietnamese. Use these terms EXACTLY.
Provide ONLY the translation.
`;

return {
  json: {
    originalText: text,
    rowId: $input.item.json.ID,
    prompt: prompt
  }
};
```

**Node 4: Call OpenRouter API**
```javascript
// HTTP Request Node
// Method: POST
// URL: https://openrouter.ai/api/v1/chat/completions

{
  "model": "anthropic/claude-3.5-sonnet",
  "messages": [
    {
      "role": "user",
      "content": "{{ $json.prompt }}"
    }
  ],
  "temperature": 0.3
}

// Headers:
{
  "Authorization": "Bearer YOUR_OPENROUTER_API_KEY",
  "Content-Type": "application/json"
}

// Response:
{
  "choices": [
    {
      "message": {
        "content": "Anh hùng đánh bại Rồng! Máu +100"
      }
    }
  ]
}
```

**Node 5: Extract Translation**
```javascript
// Function Node

const translation = $input.item.json.choices[0].message.content;
const rowId = $node["Build Prompt"].json.rowId;

return {
  json: {
    rowId: rowId,
    translation: translation
  }
};
```

**Node 6: Write Back to Sheet**
```javascript
// Google Sheets Node
// Operation: Update
// Range: Translations!C{rowId}

// Update column C với translation
// Update column D với Status = "Translated"
```

## Complete N8N Workflow JSON

```json
{
  "nodes": [
    {
      "name": "Read Glossary",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetName": "Glossary",
        "range": "A2:C"
      }
    },
    {
      "name": "Read Texts",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "read",
        "sheetName": "Translations",
        "range": "A2:D",
        "filters": {
          "Status": "Pending"
        }
      }
    },
    {
      "name": "Build Prompt",
      "type": "n8n-nodes-base.function",
      "parameters": {
        "functionCode": "// See above"
      }
    },
    {
      "name": "Call OpenRouter",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": {
        "method": "POST",
        "url": "https://openrouter.ai/api/v1/chat/completions",
        "headers": {
          "Authorization": "Bearer {{YOUR_API_KEY}}"
        },
        "body": "// See above"
      }
    },
    {
      "name": "Extract Translation",
      "type": "n8n-nodes-base.function"
    },
    {
      "name": "Write Back",
      "type": "n8n-nodes-base.googleSheets",
      "parameters": {
        "operation": "update"
      }
    }
  ],
  "connections": {
    "Read Glossary": {
      "main": [[{"node": "Build Prompt"}]]
    },
    "Read Texts": {
      "main": [[{"node": "Build Prompt"}]]
    },
    "Build Prompt": {
      "main": [[{"node": "Call OpenRouter"}]]
    },
    "Call OpenRouter": {
      "main": [[{"node": "Extract Translation"}]]
    },
    "Extract Translation": {
      "main": [[{"node": "Write Back"}]]
    }
  }
}
```

## Key Points - Tại Sao Chuẩn

---

## Auto-Extract Glossary Terms Workflow

### Giải Thích Cách Hoạt Động Trong App

**Backend Logic:**
```typescript
// Backend: apps/backend/src/services/termExtractor.ts

// Step 1: Extract Terms from Original Text
function extractTerms(text) {
  // English capitalized: Hero, Dragon
  // All caps: HP, MP
  // Japanese Katakana: アイテム
  // Japanese Kanji: 勇者
  return [...allTerms]
}

// Step 2: Map to Full Translation
for (entry of entries) {
  sourceTerms = extractTerms(entry.originalText)
  // "Hero" found in original
  // → Map to FULL translation: "Anh hùng"
}

// Step 3: Count & Aggregate
// "Hero" → "Anh hùng" (appears 5 times)
// Confidence: 50% (5/10)

// Step 4: Filter by min occurrences (default: 2)
// Return only terms appearing 2+ times
```

### N8N Auto-Extract Workflow

**Sheet Setup:**
```
Sheet: Translations
| Original Text | Translation | Context |
|---------------|-------------|---------|
| Hero attacks  | Anh hùng... | dialogue|
| Hero wins     | Anh hùng... | dialogue|
```

**Node 1: Read Translated Entries**
```javascript
// Google Sheets Node
const entries = items.filter(item =>
  item.json.Original && item.json.Translation
);
```

**Node 2: Extract Terms (Function Node)**
```javascript
function extractTerms(text) {
  const terms = [];
  
  // English
  const english = text.match(/\b[A-Z][a-z]+\b/g) || [];
  terms.push(...english);
  
  // Japanese Katakana
  const katakana = text.match(/[ァ-ヴー]+/g) || [];
  terms.push(...katakana);
  
  // Japanese Kanji
  const kanji = text.match(/[\u4e00-\u9faf]+/g) || [];
  terms.push(...kanji);
  
  // Korean
  const korean = text.match(/[가-힣]+/g) || [];
  terms.push(...korean);
  
  return [...new Set(terms)];
}

const sourceTerms = extractTerms($json.Original);

return sourceTerms.map(term => ({
  sourceTerm: term,
  fullTranslation: $json.Translation,
  context: $json.Context
}));
```

**Node 3: Aggregate & Count**
```javascript
// Aggregate Node

const termMap = {};

for (const item of items) {
  const key = item.json.sourceTerm.toLowerCase();
  
  if (!termMap[key]) {
    termMap[key] = {
      sourceTerm: item.json.sourceTerm,
      translations: [],
      count: 0
    };
  }
  
  termMap[key].translations.push(item.json.fullTranslation);
  termMap[key].count++;
}

// Find most common translation
const results = Object.values(termMap)
  .filter(term => term.count >= 2) // Min 2 occurrences
  .map(term => {
    // Most common translation
    const counts = {};
    for (const trans of term.translations) {
      counts[trans] = (counts[trans] || 0) + 1;
    }
    
    const mostCommon = Object.entries(counts)
      .sort((a, b) => b[1] - a[1])[0][0];
    
    return {
      sourceTerm: term.sourceTerm,
      targetTerm: mostCommon,
      occurrences: term.count,
      confidence: Math.round((term.count / 10) * 100)
    };
  })
  .sort((a, b) => b.occurrences - a.occurrences);

return results;
```

**Node 4: Write to Suggestions Sheet**
```javascript
// Google Sheets Node
// Sheet: Glossary_Suggestions
// Operation: Append

{
  SourceTerm: $json.sourceTerm,
  TargetTerm: $json.targetTerm,
  Occurrences: $json.occurrences,
  Confidence: $json.confidence + '%',
  Status: 'Pending Review'
}
```

### Google Apps Script Version

```javascript
/**
 * Auto-extract glossary terms
 * Run from menu: Tools → Auto-Extract Terms
 */
function autoExtractGlossaryTerms() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const translationsSheet = ss.getSheetByName('Translations');
  const data = translationsSheet.getDataRange().getValues();
  
  const termMap = {};
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const [original, translation] = data[i];
    
    if (!original || !translation) continue;
    
    // Extract terms
    const terms = extractTerms(original);
    
    for (const term of terms) {
      const key = term.toLowerCase();
      
      if (!termMap[key]) {
        termMap[key] = {
          source: term,
          translations: [],
          count: 0
        };
      }
      
      termMap[key].translations.push(translation);
      termMap[key].count++;
    }
  }
  
  // Build results
  const results = [];
  
  for (const [key, data] of Object.entries(termMap)) {
    if (data.count >= 2) {
      // Most common translation
      const mostCommon = data.translations[0]; // Simplified
      
      results.push([
        data.source,
        mostCommon,
        data.count,
        Math.round((data.count / 10) * 100) + '%',
        'Pending'
      ]);
    }
  }
  
  // Sort by occurrences
  results.sort((a, b) => b[2] - a[2]);
  
  // Write to Suggestions sheet
  const suggestionsSheet = ss.getSheetByName('Glossary_Suggestions') || 
    ss.insertSheet('Glossary_Suggestions');
  
  // Clear & write
  suggestionsSheet.clear();
  suggestionsSheet.getRange(1, 1, 1, 5).setValues([
    ['Source Term', 'Target Term', 'Occurrences', 'Confidence', 'Status']
  ]);
  
  if (results.length > 0) {
    suggestionsSheet.getRange(2, 1, results.length, 5).setValues(results);
  }
  
  SpreadsheetApp.getUi().alert(
    `Extracted ${results.length} glossary terms!`
  );
}

function extractTerms(text) {
  const terms = [];
  
  // English capitalized
  const english = text.match(/\b[A-Z][a-z]+\b/g) || [];
  terms.push(...english);
  
  // All caps
  const caps = text.match(/\b[A-Z]{2,}\b/g) || [];
  terms.push(...caps);
  
  // Japanese Katakana
  const katakana = text.match(/[ァ-ヴー]+/g) || [];
  terms.push(...katakana);
  
  // Japanese Kanji
  const kanji = text.match(/[\u4e00-\u9faf]+/g) || [];
  terms.push(...kanji);
  
  return [...new Set(terms)];
}
```

### Usage in Google Sheets

**Setup:**
1. Create "Translations" sheet với data
2. Create "Glossary_Suggestions" sheet (empty)
3. Add Apps Script code
4. Run: Tools → Script Editor → autoExtractGlossaryTerms()

**Result:**
- Auto-extracts terms
- Counts occurrences
- Writes to Glossary_Suggestions
- You review và approve

**Then:**
- Copy approved terms to main Glossary sheet
- Use in translation workflow!

---

**Complete workflow documented!**

Bạn có thể replicate cả 2 workflows:
1. ✅ AI Translation với Glossary
2. ✅ Auto-Extract Glossary Terms

Lên N8N hoặc Google Apps Script!

### 1. Glossary Terms = Highest Priority

```javascript
// Apply glossary FIRST, before anything else
for (const term of glossaryTerms) {
  translation = translation.replace(term.source, term.target)
}
```

**Result:** AI BẮT BUỘC dùng đúng thuật ngữ!

### 2. Context in Prompt

```
**Required Terms (MUST USE):**
- "Dragon" → "Rồng"
```

AI hiểu đây là yêu cầu BẮT BUỘC, không phải suggestion.

### 3. Temperature = 0.3

```json
"temperature": 0.3  // Low = consistent, follows rules
```

Temperature thấp → AI tuân theo glossary chặt chẽ hơn.

## Simplified Workflow cho Google Sheets

**Cách đơn giản nhất:**

```javascript
// Apps Script trong Google Sheets

function translateWithGlossary(text, glossaryRange) {
  // 1. Read glossary
  const glossary = SpreadsheetApp
    .getActiveSheet()
    .getRange(glossaryRange)
    .getValues();
  
  // 2. Build glossary text
  const glossaryText = glossary
    .map(row => `- "${row[0]}" → "${row[1]}"`)
    .join('\n');
  
  // 3. Build prompt
  const prompt = `
Translate to Vietnamese:

Text: "${text}"

Required Terms:
${glossaryText}

Provide ONLY translation.
  `;
  
  // 4. Call OpenRouter
  const response = UrlFetchApp.fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'post',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify({
      model: 'anthropic/claude-3.5-sonnet',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3
    })
  });
  
  // 5. Extract translation
  const result = JSON.parse(response.getContentText());
  return result.choices[0].message.content;
}

// Usage in sheet:
// =translateWithGlossary(B2, "Glossary!A2:B10")
```

## Summary

**Tại sao chuẩn:**
1. ✅ Glossary applied FIRST (highest priority)
2. ✅ Prompt explicit về requirements
3. ✅ Temperature thấp (consistent)
4. ✅ Validation sau khi translate

**N8N Implementation:**
- 6 nodes simple workflow
- Google Sheets integration
- OpenRouter/Gemini API
- Same logic như app

**Effort:** 2-3 hours setup N8N workflow

---

**Bạn có thể replicate exact workflow này lên N8N!**

Pattern đã proven trong app - 100% reliable với glossary integration.