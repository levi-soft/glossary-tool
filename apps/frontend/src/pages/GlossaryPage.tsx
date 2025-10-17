import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, PlusCircle, Edit2, Trash2, Search, Loader2, BookOpen } from 'lucide-react'
import { 
  useGlossary, 
  useGlossaryCategories,
  useCreateGlossaryTerm,
  useDeleteGlossaryTerm 
} from '@/lib/hooks'

export default function GlossaryPage() {
  const { id } = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [formData, setFormData] = useState({
    sourceTerm: '',
    targetTerm: '',
    category: '',
    description: '',
    autoApply: true,
  })

  // Fetch glossary and categories
  const { data: glossary, isLoading, error } = useGlossary({ projectId: id!, search: searchQuery })
  const { data: categories = [] } = useGlossaryCategories(id)
  const createTerm = useCreateGlossaryTerm()
  const deleteTerm = useDeleteGlossaryTerm()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await createTerm.mutateAsync({
        projectId: id!,
        sourceTerm: formData.sourceTerm,
        targetTerm: formData.targetTerm,
        category: formData.category || undefined,
        description: formData.description || undefined,
        autoApply: formData.autoApply,
      })
      
      // Reset form and close modal
      setFormData({
        sourceTerm: '',
        targetTerm: '',
        category: '',
        description: '',
        autoApply: true,
      })
      setShowAddModal(false)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async (termId: string) => {
    if (window.confirm('Bạn có chắc muốn xóa thuật ngữ này?')) {
      await deleteTerm.mutateAsync(termId)
    }
  }

  const uniqueCategories = Array.from(new Set(categories))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/projects/${id}`}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Glossary</h1>
            <p className="text-sm text-gray-600">
              Quản lý thuật ngữ cho dự án
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={18} />
          <span>Thêm Thuật Ngữ</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Tổng số thuật ngữ</div>
          <div className="text-2xl font-bold text-gray-900">
            {isLoading ? '-' : glossary?.length || 0}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Danh mục</div>
          <div className="text-2xl font-bold text-gray-900">
            {uniqueCategories.length}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Tìm kiếm</div>
          <div className="text-2xl font-bold text-gray-900">
            {searchQuery ? (glossary?.length || 0) : '-'}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Áp dụng tự động</div>
          <div className="text-2xl font-bold text-green-600">Bật</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Tìm kiếm thuật ngữ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <Loader2 size={48} className="mx-auto text-blue-600 animate-spin mb-4" />
          <p className="text-gray-600">Đang tải glossary...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Lỗi khi tải glossary. Vui lòng thử lại.</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && glossary?.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <BookOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có thuật ngữ nào
          </h3>
          <p className="text-gray-600 mb-4">
            Bắt đầu thêm các thuật ngữ quan trọng cho dự án
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Thêm Thuật Ngữ Đầu Tiên
          </button>
        </div>
      )}

      {/* Glossary Table */}
      {!isLoading && !error && glossary && glossary.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thuật ngữ gốc
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Bản dịch
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">
                    Danh mục
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mô tả
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Matches
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {glossary.map((term) => (
                  <tr key={term.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {term.sourceTerm}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {term.targetTerm}
                    </td>
                    <td className="px-4 py-3">
                      {term.category && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                          {term.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {term.description}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {term._count?.matches || 0} entries
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button className="p-1 hover:bg-blue-100 rounded transition-colors">
                          <Edit2 size={16} className="text-blue-600" />
                        </button>
                        <button
                          onClick={() => handleDelete(term.id)}
                          className="p-1 hover:bg-red-100 rounded transition-colors"
                        >
                          <Trash2 size={16} className="text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Term Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Thêm Thuật Ngữ Mới</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thuật ngữ gốc
                </label>
                <input
                  type="text"
                  value={formData.sourceTerm}
                  onChange={(e) => setFormData({ ...formData, sourceTerm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Health Potion"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bản dịch
                </label>
                <input
                  type="text"
                  value={formData.targetTerm}
                  onChange={(e) => setFormData({ ...formData, targetTerm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Thuốc hồi máu"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Chọn danh mục...</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Items">Items</option>
                  <option value="Monsters">Monsters</option>
                  <option value="Game Terms">Game Terms</option>
                  <option value="Story">Story</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Giải thích về thuật ngữ..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApply"
                  checked={formData.autoApply}
                  onChange={(e) => setFormData({ ...formData, autoApply: e.target.checked })}
                  className="mr-2"
                />
                <label htmlFor="autoApply" className="text-sm text-gray-700">
                  Tự động áp dụng cho các text entries
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  disabled={createTerm.isPending}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={createTerm.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {createTerm.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang thêm...
                    </>
                  ) : (
                    'Thêm Thuật Ngữ'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}