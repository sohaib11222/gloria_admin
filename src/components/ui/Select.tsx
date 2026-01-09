import React from 'react'
import { cn } from '../../lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  helperText?: string
  options: Array<{ value: string; label: string }>
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  className,
  id,
  options,
  ...props
}) => {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className="space-y-1">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm',
          'bg-white text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
          'transition-all duration-200',
          'sm:text-sm',
          'hover:border-gray-400',
          error && 'border-red-300 focus:ring-red-500 focus:border-red-500 bg-red-50',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
      {helperText && !error && (
        <p className="text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  )
}
