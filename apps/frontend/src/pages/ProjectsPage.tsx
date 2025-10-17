import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, FolderOpen, Languages, Calendar } from 'lucide-react'

// Mock data - sẽ thay bằng API call sau
const mockProjects = [
  {
    id: '1',
    name: 'Visual Novel RPG',
    description: 'Dịch game visual novel từ tiếng Anh sang tiếng Việt',
    sourceLang: 'en',
    targetLang: 'vi',
    gameFormat: 'renpy',
    totalEntries: 1234,
    translatedEntries: 856,
    createdAt: '2024-01-15',
  },
  {
    id: '2',
    name: 'RPG Maker Adventure',
    description: 'Game phiêu lưu RPG Maker',
    sourceLang: 'en',
    targetLang: 'vi',
    gameFormat: 'rpgmaker',
    totalEntries: 2341,
    translatedEntries: 450,
    createdAt: '2024-02-01',
  },
]

export default function ProjectsPage() {
  const [showCreateModal, setShowCreateModal] = useState(false)

  const getProgress = (translated: number, total: number) => {
    return total > 0 ? Math.round((translated / total) * 100) : 0
  }

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dự Án Dịch Thuật</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các dự án dịch game của bạn
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <PlusCircle size={20} />
          <span>Tạo Dự Án Mới</span>
        </button>
      </div>

      {/* Projects Grid */}
      {mockProjects.length === 0 ? (
        <div className="text-center py-12">
          <FolderOpen size={64} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Chưa có dự án nào
          </h3>
          <p className="text-gray-600 mb-4">
            Bắt đầu bằng cách tạo dự án dịch thuật đầu tiên
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Tạo Dự Án
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockProjects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
            >
              <div className="p-6">
                {/* Project Header */}
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {project.name}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                    {project.gameFormat}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {project.description}
                </p>

                {/* Languages */}
                <div className="flex items-center space-x-2 mb-4 text-sm text-gray-500">
                  <Languages size={16} />
                  <span className="uppercase">{project.sourceLang}</span>
                  <span>→</span>
                  <span className="uppercase">{project.targetLang}</span>
                </div>

                {/* Progress Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Tiến độ</span>
                    <span className="font-medium text-gray-900">
                      {getProgress(project.translatedEntries, project.totalEntries)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${getProgress(
                          project.translatedEntries,
                          project.totalEntries
                        )}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>
                      {project.translatedEntries} / {project.totalEntries} entries
                    </span>
                  </div>
                </div>

                {/* Date */}
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar size={14} className="mr-1" />
                  <span>Tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold mb-4">Tạo Dự Án Mới</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tên dự án
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="VD: Visual Novel XYZ"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mô tả (tùy chọn)
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Mô tả ngắn về dự án..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngôn ngữ gốc
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="zh">中文</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ngôn ngữ đích
                  </label>
                  <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="vi">Tiếng Việt</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Định dạng game
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                  <option value="renpy">Ren'Py</option>
                  <option value="rpgmaker">RPG Maker</option>
                  <option value="xml">XML</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Tạo Dự Án
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}