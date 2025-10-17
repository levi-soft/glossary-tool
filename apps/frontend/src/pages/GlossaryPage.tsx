import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, PlusCircle, Edit2, Trash2, Search } from 'lucide-react'

// Mock data
const mockGlossary = [
  {
    id: '1',
    sourceTerm: 'Health Potion',
    targetTerm: 'Thuốc hồi máu',
    category: 'Items',
    description: 'Vật phẩm hồi phục HP',
  },
  {
    id: '2',
    sourceTerm: 'Dragon',
    targetTerm: 'Rồng',
    category: 'Monsters',
    description: 'Boss cấp cao',
  },
  {
    id: '3',
    sourceTerm: 'Main Character',
    targetTerm: 'Nhân vật chính',
    category: 'Story',
    description: 'Protagonist của game',
  },
  {
    id: '4',
    sourceTerm: 'HP',
    targetTerm: 'Máu',
    category: 'Game Terms',
    description: 'Health Points - điểm sinh lực',
  },
  {
    id: '5',
    sourceTerm: 'Mana',
    targetTerm: 'Năng lượng phép',
    category: 'Game Terms',
    description: 'Magic points - điểm ma thuật',
  },
]

export default function GlossaryPage() {
  const { id } = useParams()
  const [glossary] = useState(mockGlossary)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredGlossary = glossary.filter(
    (term) =>
      searchQuery === '' ||
      term.sourceTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.targetTerm.toLowerCase().includes(searchQuery.toLowerCase()) ||
      term.category.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Get unique categories
  const categories = Array.from(new Set(glossary.map((term) => term.category)))

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
          <div className="text-2xl font-bold text-gray-900">{glossary.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Danh mục</div>
          <div className="text-2xl font-bold text-gray-900">{categories.length}</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="text-sm text-gray-600 mb-1">Đang tìm kiếm</div>
          <div className="text-2xl font-bold text-gray-900">
            {filteredGlossary.length}
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

      {/* Glossary Table */}
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
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredGlossary.map((term) => (
                <tr key={term.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {term.sourceTerm}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {term.targetTerm}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                      {term.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {term.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-1 hover:bg-blue-100 rounded transition-colors">
                        <Edit2 size={16} className="text-blue-600" />
                      </button>
                      <button className="p-1 hover:bg-red-100 rounded transition-colors">
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredGlossary.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">Không tìm thấy thuật ngữ nào</p>
          </div>
        )}
      </div>

      {/* Add Term Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Thêm Thuật Ngữ Mới</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Thuật ngữ gốc
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Health Potion"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bản dịch
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Thuốc hồi máu"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Danh mục
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Chọn danh mục...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="new">+ Tạo danh mục mới</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Giải thích về thuật ngữ..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="autoApply"
                  className="mr-2"
                  defaultChecked
                />
                <label htmlFor="autoApply" className="text-sm text-gray-700">
                  Tự động áp dụng cho các text entries
                </label>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Thêm Thuật Ngữ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}