import React from 'react'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, Info, Loader2 } from 'lucide-react'

export const ProfessionalToaster = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={16}
      containerClassName="!z-[9999]"
      containerStyle={{
        top: 20,
        right: 20,
        zIndex: 9999,
      }}
      // Limit visible toasts to prevent stacking
      visibleToasts={5}
      // Prevent duplicate toasts
      toastOptions={{
        // Default options
        className: 'font-medium',
        duration: 4000,
        // Enable close button
        closeButton: true,
        style: {
          background: '#ffffff',
          color: '#111827',
          padding: '16px 20px',
          borderRadius: '12px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          border: '1px solid #e5e7eb',
          fontSize: '14px',
          fontWeight: '500',
          maxWidth: '450px',
          minWidth: '300px',
          lineHeight: '1.6',
          letterSpacing: '0.01em',
          zIndex: 9999,
        },
        // Success toast
        success: {
          duration: 3000,
          closeButton: true,
          iconTheme: {
            primary: '#10b981',
            secondary: '#ffffff',
          },
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #10b981',
            borderLeft: '5px solid #10b981',
            boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)',
            zIndex: 9999,
          },
          icon: <CheckCircle size={22} className="text-green-500 flex-shrink-0" />,
          className: 'toast-success',
        },
        // Error toast
        error: {
          duration: 5000,
          closeButton: true,
          iconTheme: {
            primary: '#ef4444',
            secondary: '#ffffff',
          },
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #ef4444',
            borderLeft: '5px solid #ef4444',
            boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.04)',
            zIndex: 9999,
          },
          icon: <XCircle size={22} className="text-red-500 flex-shrink-0" />,
          className: 'toast-error',
        },
        // Loading toast
        loading: {
          duration: Infinity,
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #3b82f6',
            borderLeft: '5px solid #3b82f6',
            boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
          },
          icon: <Loader2 size={22} className="text-blue-500 flex-shrink-0 animate-spin" />,
          className: 'toast-loading',
        },
        // Warning toast
        custom: {
          style: {
            background: '#ffffff',
            color: '#111827',
            border: '1px solid #f59e0b',
            borderLeft: '5px solid #f59e0b',
            boxShadow: '0 20px 25px -5px rgba(245, 158, 11, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.04)',
          },
          icon: <AlertCircle size={22} className="text-yellow-500 flex-shrink-0" />,
          className: 'toast-warning',
        },
      }}
    />
  )
}

// Helper function to show professional toasts
export const showToast = {
  success: (message: string) => {
    return toast.success(message, {
      id: `success-${message.substring(0, 50)}`, // Prevent duplicates
      closeButton: true,
      style: {
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #10b981',
        borderLeft: '5px solid #10b981',
        boxShadow: '0 20px 25px -5px rgba(16, 185, 129, 0.1), 0 10px 10px -5px rgba(16, 185, 129, 0.04)',
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '450px',
        minWidth: '300px',
        zIndex: 9999,
      },
      icon: <CheckCircle size={22} className="text-green-500 flex-shrink-0" />,
      duration: 3000,
    })
  },
  error: (message: string) => {
    return toast.error(message, {
      id: `error-${message.substring(0, 50)}`, // Prevent duplicates
      closeButton: true,
      style: {
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #ef4444',
        borderLeft: '5px solid #ef4444',
        boxShadow: '0 20px 25px -5px rgba(239, 68, 68, 0.1), 0 10px 10px -5px rgba(239, 68, 68, 0.04)',
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '450px',
        minWidth: '300px',
        zIndex: 9999,
      },
      icon: <XCircle size={22} className="text-red-500 flex-shrink-0" />,
      duration: 5000,
    })
  },
  warning: (message: string) => {
    return toast(message, {
      icon: <AlertCircle size={22} className="text-yellow-500 flex-shrink-0" />,
      style: {
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #f59e0b',
        borderLeft: '5px solid #f59e0b',
        boxShadow: '0 20px 25px -5px rgba(245, 158, 11, 0.1), 0 10px 10px -5px rgba(245, 158, 11, 0.04)',
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '450px',
        minWidth: '300px',
      },
      duration: 4000,
    })
  },
  info: (message: string) => {
    return toast(message, {
      icon: <Info size={22} className="text-blue-500 flex-shrink-0" />,
      style: {
        background: '#ffffff',
        color: '#111827',
        border: '1px solid #3b82f6',
        borderLeft: '5px solid #3b82f6',
        boxShadow: '0 20px 25px -5px rgba(59, 130, 246, 0.1), 0 10px 10px -5px rgba(59, 130, 246, 0.04)',
        padding: '16px 20px',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: '500',
        maxWidth: '450px',
        minWidth: '300px',
      },
      duration: 4000,
    })
  },
}


