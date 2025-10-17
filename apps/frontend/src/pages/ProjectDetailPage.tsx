import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Upload,
  Download,
  BookOpen,
  Sparkles,
  Search,
  Filter,
} from 'lucide-react'

// Mock data
const mockEntries = [
  {
    id: '1',
    context: 'dialogue',
    originalText: 'Hello, brave adventurer!',
    currentTranslation: 'Xin chào, chiến binh dũng cảm!',
    status: 'APPROVED',
    aiSuggestion: 'Chào bạn, nhà thám hiểm dũng cảm!',
  },
  {
    id: '2',
    context: 'menu',
    originalText: 'Start Game',
    currentTranslation: 'Bắt đầu game',
    status: 'TRANSLATED',
    aiSuggestion: 'Khởi động trò chơi',
  },
  {
    id: '3',
    context: 'item',
    originalText: 'Health Potion',
    currentTranslation: 'Thuốc hồi máu',
    status: 'APPROVED',
    aiSuggestion: null,
  },
  {
    id: '4',
    context: 'dialogue',
    originalText: 'The dragon awaits in the mountain peak.',
    currentTranslation: '',
    status: 'UNTRANSLATED',
    aiSuggestion: 'Con rồng đang chờ đợi ở đỉnh núi.',
  },
  {
    id: '5',
    context: 'quest',
    originalText: 'Defeat 10 goblins',
    currentTranslation: 'Đánh bại 10 yêu tinh',
    status: 'IN_REVIEW',
    aiSuggestion: 'Tiêu diệt 10 goblin',
  },
]

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
  const [entries] = useState(mockEntries)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('ALL')
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  // Mock project data
  const project = {
    id,
    name: 'Visual Novel RPG',
    description: 'Dịch game visual novel từ tiếng Anh sang tiếng Việt',
    sourceLang: 'EN',
    targetLang: 'VI',
  }

  const filteredEntries = entries.filter((entry) => {
    const matchesSearch =
      searchQuery === '' ||
      entry.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
      entry.currentTranslation.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      filterStatus === 'ALL' || entry.status === filterStatus

    return matchesSearch && matchesStatus
  })

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
              {project.sourceLang} → {project.targetLang}
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
              onChange={(e) => setFilterStatus(e.target.value)}
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

          <div className="text-sm text-gray-600">
            {filteredEntries.length} / {entries.length} entries
          </div>
        </div>
      </div>

      {/* Translation Table */}
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
              {filteredEntries.map((entry, index) => (
                <tr
                  key={entry.id}
                  className={`hover:bg-gray-50 cursor-pointer ${
                    selectedEntry === entry.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedEntry(entry.id)}
                >
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {String(index + 1).padStart(3, '0')}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                      {entry.context}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {entry.originalText}
                  </td>
                  <td className="px-4 py-3">
                    {entry.currentTranslation ? (
                      <input
                        type="text"
                        value={entry.currentTranslation}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="Nhập bản dịch..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-yellow-50"
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded ${
                        STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS]
                          .color
                      }`}
                    >
                      {
                        STATUS_LABELS[entry.status as keyof typeof STATUS_LABELS]
                          .label
                      }
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {entry.aiSuggestion && (
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

      {/* AI Suggestion Panel (when entry selected) */}
      {selectedEntry && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <Sparkles size={16} className="mr-2 text-blue-600" />
            AI Translation Suggestions
          </h3>
          {entries.find((e) => e.id === selectedEntry)?.aiSuggestion ? (
            <div className="space-y-2">
              <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm text-gray-900">
                    {entries.find((e) => e.id === selectedEntry)?.aiSuggestion}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Confidence: 95% • Source: Gemini Flash
                  </p>
                </div>
                <button className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700">
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