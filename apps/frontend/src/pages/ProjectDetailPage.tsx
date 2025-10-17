import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Download,
  BookOpen,
  Sparkles,
  Search,
  Filter,
  Loader2,
  FolderOpen,
} from 'lucide-react'
import { useProject, useEntries, useUpdateEntry } from '@/lib/hooks'
import { EntryStatus } from '@/lib/types'

const STATUS_LABELS = {
  UNTRANSLATED: { label: 'Chưa dịch', color: 'bg-gray-100 text-gray-700' },
  IN_PROGRESS: { label: 'Đang dịch', color: 'bg-yellow-100 text-yellow-700' },
  TRANSLATED: { label: 'Đã dịch', color: 'bg-blue-100 text-blue-700' },
  IN_REVIEW: { label: 'Đang review', color: 'bg-purple-100 text-purple-700' },
  NEEDS_REVISION: { label: 'Cần sửa', color: 'bg-orange-100 text-orange-700' },
  APPROVED: { label: 'Đã duyệt', color: 'bg-green-100 text-green-700' },
}

export default function ProjectDetailPage() {
  const { id } = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<EntryStatus | 'ALL'>('ALL')
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  // Fetch project and entries
  const { data: project, isLoading: projectLoading } = useProject(id)
  const { 
    data: entriesData, 
    isLoading: entriesLoading,
    error: entriesError 
  } = useEntries({
    projectId: id!,
    status: filterStatus !== 'ALL' ? filterStatus : undefined,
    search: searchQuery || undefined,
    page,
    limit: 50,
  })

  const updateEntry = useUpdateEntry()

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, filterStatus])

  const handleTranslationChange = async (entryId: string, translation: string) => {
    try {
      await updateEntry.mutateAsync({
        id: entryId,
        data: {
          currentTranslation: translation,
          status: translation ? EntryStatus.TRANSLATED : EntryStatus.UNTRANSLATED,
        },
      })
    } catch (error) {
      // Error handled by hook
    }
  }

  if (projectLoading) {
    return (
      <div className="text-center py-12">
        <Loader2 size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
        <p className="text-gray-600">Đang tải dự án...</p>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
          <p className="text-red-800">Không tìm thấy dự án</p>
          <Link to="/projects" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Quay lại danh sách dự án
          </Link>
        </div>
      </div>
    )
  }

  const entries = entriesData?.data || []
  const pagination = entriesData?.pagination

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/projects"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-600">
              {project.sourceLang.toUpperCase()} → {project.targetLang.toUpperCase()}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          <Link
            to={`/projects/${id}/glossary`}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <BookOpen size={18} />
            <span>Glossary</span>
          </Link>
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload size={18} />
            <span>Import</span>
          </button>
          <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            <Download size={18} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1 relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Tìm kiếm text..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter size={18} className="text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as EntryStatus | 'ALL')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">Tất cả</option>
              <option value="UNTRANSLATED">Chưa dịch</option>
              <option value="IN_PROGRESS">Đang dịch</option>
              <option value="TRANSLATED">Đã dịch</option>
              <option value="IN_REVIEW">Đang review</option>
              <option value="APPROVED">Đã duyệt</option>
            </select>
          </div>

          {pagination && (
            <div className="text-sm text-gray-600">
              {pagination.total} entries
            </div>
          )}
        </div>
      </div>

      {/* Loading State */}
      {entriesLoading && (
        <div className="text-center py-12">
          <Loader2 size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Đang tải entries...</p>
        </div>
      )}

      {/* Error State */}
      {entriesError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Lỗi khi tải entries. Vui lòng thử lại.</p>
        </div>
      )}

      {/* Empty State */}
      {!entriesLoading && !entriesError && entries.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <FolderOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có text entries
          </h3>
          <p className="text-gray-600 mb-4">
            Import file game để bắt đầu dịch
          </p>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg">
            <Upload size={18} className="inline mr-2" />
            Import File
          </button>
        </div>
      )}

      {/* Translation Table */}
      {!entriesLoading && !entriesError && entries.length > 0 && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      ID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Context
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Original Text
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Translation
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-20">
                      AI
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {entries.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className={`hover:bg-gray-50 cursor-pointer ${
                        selectedEntry === entry.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedEntry(entry.id)}
                    >
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {String((page - 1) * 50 + index + 1).padStart(3, '0')}
                      </td>
                      <td className="px-4 py-3">
                        {entry.context && (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                            {entry.context}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {entry.originalText}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={entry.currentTranslation || ''}
                          onChange={(e) => handleTranslationChange(entry.id, e.target.value)}
                          placeholder="Nhập bản dịch..."
                          className={`w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            !entry.currentTranslation ? 'bg-yellow-50' : ''
                          }`}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                            STATUS_LABELS[entry.status].color
                          }`}
                        >
                          {STATUS_LABELS[entry.status].label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {entry.aiSuggestions && (
                          <button
                            className="p-1 hover:bg-blue-100 rounded transition-colors"
                            title="AI Suggestion available"
                          >
                            <Sparkles size={16} className="text-blue-600" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Trước
              </button>
              <span className="text-sm text-gray-600">
                Trang {page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sau
              </button>
            </div>
          )}
        </>
      )}

      {/* AI Suggestion Panel (when entry selected) */}
      {selectedEntry && entries.find((e) => e.id === selectedEntry) && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Sparkles size={16} className="mr-2 text-blue-600" />
            AI Translation Suggestions
          </h3>
          {entries.find((e) => e.id === selectedEntry)?.aiSuggestions ? (
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {entries.find((e) => e.id === selectedEntry)?.aiSuggestions?.text || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confidence: 95% • Source: Gemini Flash
                  </p>
                </div>
                <button
                  onClick={() => {
                    const entry = entries.find((e) => e.id === selectedEntry)
                    if (entry?.aiSuggestions?.text) {
                      handleTranslationChange(selectedEntry, entry.aiSuggestions.text)
                    }
                  }}
                  className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                Request AI Translation
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}