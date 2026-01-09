import React from 'react'
import { AlertCircle, XCircle, Info, AlertTriangle } from 'lucide-react'
import { cn } from '../../lib/utils'

interface ErrorDisplayProps {
  error: string | Error | { message?: string; error?: string } | null
  title?: string
  variant?: 'error' | 'warning' | 'info'
  className?: string
  onDismiss?: () => void
  showIcon?: boolean
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title,
  variant = 'error',
  className,
  onDismiss,
  showIcon = true,
}) => {
  if (!error) return null

  // Extract error message
  let errorMessage = ''
  if (typeof error === 'string') {
    errorMessage = error
  } else if (error instanceof Error) {
    errorMessage = error.message
  } else if (error?.message) {
    errorMessage = error.message
  } else if (error?.error) {
    errorMessage = error.error
  } else {
    errorMessage = 'An unknown error occurred'
  }

  const variantStyles = {
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: 'text-red-600',
      iconComponent: XCircle,
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: 'text-yellow-600',
      iconComponent: AlertTriangle,
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: 'text-blue-600',
      iconComponent: Info,
    },
  }

  const styles = variantStyles[variant]
  const IconComponent = styles.iconComponent

  return (
    <div
      className={cn(
        'rounded-lg border p-4',
        styles.bg,
        styles.border,
        className
      )}
      role="alert"
    >
      <div className="flex items-start">
        {showIcon && (
          <IconComponent
            className={cn('h-5 w-5 flex-shrink-0 mt-0.5', styles.icon)}
            aria-hidden="true"
          />
        )}
        <div className={cn('flex-1 ml-3', styles.text)}>
          {title && (
            <h3 className="text-sm font-semibold mb-1">{title}</h3>
          )}
          <p className="text-sm">{errorMessage}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className={cn(
              'ml-4 flex-shrink-0 rounded-md p-1.5 transition-colors',
              'hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-offset-2',
              styles.text,
              styles.border
            )}
            aria-label="Dismiss"
          >
            <XCircle className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}

