# API Documentation - Glossary Tool

Base URL: `http://localhost:3001`

## Table of Contents
- [Authentication](#authentication)
- [Projects API](#projects-api)
- [Text Entries API](#text-entries-api)
- [Glossary API](#glossary-api)
- [Response Format](#response-format)

---

## Authentication

**Note:** Authentication chưa được implement. Hiện tại tất cả endpoints đều public.

---

## Projects API

### Get All Projects
```
GET /api/projects
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "name": "Visual Novel RPG",
      "description": "Dịch game visual novel",
      "gameFormat": "renpy",
      "sourceLang": "en",
      "targetLang": "vi",
      "totalEntries": 1234,
      "translatedEntries": 856,
      "glossaryCount": 45,
      "createdAt": "2024-01-15T...",
      "updatedAt": "2024-01-15T..."
    }
  ]
}
```

### Get Project by ID
```
GET /api/projects/:id
```

### Create Project
```
POST /api/projects
Content-Type: application/json

{
  "name": "My Game Project",
  "description": "Optional description",
  "gameFormat": "json",
  "sourceLang": "en",
  "targetLang": "vi",
  "ownerId": "user-id"
}
```

### Update Project
```
PUT /api/projects/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### Delete Project
```
DELETE /api/projects/:id
```

### Get Project Statistics
```
GET /api/projects/:id/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "projectId": "uuid",
    "projectName": "Visual Novel RPG",
    "byStatus": {
      "UNTRANSLATED": 378,
      "TRANSLATED": 856,
      "IN_REVIEW": 120,
      "APPROVED": 480
    }
  }
}
```

---

## Text Entries API

### Get Entries for Project
```
GET /api/entries?projectId=xxx&status=UNTRANSLATED&search=hello&page=1&limit=50
```

**Query Parameters:**
- `projectId` (required): Project UUID
- `status` (optional): Filter by status (UNTRANSLATED, IN_PROGRESS, TRANSLATED, IN_REVIEW, NEEDS_REVISION, APPROVED)
- `search` (optional): Search in original text and translation
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "context": "dialogue",
      "originalText": "Hello, brave adventurer!",
      "currentTranslation": "Xin chào, chiến binh dũng cảm!",
      "status": "TRANSLATED",
      "aiSuggestions": [
        {
          "text": "Chào bạn, nhà thám hiểm dũng cảm!",
          "confidence": 0.95
        }
      ],
      "lineNumber": 42,
      "sourceFile": "chapter1.rpy",
      "translations": [...],
      "glossaryMatches": [...]
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 1234,
    "totalPages": 25
  }
}
```

### Get Single Entry
```
GET /api/entries/:id
```

### Create Entry
```
POST /api/entries
Content-Type: application/json

{
  "projectId": "uuid",
  "context": "dialogue",
  "originalText": "Hello world",
  "lineNumber": 42,
  "sourceFile": "script.rpy"
}
```

### Bulk Create Entries
```
POST /api/entries/bulk
Content-Type: application/json

[
  {
    "projectId": "uuid",
    "context": "dialogue",
    "originalText": "Text 1"
  },
  {
    "projectId": "uuid",
    "context": "menu",
    "originalText": "Text 2"
  }
]
```

### Update Entry
```
PUT /api/entries/:id
Content-Type: application/json

{
  "currentTranslation": "Bản dịch mới",
  "status": "TRANSLATED"
}
```

### Delete Entry
```
DELETE /api/entries/:id
```

### Save Translation
```
POST /api/entries/:id/translate
Content-Type: application/json

{
  "translation": "Bản dịch của tôi",
  "userId": "user-id",
  "source": "manual"
}
```

**Sources:**
- `manual`: User typed manually
- `ai-assisted`: Used AI suggestion
- `glossary`: From glossary
- `imported`: Imported from file

### Get Translation History
```
GET /api/entries/:id/history
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "textEntryId": "uuid",
      "userId": "uuid",
      "translationText": "Xin chào!",
      "source": "manual",
      "confidenceScore": null,
      "createdAt": "2024-01-15T...",
      "user": {
        "id": "uuid",
        "username": "translator1"
      }
    }
  ]
}
```

---

## Glossary API

### Get Glossary Terms
```
GET /api/glossary?projectId=xxx&category=Items&search=potion
```

**Query Parameters:**
- `projectId` (required): Project UUID
- `category` (optional): Filter by category
- `search` (optional): Search in source/target terms

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "projectId": "uuid",
      "sourceTerm": "Health Potion",
      "targetTerm": "Thuốc hồi máu",
      "category": "Items",
      "aliases": ["HP Potion", "Healing Potion"],
      "description": "Vật phẩm hồi phục HP",
      "isGlobal": false,
      "_count": {
        "matches": 12
      }
    }
  ]
}
```

### Get Single Term
```
GET /api/glossary/:id
```

### Create Glossary Term
```
POST /api/glossary
Content-Type: application/json

