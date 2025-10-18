import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, PlusCircle, Edit2, Trash2, Search, Loader2, BookOpen, Sparkles, Check, X } from 'lucide-react'
import {
  useGlossary,
  useGlossaryCategories,
  useCreateGlossaryTerm,
  useUpdateGlossaryTerm,
  useDeleteGlossaryTerm
} from '@/lib/hooks'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function GlossaryPage() {
  const { id } = useParams()
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showExtractModal, setShowExtractModal] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractedTerms, setExtractedTerms] = useState<any[]>([])
  const [editingTerm, setEditingTerm] = useState<any>(null)
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
  const updateTerm = useUpdateGlossaryTerm()
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

  const handleAutoExtract = async () => {
    setExtracting(true)
    try {
      const response = await axios.post(`/api/glossary/auto-extract/${id}`, {
        minOccurrences: 2,
        autoApprove: false,
      })
      
      // Filter out terms that already exist in glossary
      const existingSourceTerms = new Set(
        glossary?.map(t => t.sourceTerm.toLowerCase()) || []
      )
      
      const newTerms = (response.data.data.extracted || []).filter(
        (term: any) => !existingSourceTerms.has(term.sourceTerm.toLowerCase())
      )
      
      setExtractedTerms(newTerms)
      setShowExtractModal(true)
      
      if (newTerms.length === 0) {
        toast('Không có thuật ngữ mới. Tất cả đã có trong glossary!', { icon: 'ℹ️' })
      } else {
        toast.success(`Phát hiện ${newTerms.length} thuật ngữ mới!`)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Lỗi khi auto-extract')
    } finally {
      setExtracting(false)
    }
  }

  const handleEdit = (term: any) => {
    setEditingTerm(term)
    setFormData({
      sourceTerm: term.sourceTerm,
      targetTerm: term.targetTerm,
      category: term.category || '',
      description: term.description || '',
      autoApply: true,
    })
    setShowEditModal(true)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await updateTerm.mutateAsync({
        id: editingTerm.id,
        data: {
          sourceTerm: formData.sourceTerm,
          targetTerm: formData.targetTerm,
          category: formData.category || undefined,
          description: formData.description || undefined,
        },
      })
      
      setShowEditModal(false)
      setEditingTerm(null)
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleApproveTerm = async (term: any) => {
    try {
      await createTerm.mutateAsync({
        projectId: id!,
        sourceTerm: term.sourceTerm,
        targetTerm: term.targetTerm,
        category: term.category,
        description: `Auto-extracted (${term.occurrences} lần, ${Math.round(term.confidence * 100)}% confidence)`,
        autoApply: true,
      })
      
      // Remove from extracted list
      setExtractedTerms(prev => prev.filter(t => t.sourceTerm !== term.sourceTerm))
      toast.success(`Đã thêm: ${term.sourceTerm} → ${term.targetTerm}`)
    } catch (error) {
      toast.error('Lỗi khi thêm thuật ngữ')
    }
  }

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

        <div className="flex space-x-2">
          <button
            onClick={handleAutoExtract}
            disabled={extracting}
            className="flex items-center space-x-2 px-4 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 disabled:opacity-50"
          >
            {extracting ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Sparkles size={18} />
            )}
            <span>Auto-Extract</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <PlusCircle size={18} />
            <span>Thêm Thuật Ngữ</span>
          </button>
        </div>
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
                    Thuật ngữ gốc
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{ minWidth: '200px' }}>
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
                    <td className="px-4 py-3 text-sm font-medium text-gray-900" style={{ minWidth: '200px' }}>
                      <div className="max-w-xs break-words">{term.sourceTerm}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900" style={{ minWidth: '200px' }}>
                      <div className="max-w-xs break-words">{term.targetTerm}</div>
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
                        <button
                          onClick={() => handleEdit(term)}
                          className="p-1 hover:bg-blue-100 rounded transition-colors"
                        >
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
                  className="flex-1 px-4 py-2 bg-white text-gray-900 border-2 border-gray-400 rounded-md hover:bg-gray-50 disabled:opacity-50 font-medium"
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

      {/* Edit Term Modal */}
      {showEditModal && editingTerm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Chỉnh Sửa Thuật Ngữ</h2>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thuật ngữ gốc
                </label>
                <input
                  type="text"
                  value={formData.sourceTerm}
                  onChange={(e) => setFormData({ ...formData, sourceTerm: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false)
                    setEditingTerm(null)
                  }}
                  disabled={updateTerm.isPending}
                  className="flex-1 px-4 py-2 bg-white text-gray-900 border-2 border-gray-400 rounded-md hover:bg-gray-50 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={updateTerm.isPending}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
                >
                  {updateTerm.isPending ? (
                    <>
                      <Loader2 size={16} className="animate-spin mr-2" />
                      Đang cập nhật...
                    </>
                  ) : (
                    'Cập Nhật'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Auto-Extract Results Modal */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Auto-Extracted Terms</h2>
                <p className="text-sm text-gray-600">
                  Review và approve các thuật ngữ được phát hiện
                </p>
              </div>
              <button
                onClick={() => setShowExtractModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-auto">
              {extractedTerms.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">Không tìm thấy thuật ngữ nào</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Original</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Translation</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Occurrences</th>
                      <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 uppercase">Confidence</th>
                      <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {extractedTerms.map((term, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{term.sourceTerm}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">{term.targetTerm}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                            {term.category}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-center">{term.occurrences}x</td>
                        <td className="px-4 py-3 text-sm text-center">
                          <span className={`font-medium ${
                            term.confidence >= 0.8 ? 'text-green-600' :
                            term.confidence >= 0.6 ? 'text-yellow-600' : 'text-gray-600'
                          }`}>
                            {Math.round(term.confidence * 100)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleApproveTerm(term)}
                            className="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            <Check size={14} className="inline mr-1" />
                            Approve
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center">
              <p className="text-sm text-gray-600">
                {extractedTerms.length} thuật ngữ được phát hiện
              </p>
              <button
                onClick={() => setShowExtractModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}