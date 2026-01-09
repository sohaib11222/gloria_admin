import React, { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/utils'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string | React.ReactNode
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  showCloseButton?: boolean
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[95vw] max-h-[95vh]',
  }

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'modal-title' : undefined}
    >
      {/* Backdrop with blur effect */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ease-out"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal container */}
      <div className="flex min-h-screen items-center justify-center p-4 sm:p-6">
        <div
          className={cn(
            'relative w-full bg-white rounded-xl shadow-2xl',
            'transform transition-all duration-300 ease-out',
            'border border-gray-200',
            sizeClasses[size],
            isOpen ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
              {title && (
                <h3 
                  id="modal-title"
                  className={typeof title === 'string' ? "text-xl font-semibold text-gray-900" : "text-xl font-semibold text-gray-900"}
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="ml-auto text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Close modal"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(100vh-12rem)]">
            {children}
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}
