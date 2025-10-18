import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectsApi, entriesApi, glossaryApi, aiApi } from './api'
import type {
  CreateProjectDto,
  UpdateProjectDto,
  EntriesQueryParams,
  CreateEntryDto,
  UpdateEntryDto,
  SaveTranslationDto,
  GlossaryQueryParams,
  CreateGlossaryTermDto,
  UpdateGlossaryTermDto,
} from './types'
import toast from 'react-hot-toast'

// ==================== Projects Hooks ====================

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: projectsApi.getAll,
  })
}

export function useProject(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => projectsApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProjectDto) => projectsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Tạo dự án thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo dự án')
    },
  })
}

export function useUpdateProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProjectDto }) =>
      projectsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['projects', variables.id] })
      toast.success('Cập nhật dự án thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi cập nhật dự án')
    },
  })
}

export function useDeleteProject() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => projectsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      toast.success('Xóa dự án thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa dự án')
    },
  })
}

export function useProjectStats(id: string | undefined) {
  return useQuery({
    queryKey: ['projects', id, 'stats'],
    queryFn: () => projectsApi.getStats(id!),
    enabled: !!id,
  })
}

// ==================== Entries Hooks ====================

export function useEntries(params: EntriesQueryParams) {
  return useQuery({
    queryKey: ['entries', params],
    queryFn: () => entriesApi.getAll(params),
    enabled: !!params.projectId,
  })
}

export function useEntry(id: string | undefined) {
  return useQuery({
    queryKey: ['entries', id],
    queryFn: () => entriesApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEntryDto) => entriesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      toast.success('Tạo entry thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo entry')
    },
  })
}

export function useBulkCreateEntries() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateEntryDto[]) => entriesApi.bulkCreate(data),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      toast.success(`Đã tạo ${result.count} entries!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi tạo entries')
    },
  })
}

export function useUpdateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryDto }) =>
      entriesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['entries', variables.id] })
      toast.success('Cập nhật entry thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi cập nhật entry')
    },
  })
}

export function useDeleteEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => entriesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      toast.success('Xóa entry thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa entry')
    },
  })
}

export function useSaveTranslation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SaveTranslationDto }) =>
      entriesApi.saveTranslation(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['entries', variables.id] })
      toast.success('Lưu bản dịch thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi lưu bản dịch')
    },
  })
}

export function useTranslationHistory(id: string | undefined) {
  return useQuery({
    queryKey: ['entries', id, 'history'],
    queryFn: () => entriesApi.getHistory(id!),
    enabled: !!id,
  })
}

// ==================== Glossary Hooks ====================

export function useGlossary(params: GlossaryQueryParams) {
  return useQuery({
    queryKey: ['glossary', params],
    queryFn: () => glossaryApi.getAll(params),
    enabled: !!params.projectId,
  })
}

export function useGlossaryTerm(id: string | undefined) {
  return useQuery({
    queryKey: ['glossary', id],
    queryFn: () => glossaryApi.getById(id!),
    enabled: !!id,
  })
}

export function useCreateGlossaryTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateGlossaryTermDto) => glossaryApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] })
      toast.success('Thêm thuật ngữ thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi thêm thuật ngữ')
    },
  })
}

export function useUpdateGlossaryTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGlossaryTermDto }) =>
      glossaryApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] })
      queryClient.invalidateQueries({ queryKey: ['glossary', variables.id] })
      toast.success('Cập nhật thuật ngữ thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi cập nhật thuật ngữ')
    },
  })
}

export function useDeleteGlossaryTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => glossaryApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] })
      toast.success('Xóa thuật ngữ thành công!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi xóa thuật ngữ')
    },
  })
}

export function useGlossaryCategories(projectId: string | undefined) {
  return useQuery({
    queryKey: ['glossary', projectId, 'categories'],
    queryFn: () => glossaryApi.getCategories(projectId!),
    enabled: !!projectId,
  })
}

export function useApplyGlossaryTerm() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => glossaryApi.applyTerm(id),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      toast.success(`Đã áp dụng cho ${result.matchedEntries} entries!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi áp dụng thuật ngữ')
    },
  })
}

// ==================== AI Translation Hooks ====================

export function useAITranslate() {
  return useMutation({
    mutationFn: (data: {
      text: string
      sourceLang: string
      targetLang: string
      contextType?: string
      projectId?: string
      useGlossary?: boolean
    }) => aiApi.translate(data),
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi gọi AI translation')
    },
  })
}

export function useAITranslateEntry() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ entryId, useGlossary = true }: { entryId: string; useGlossary?: boolean }) =>
      aiApi.translateEntry(entryId, useGlossary),
    onSuccess: (_, variables) => {
      // Invalidate both specific entry and entries list to trigger refresh
      queryClient.invalidateQueries({ queryKey: ['entries'] })
      queryClient.invalidateQueries({ queryKey: ['entries', variables.entryId] })
      toast.success('AI translation hoàn thành!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi gọi AI translation')
    },
  })
}

export function useAIBatchTranslate() {
  return useMutation({
    mutationFn: (data: {
      texts: string[]
      sourceLang: string
      targetLang: string
      projectId?: string
      useGlossary?: boolean
    }) => aiApi.batchTranslate(data),
    onSuccess: (results) => {
      toast.success(`Đã dịch ${results.length} texts!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi batch translate')
    },
  })
}

export function useAICapabilities() {
  return useQuery({
    queryKey: ['ai', 'capabilities'],
    queryFn: aiApi.getCapabilities,
  })
}

export function useBulkImportGlossary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      projectId,
      terms,
    }: {
      projectId: string
      terms: Omit<CreateGlossaryTermDto, 'projectId'>[]
    }) => glossaryApi.bulkImport(projectId, terms),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['glossary'] })
      toast.success(`Đã import ${result.count} thuật ngữ!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Lỗi khi import glossary')
    },
  })
}