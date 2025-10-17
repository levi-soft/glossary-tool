import axios from 'axios'
import type {
  ApiResponse,
  PaginatedResponse,
  Project,
  CreateProjectDto,
  UpdateProjectDto,
  TextEntry,
  CreateEntryDto,
  UpdateEntryDto,
  SaveTranslationDto,
  Translation,
  GlossaryTerm,
  CreateGlossaryTermDto,
  UpdateGlossaryTermDto,
  EntriesQueryParams,
  GlossaryQueryParams,
} from './types'

// Create axios instance
const api = axios.create({
  baseURL: '/api', // Vite proxy sẽ forward đến http://localhost:3001/api
  headers: {
    'Content-Type': 'application/json',
  },
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message)
    return Promise.reject(error)
  }
)

// ==================== Projects API ====================

export const projectsApi = {
  // Get all projects
  getAll: async (): Promise<Project[]> => {
    const response = await api.get<ApiResponse<Project[]>>('/projects')
    return response.data.data
  },

  // Get project by ID
  getById: async (id: string): Promise<Project> => {
    const response = await api.get<ApiResponse<Project>>(`/projects/${id}`)
    return response.data.data
  },

  // Create project
  create: async (data: CreateProjectDto): Promise<Project> => {
    const response = await api.post<ApiResponse<Project>>('/projects', data)
    return response.data.data
  },

  // Update project
  update: async (id: string, data: UpdateProjectDto): Promise<Project> => {
    const response = await api.put<ApiResponse<Project>>(
      `/projects/${id}`,
      data
    )
    return response.data.data
  },

  // Delete project
  delete: async (id: string): Promise<void> => {
    await api.delete(`/projects/${id}`)
  },

  // Get project stats
  getStats: async (id: string) => {
    const response = await api.get(`/projects/${id}/stats`)
    return response.data.data
  },
}

// ==================== Text Entries API ====================

export const entriesApi = {
  // Get entries for a project
  getAll: async (params: EntriesQueryParams): Promise<PaginatedResponse<TextEntry>> => {
    const response = await api.get<PaginatedResponse<TextEntry>>('/entries', {
      params,
    })
    return response.data
  },

  // Get entry by ID
  getById: async (id: string): Promise<TextEntry> => {
    const response = await api.get<ApiResponse<TextEntry>>(`/entries/${id}`)
    return response.data.data
  },

  // Create entry
  create: async (data: CreateEntryDto): Promise<TextEntry> => {
    const response = await api.post<ApiResponse<TextEntry>>('/entries', data)
    return response.data.data
  },

  // Bulk create entries
  bulkCreate: async (data: CreateEntryDto[]): Promise<{ count: number }> => {
    const response = await api.post<ApiResponse<{ count: number }>>(
      '/entries/bulk',
      data
    )
    return response.data.data
  },

  // Update entry
  update: async (id: string, data: UpdateEntryDto): Promise<TextEntry> => {
    const response = await api.put<ApiResponse<TextEntry>>(
      `/entries/${id}`,
      data
    )
    return response.data.data
  },

  // Delete entry
  delete: async (id: string): Promise<void> => {
    await api.delete(`/entries/${id}`)
  },

  // Save translation
  saveTranslation: async (
    id: string,
    data: SaveTranslationDto
  ): Promise<{ entry: TextEntry; translation: Translation }> => {
    const response = await api.post<
      ApiResponse<{ entry: TextEntry; translation: Translation }>
    >(`/entries/${id}/translate`, data)
    return response.data.data
  },

  // Get translation history
  getHistory: async (id: string): Promise<Translation[]> => {
    const response = await api.get<ApiResponse<Translation[]>>(
      `/entries/${id}/history`
    )
    return response.data.data
  },
}

// ==================== Glossary API ====================

export const glossaryApi = {
  // Get all glossary terms
  getAll: async (params: GlossaryQueryParams): Promise<GlossaryTerm[]> => {
    const response = await api.get<ApiResponse<GlossaryTerm[]>>('/glossary', {
      params,
    })
    return response.data.data
  },

  // Get term by ID
  getById: async (id: string): Promise<GlossaryTerm> => {
    const response = await api.get<ApiResponse<GlossaryTerm>>(
      `/glossary/${id}`
    )
    return response.data.data
  },

  // Create term
  create: async (data: CreateGlossaryTermDto): Promise<GlossaryTerm> => {
    const response = await api.post<ApiResponse<GlossaryTerm>>(
      '/glossary',
      data
    )
    return response.data.data
  },

  // Update term
  update: async (
    id: string,
    data: UpdateGlossaryTermDto
  ): Promise<GlossaryTerm> => {
    const response = await api.put<ApiResponse<GlossaryTerm>>(
      `/glossary/${id}`,
      data
    )
    return response.data.data
  },

  // Delete term
  delete: async (id: string): Promise<void> => {
    await api.delete(`/glossary/${id}`)
  },

  // Get categories
  getCategories: async (projectId: string): Promise<string[]> => {
    const response = await api.get<ApiResponse<string[]>>(
      `/glossary/categories/${projectId}`
    )
    return response.data.data
  },

  // Apply term to entries
  applyTerm: async (id: string): Promise<{ matchedEntries: number }> => {
    const response = await api.post<ApiResponse<{ matchedEntries: number }>>(
      `/glossary/${id}/apply`
    )
    return response.data.data
  },

  // Bulk import
  bulkImport: async (
    projectId: string,
    terms: Omit<CreateGlossaryTermDto, 'projectId'>[]
  ): Promise<{ count: number }> => {
    const response = await api.post<ApiResponse<{ count: number }>>(
      '/glossary/bulk-import',
      { projectId, terms }
    )
    return response.data.data
  },
}

// ==================== AI Translation API ====================

export const aiApi = {
  // Translate single text
  translate: async (data: {
    text: string
    sourceLang: string
    targetLang: string
    contextType?: string
    projectId?: string
    useGlossary?: boolean
  }) => {
    const response = await api.post('/ai/translate', data)
    return response.data.data
  },

  // Batch translate
  batchTranslate: async (data: {
    texts: string[]
    sourceLang: string
    targetLang: string
    projectId?: string
    useGlossary?: boolean
  }) => {
    const response = await api.post('/ai/translate/batch', data)
    return response.data.data
  },

  // Translate specific entry
  translateEntry: async (entryId: string, useGlossary = true) => {
    const response = await api.post(`/ai/translate/entry/${entryId}`, {
      useGlossary,
    })
    return response.data.data
  },

  // Get AI capabilities
  getCapabilities: async () => {
    const response = await api.get('/ai/capabilities')
    return response.data.data
  },
}

// Export default api instance for custom requests
export default api