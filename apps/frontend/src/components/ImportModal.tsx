import { useState } from 'react'
import { Upload, X, FileText, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

interface ImportModalProps {
  projectId: string
  onClose: () => void
  onSuccess: () => void
}

export default function ImportModal({ projectId, onClose, onSuccess }: ImportModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [format, setFormat] = useState<string>('auto')
  const [autoApplyGlossary, setAutoApplyGlossary] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0])
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!file) {
      toast.error('Vui lòng chọn file')
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (format !== 'auto') {
        formData.append('format', format)
      }
      formData.append('autoApplyGlossary', String(autoApplyGlossary))

      const response = await axios.post(
        `/api/import/${projectId}`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )

      toast.success(
        `Import thành công! ${response.data.data.imported} entries được tạo.`
      )
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Import error:', error)
      toast.error(
        error.response?.data?.error || 'Lỗi khi import file'
      )
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Import Game File</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-lg bg-gray-100"
            disabled={uploading}
          >
            <X size={24} className="text-gray-900" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {file ? (
              <div className="space-y-2">
                <FileText size={48} className="mx-auto text-blue-600" />
                <p className="text-sm font-medium text-gray-900">{file.name}</p>
                <p className="text-xs text-gray-500">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Xóa file
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload size={48} className="mx-auto text-gray-400" />
                <p className="text-sm text-gray-600">
                  Kéo thả file vào đây hoặc
                </p>
                <label className="inline-block">
                  <span className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer">
                    Chọn File
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    accept=".json,.csv,.tsv,.rpy,.txt"
                    onChange={handleFileChange}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-2">
                  Hỗ trợ: JSON, CSV, TSV, Ren'Py (.rpy)
                </p>
              </div>
            )}
          </div>

          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Định dạng file
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="auto">Tự động nhận diện</option>
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="tsv">TSV (Tab-separated)</option>
              <option value="renpy">Ren'Py (.rpy)</option>
              <option value="rpgmaker">RPG Maker (JSON)</option>
            </select>
          </div>

          {/* Options */}
          <div className="space-y-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoApplyGlossary"
                checked={autoApplyGlossary}
                onChange={(e) => setAutoApplyGlossary(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="autoApplyGlossary" className="text-sm text-gray-700">
                Tự động áp dụng glossary terms
              </label>
            </div>
            <p className="text-xs text-gray-500 ml-6">
              Tự động match và link các thuật ngữ trong glossary với text entries
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="flex-1 px-4 py-2 bg-white text-gray-900 border-2 border-gray-400 rounded-md hover:bg-gray-50 disabled:opacity-50 font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={!file || uploading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {uploading ? (
                <>
                  <Loader2 size={16} className="animate-spin mr-2" />
                  Đang import...
                </>
              ) : (
                <>
                  <Upload size={16} className="mr-2" />
                  Import
                </>
              )}
            </button>
          </div>
        </form>

        {/* Info */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <p className="text-xs text-blue-800">
            💡 <strong>Tip:</strong> File sẽ được phân tích tự động. App sẽ extract
            tất cả text strings và tạo entries trong database. Các entries trùng lặp sẽ
            tự động được loại bỏ.
          </p>
        </div>
      </div>
    </div>
  )
}