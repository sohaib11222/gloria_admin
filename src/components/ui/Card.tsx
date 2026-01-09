import React from 'react'
import { cn } from '../../lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl shadow-sm border border-gray-200',
        'hover:shadow-md transition-all duration-200',
        'card-hover',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn(
        'px-6 py-5 border-b border-gray-200',
        'bg-gradient-to-r from-gray-50/80 to-white',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardContent: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={cn('px-6 py-5', className)}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardTitle: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <h3
      className={cn('text-lg font-semibold text-gray-900', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <p
      className={cn('text-sm text-gray-600 mt-1', className)}
      {...props}
    >
      {children}
    </p>
  )
}
