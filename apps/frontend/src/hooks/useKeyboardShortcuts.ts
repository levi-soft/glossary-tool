import { useEffect } from 'react'

interface ShortcutHandlers {
  onSave?: () => void
  onRequestAI?: () => void
  onApplyAI?: () => void
  onNextEntry?: () => void
  onPrevEntry?: () => void
  onFocusSearch?: () => void
  onSelectAll?: () => void
  onEscape?: () => void
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea
      const target = e.target as HTMLElement
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
      
      // Ctrl+S: Save
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault()
        handlers.onSave?.()
        return
      }

      // Ctrl+I: Request AI (only when not in input)
      if (e.ctrlKey && e.key === 'i' && !isInput) {
        e.preventDefault()
        handlers.onRequestAI?.()
        return
      }

      // Ctrl+A: Apply AI (only when not in input)
      if (e.ctrlKey && e.key === 'a' && !isInput) {
        e.preventDefault()
        handlers.onApplyAI?.()
        return
      }

      // Ctrl+F: Focus search
      if (e.ctrlKey && e.key === 'f') {
        e.preventDefault()
        handlers.onFocusSearch?.()
        return
      }

      // Arrow keys for navigation (only when not in input)
      if (!isInput) {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          handlers.onNextEntry?.()
          return
        }

        if (e.key === 'ArrowUp') {
          e.preventDefault()
          handlers.onPrevEntry?.()
          return
        }
      }

      // Escape: Cancel/close
      if (e.key === 'Escape') {
        handlers.onEscape?.()
        return
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlers, enabled])
}

// Helper to show shortcuts info
export const SHORTCUTS_INFO = [
  { key: 'Ctrl+S', action: 'Lưu translation hiện tại' },
  { key: 'Ctrl+I', action: 'Request AI translation' },
  { key: 'Ctrl+A', action: 'Apply AI suggestion' },
  { key: 'Ctrl+F', action: 'Focus vào search box' },
  { key: '↑/↓', action: 'Di chuyển giữa các entries' },
  { key: 'Esc', action: 'Đóng modal/hủy' },
  { key: 'Ctrl+Enter', action: 'Lưu (trong textarea)' },
]