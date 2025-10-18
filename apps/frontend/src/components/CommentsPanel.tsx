import { useState } from 'react'
import { MessageCircle, Send, Trash2, Loader2 } from 'lucide-react'
import { useComments, useCreateComment, useDeleteComment } from '@/lib/hooks'
import { formatDistanceToNow } from 'date-fns'
import { vi } from 'date-fns/locale'

interface CommentsPanelProps {
  entryId: string
  onClose?: () => void
}

export default function CommentsPanel({ entryId, onClose }: CommentsPanelProps) {
  const [newComment, setNewComment] = useState('')
  
  const { data: comments, isLoading } = useComments(entryId)
  const createComment = useCreateComment()
  const deleteComment = useDeleteComment()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newComment.trim()) return

    try {
      await createComment.mutateAsync({
        textEntryId: entryId,
        content: newComment.trim(),
      })
      setNewComment('')
    } catch (error) {
      // Error handled by hook
    }
  }

  const handleDelete = async (commentId: string) => {
    if (window.confirm('Xóa comment này?')) {
      await deleteComment.mutateAsync(commentId)
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <MessageCircle size={20} className="text-blue-600" />
          <h3 className="font-semibold text-gray-900">
            Comments ({comments?.length || 0})
          </h3>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 size={32} className="mx-auto text-blue-600 animate-spin" />
          </div>
        ) : comments && comments.length > 0 ? (
          comments.map((comment: any) => (
            <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="font-medium text-sm text-gray-900">
                    {comment.user?.username || 'Unknown'}
                  </span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDistanceToNow(new Date(comment.createdAt), {
                      addSuffix: true,
                      locale: vi,
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handleDelete(comment.id)}
                  className="p-1 hover:bg-red-100 rounded transition-colors"
                  title="Xóa comment"
                >
                  <Trash2 size={14} className="text-red-600" />
                </button>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comment.content}
              </p>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <MessageCircle size={48} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm">Chưa có comment nào</p>
            <p className="text-xs mt-1">Hãy là người đầu tiên comment!</p>
          </div>
        )}
      </div>

      {/* Input Form */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Viết comment..."
            rows={2}
            className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            disabled={createComment.isPending}
          />
          <button
            type="submit"
            disabled={!newComment.trim() || createComment.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {createComment.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                <Send size={16} className="mr-1" />
                Gửi
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2">
          Ctrl+Enter để gửi nhanh
        </p>
      </div>
    </div>
  )
}