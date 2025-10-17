// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
  details?: any
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Project Types
export interface Project {
  id: string
  name: string
  description?: string
  gameFormat: string
  sourceLang: string
  targetLang: string
  totalEntries: number
  translatedEntries: number
  glossaryCount: number
  createdAt: string
  updatedAt: string
}

export interface CreateProjectDto {
  name: string
  description?: string
  gameFormat: string
  sourceLang: string
  targetLang: string
  ownerId: string
}

export interface UpdateProjectDto {
  name?: string
  description?: string
  gameFormat?: string
  sourceLang?: string
  targetLang?: string
}

// Text Entry Types
export enum EntryStatus {
  UNTRANSLATED = 'UNTRANSLATED',
  IN_PROGRESS = 'IN_PROGRESS',
  TRANSLATED = 'TRANSLATED',
  IN_REVIEW = 'IN_REVIEW',
  NEEDS_REVISION = 'NEEDS_REVISION',
  APPROVED = 'APPROVED',
}

export interface TextEntry {
  id: string
  projectId: string
  context?: string
  originalText: string
  currentTranslation?: string
  status: EntryStatus
  aiSuggestions?: any
  lineNumber?: number
  sourceFile?: string
  createdAt: string
  updatedAt: string
  translations?: Translation[]
  glossaryMatches?: GlossaryMatch[]
}

export interface CreateEntryDto {
  projectId: string
  context?: string
  originalText: string
  currentTranslation?: string
  lineNumber?: number
  sourceFile?: string
}

export interface UpdateEntryDto {
  context?: string
  currentTranslation?: string
  status?: EntryStatus
}

export interface SaveTranslationDto {
  translation: string
  userId?: string
  source?: 'manual' | 'ai-assisted' | 'glossary' | 'imported'
}

// Translation Types
export interface Translation {
  id: string
  textEntryId: string
  userId: string
  translationText: string
  source: string
  confidenceScore?: number
  createdAt: string
  user?: {
    id: string
    username: string
  }
}

// Glossary Types
export interface GlossaryTerm {
  id: string
  projectId: string
  sourceTerm: string
  targetTerm: string
  category?: string
  aliases?: string[]
  description?: string
  isGlobal: boolean
  createdAt: string
  updatedAt: string
  _count?: {
    matches: number
  }
}

export interface CreateGlossaryTermDto {
  projectId: string
  sourceTerm: string
  targetTerm: string
  category?: string
  aliases?: string[]
  description?: string
  isGlobal?: boolean
  autoApply?: boolean
}

export interface UpdateGlossaryTermDto {
  sourceTerm?: string
  targetTerm?: string
  category?: string
  aliases?: string[]
  description?: string
  isGlobal?: boolean
}

export interface GlossaryMatch {
  id: string
  textEntryId: string
  glossaryTermId: string
  autoApplied: boolean
  createdAt: string
  glossaryTerm?: GlossaryTerm
}

// Query Params
export interface EntriesQueryParams {
  projectId: string
  status?: EntryStatus | 'ALL'
  search?: string
  page?: number
  limit?: number
}

export interface GlossaryQueryParams {
  projectId: string
  category?: string
  search?: string
}