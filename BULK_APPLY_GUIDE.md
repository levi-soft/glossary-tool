# 📦 Bulk Apply AI Suggestions & Ignored Terms

## 2 Tính Năng Mới

### 1. Bulk Apply AI Suggestions

**Use Case:**
- Batch translate 50 entries
- Tất cả có AI suggestions
- Muốn apply tất cả suggestions cùng lúc

**Implementation:**

#### A. Add Button
```tsx
// ProjectDetailPage.tsx - trong banner selection
{selectedEntries.size > 0 && entries.filter(e => 
  selectedEntries.has(e.id) && e.aiSuggestions
).length > 0 && (
  <button
    onClick={handleBulkApplyAI}
    className="px-4 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700"
  >
    ✓ Apply Hàng Loạt ({entries.filter(e => 
      selectedEntries.has(e.id) && e.aiSuggestions
    ).length} suggestions)
  </button>
)}
```

#### B. Handler
```tsx
const handleBulkApplyAI = async () => {
  const entriesToApply = entries.filter(e => 
    selectedEntries.has(e.id) && e.aiSuggestions
  )
  
  if (entriesToApply.length === 0) {
    toast.error('Không có AI suggestions để apply')
    return
  }
  
  let successCount = 0
  
  for (const entry of entriesToApply) {
    try {
      const translation = (entry.aiSuggestions as any)?.translation
      if (translation && translation !== 'N/A') {
        await handleTranslationChange(entry.id, translation)
        successCount++
      }
    } catch (error) {
      // Continue with others
    }
  }
  
  toast.success(`Đã apply ${successCount}/${entriesToApply.length} translations`)
  setSelectedEntries(new Set())
}
```

### 2. Ignored Terms (Blacklist)

**Use Case:**
- Auto-extract hiện "the", "a", "is" v.v. (common words)
- Không muốn thêm vào glossary
- Click "Ignore" → Lưu vào blacklist
- Lần sau auto-extract sẽ skip

**Implementation:**

#### A. Database Schema
```prisma
// prisma/schema.prisma

model IgnoredTerm {
  id          String   @id @default(uuid())
  projectId   String
  sourceTerm  String
  
  createdAt   DateTime @default(now())
  
  project     Project  @relation(fields: [projectId], references: [id], onDelete: Cascade)
  
  @@unique([projectId, sourceTerm])
  @@map("ignored_terms")
}
```

#### B. Backend Route
```typescript
// routes/glossary.ts

// POST /api/glossary/:projectId/ignore - Ignore term
router.post('/:projectId/ignore', async (req, res) => {
  const { projectId } = req.params
  const { sourceTerm } = req.body
  
  await prisma.ignoredTerm.create({
    data: {
      projectId,
      sourceTerm: sourceTerm.toLowerCase()
    }
  })
  
  res.json({ success: true })
})

// GET /api/glossary/:projectId/ignored - Get ignored terms
router.get('/:projectId/ignored', async (req, res) => {
  const ignored = await prisma.ignoredTerm.findMany({
    where: { projectId: req.params.projectId }
  })
  
  res.json({ success: true, data: ignored })
})
```

#### C. Update Auto-Extract
```typescript
// routes/glossary.ts - auto-extract endpoint

// Fetch ignored terms
const ignoredTerms = await prisma.ignoredTerm.findMany({
  where: { projectId },
  select: { sourceTerm: true }
})

const ignoredSet = new Set(
  ignoredTerms.map(t => t.sourceTerm.toLowerCase())
)

// Filter extracted terms
const extractedTerms = await termExtractor.extract(entries, minOccurrences)

// Remove ignored
const filteredTerms = extractedTerms.filter(
  t => !ignoredSet.has(t.sourceTerm.toLowerCase())
)
```

#### D. UI với Ignore Button
```tsx
// GlossaryPage.tsx - trong auto-extract modal

{extractedTerms.map((term, idx) => (
  <tr key={idx}>
    <td>{term.sourceTerm}</td>
    <td>{term.targetTerm}</td>
    <td>{term.category}</td>
    <td>{term.occurrences}x</td>
    <td>{term.confidence}%</td>
    <td className="flex space-x-1">
      <button
        onClick={() => handleApproveTerm(term)}
        className="px-3 py-1 bg-green-600 text-white text-xs rounded"
      >
        ✓ Approve
      </button>
      <button
        onClick={() => handleIgnoreTerm(term)}
        className="px-3 py-1 bg-gray-600 text-white text-xs rounded"
      >
        🚫 Ignore
      </button>
    </td>
  </tr>
))}
```

#### E. Handler
```tsx
const handleIgnoreTerm = async (term: any) => {
  try {
    await axios.post(`/api/glossary/${id}/ignore`, {
      sourceTerm: term.sourceTerm
    })
    
    // Remove from list
    setExtractedTerms(prev => 
      prev.filter(t => t.sourceTerm !== term.sourceTerm)
    )
    
    toast.success(`Đã ignore: ${term.sourceTerm}`)
  } catch (error) {
    toast.error('Lỗi khi ignore term')
  }
}
```

## Implementation Summary

**Tính năng 1: Bulk Apply AI**
- Effort: 30 phút
- Code: Add button + handler
- Benefit: Apply 50+ suggestions cùng lúc

**Tính năng 2: Ignored Terms**
- Effort: 2-3 hours
- Database migration needed
- Backend routes
- UI update
- Benefit: Cleaner auto-extract results

## Usage Examples

### Bulk Apply AI
```
1. Batch translate 20 entries
2. → All có AI suggestions
3. Click ✓ trong banner
4. → "Apply Hàng Loạt (20 suggestions)"
5. → All applied!
```

### Ignored Terms
```
1. Auto-extract shows: "the", "a", "is"
2. Click "Ignore" cho "the"
3. → Saved to blacklist
4. Next auto-extract
5. → "the" không hiện nữa!
```

---

**Both features improve workflow significantly!**

Effort: ~3 hours total với patterns có sẵn.