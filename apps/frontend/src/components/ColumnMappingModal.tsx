import { useState } from 'react'
import { ArrowRight, X, Eye } from 'lucide-react'

interface ColumnMapping {
  fileColumn: string
  dbField: 'skip' | 'originalText' | 'translation' | 'context'
  prefix?: string
}

interface ColumnMappingModalProps {
  columns: string[]
  previewData: any
  suggestedMapping: ColumnMapping[]
  onConfirm: (mapping: ColumnMapping[]) => void
  onCancel: () => void
}

export default function ColumnMappingModal({
  columns,
  previewData,
  suggestedMapping,
  onConfirm,
  onCancel,
}: ColumnMappingModalProps) {
  // Bắt đầu với ALL = Skip, user PHẢI chọn manual
  const [mapping, setMapping] = useState<ColumnMapping[]>(
    columns.map(col => ({ fileColumn: col, dbField: 'skip' as const }))
  )

  const updateMapping = (index: number, field: string, value: any) => {
    setMapping(prev => {
      const next = [...prev]
      next[index] = { ...next[index], [field]: value }
      return next
    })
  }

  const hasRequiredFields = () => {
    return mapping.some(m => m.dbField === 'originalText')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Chọn Cột Import</h2>
            <p className="text-sm text-red-600 mt-1 font-medium">
              ⚠️ CHỌN ĐÚNG CỘT! Mặc định tất cả = Bỏ qua
            </p>
            <p className="text-xs text-gray-600 mt-1">
              Bạn phải chọn thủ công cột nào là Text Gốc, cột nào là Bản Dịch
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-200 rounded-lg bg-gray-100"
          >
            <X size={20} className="text-gray-900" />
          </button>
        </div>

        {/* Mapping Table */}
        <div className="flex-1 overflow-auto mb-4">
          <table className="w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Cột Trong File
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  <Eye size={14} className="inline mr-1" />
                  Nội Dung Mẫu
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  <ArrowRight size={14} className="inline mr-1" />
                  Map Vào
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-900 uppercase">
                  Tùy Chọn
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {columns.map((col, idx) => (
                <tr key={col} className="hover:bg-gray-50">
                  {/* File Column */}
                  <td className="px-4 py-3">
                    <span className="font-bold text-gray-900">{col}</span>
                  </td>
                  
                  {/* Preview */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-gray-700 font-medium block max-w-xs truncate">
                      {previewData[col] || '(empty)'}
                    </span>
                  </td>
                  
                  {/* Mapping Dropdown */}
                  <td className="px-4 py-3">
                    <select
                      value={mapping[idx].dbField}
                      onChange={(e) => updateMapping(idx, 'dbField', e.target.value)}
                      className={`w-full px-3 py-2 text-sm border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold ${
                        mapping[idx].dbField === 'skip' 
                          ? 'border-gray-400 text-gray-700 bg-white' 
                          : mapping[idx].dbField === 'originalText'
                          ? 'border-green-500 text-green-800 bg-green-50'
                          : mapping[idx].dbField === 'translation'
                          ? 'border-blue-500 text-blue-800 bg-blue-50'
                          : 'border-purple-500 text-purple-800 bg-purple-50'
                      }`}
                    >
                      <option value="skip">⚪ Bỏ Qua (Skip)</option>
                      <option value="originalText">🟢 TEXT GỐC (Cần Dịch) ⭐</option>
                      <option value="translation">🔵 BẢN DỊCH (Đã Dịch)</option>
                      <option value="context">🟣 NGỮ CẢNH / CHARACTER</option>
                    </select>
                  </td>
                  
                  {/* Options */}
                  <td className="px-4 py-3">
                    {mapping[idx].dbField === 'context' ? (
                      <div className="space-y-2">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={!!mapping[idx].prefix}
                            onChange={(e) => updateMapping(idx, 'prefix', e.target.checked ? 'Character: ' : '')}
                            className="cursor-pointer w-4 h-4"
                          />
                          <span className="text-sm text-gray-900 font-medium">
                            Đây là cột Character
                          </span>
                        </label>
                        {mapping[idx].prefix && (
                          <input
                            type="text"
                            placeholder="Prefix (VD: Character: )"
                            value={mapping[idx].prefix}
                            onChange={(e) => updateMapping(idx, 'prefix', e.target.value)}
                            className="w-full px-2 py-1 text-sm border-2 border-purple-400 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Status & Actions */}
        <div className="pt-4 border-t">
          {/* Status */}
          <div className="mb-4 p-3 rounded-lg ${hasRequiredFields() ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}">
            {hasRequiredFields() ? (
              <p className="text-sm text-green-800 font-medium">
                ✓ Đã chọn cột Text Gốc - Sẵn sàng import!
              </p>
            ) : (
              <p className="text-sm text-red-800 font-medium">
                ⚠️ Phải chọn ít nhất 1 cột là TEXT GỐC (🟢)!
              </p>
            )}
            <p className="text-xs text-gray-600 mt-1">
              {columns.length} cột total • {mapping.filter(m => m.dbField !== 'skip').length} cột sẽ import
            </p>
          </div>

          {/* Actions */}
          <div className="flex space-x-3">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-white text-gray-900 border-2 border-gray-400 rounded-lg hover:bg-gray-50 font-bold"
            >
              Hủy
            </button>
            <button
              onClick={() => onConfirm(mapping)}
              disabled={!hasRequiredFields()}
              className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-bold"
            >
              ✓ Import ({mapping.filter(m => m.dbField !== 'skip').length} cột)
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}