{
  "projectId": "uuid",
  "sourceTerm": "Dragon",
  "targetTerm": "Rồng",
  "category": "Monsters",
  "aliases": ["Drake", "Wyrm"],
  "description": "Boss cấp cao",
  "isGlobal": false,
  "autoApply": true
}
```

**Note:** `autoApply` sẽ tự động match term này với các text entries hiện có.

### Update Glossary Term
```
PUT /api/glossary/:id
Content-Type: application/json

{
  "targetTerm": "Rồng lửa",
  "category": "Monsters"
}
```

### Delete Glossary Term
```
DELETE /api/glossary/:id
```

### Get Categories
```
GET /api/glossary/categories/:projectId
```

**Response:**
```json
{
  "success": true,
  "data": ["Items", "Monsters", "Game Terms", "Story"]
}
```

### Apply Term to Entries
```
POST /api/glossary/:id/apply
```

Manually trigger matching this glossary term với các text entries.

**Response:**
```json
{
  "success": true,
  "data": {
    "matchedEntries": 12
  }
}
```

### Bulk Import Glossary
```
POST /api/glossary/bulk-import
Content-Type: application/json

{
  "projectId": "uuid",
  "terms": [
    {
      "sourceTerm": "HP",
      "targetTerm": "Máu",
      "category": "Game Terms"
    },
    {
      "sourceTerm": "MP",
      "targetTerm": "Năng lượng phép",
      "category": "Game Terms"
    }
  ]
}
```

---

## Response Format

### Success Response
```json
{
  "success": true,
  "data": {...}
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [...]
}
```

### HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `400 Bad Request`: Validation error
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Entry Statuses

```typescript
enum EntryStatus {
  UNTRANSLATED = 'UNTRANSLATED',
  IN_PROGRESS = 'IN_PROGRESS',
  TRANSLATED = 'TRANSLATED',
  IN_REVIEW = 'IN_REVIEW',
  NEEDS_REVISION = 'NEEDS_REVISION',
  APPROVED = 'APPROVED'
}
```

---

## Examples

### Complete Workflow Example

```bash
# 1. Create a project
curl -X POST http://localhost:3001/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Visual Novel",
    "gameFormat": "renpy",
    "sourceLang": "en",
    "targetLang": "vi",
    "ownerId": "user-123"
  }'

# Response: { "success": true, "data": { "id": "project-uuid", ... } }

# 2. Add glossary terms
curl -X POST http://localhost:3001/api/glossary \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "project-uuid",
    "sourceTerm": "Dragon",
    "targetTerm": "Rồng",
    "category": "Monsters"
  }'

# 3. Import text entries
curl -X POST http://localhost:3001/api/entries/bulk \
  -H "Content-Type: application/json" \
  -d '[
    {
      "projectId": "project-uuid",
      "context": "dialogue",
      "originalText": "Beware of the dragon!"
    }
  ]'

# 4. Get entries for translation
curl "http://localhost:3001/api/entries?projectId=project-uuid&status=UNTRANSLATED"

# 5. Save a translation
curl -X POST http://localhost:3001/api/entries/entry-uuid/translate \
  -H "Content-Type: application/json" \
  -d '{
    "translation": "Cẩn thận với con rồng!",
    "userId": "user-123",
    "source": "manual"
  }'

# 6. Get project stats
curl "http://localhost:3001/api/projects/project-uuid/stats"
```

---

## Testing with Postman/Thunder Client

Import this collection to test all endpoints:

**Base URL:** `http://localhost:3001`

**Collection Structure:**
```
Glossary Tool API
├── Projects
│   ├── List Projects
│   ├── Get Project
│   ├── Create Project
│   ├── Update Project
│   ├── Delete Project
│   └── Get Stats
├── Entries
│   ├── List Entries
│   ├── Get Entry
│   ├── Create Entry
│   ├── Bulk Create
│   ├── Update Entry
│   ├── Delete Entry
│   ├── Save Translation
│   └── Get History
└── Glossary
    ├── List Terms
    ├── Get Term
    ├── Create Term
    ├── Update Term
    ├── Delete Term
    ├── Get Categories
    ├── Apply Term
    └── Bulk Import
```

---

## Notes

1. **Database Migration**: Run `npm run db:migrate` trước khi sử dụng API
2. **CORS**: Frontend chạy tại `http://localhost:5173` đã được whitelist
3. **Authentication**: Chưa implement, sẽ thêm trong phase sau
4. **Rate Limiting**: Chưa implement, nên thêm cho production
5. **File Upload**: Import/Export endpoints sẽ được thêm sau

---

## Next Steps

- [ ] Add authentication (JWT)
- [ ] Implement AI translation endpoints
- [ ] Add file upload for import
- [ ] Add rate limiting
- [ ] Add request validation middleware
- [ ] Add API versioning
- [ ] Add WebSocket for real-time updates