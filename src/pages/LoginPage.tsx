import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppStore } from '../state/useAppStore'
import { authApi } from '../api/auth'
import { LoginForm, LoginSchema } from '../lib/validators'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import toast from 'react-hot-toast'
import logoImage from '../assets/logo.jpg'

export default function LoginPage() {
  const navigate = useNavigate()
  const { setAuthed, setRole, state } = useAppStore()
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    
    try {
      // Check if user is already authenticated through existing system
      const existingToken = localStorage.getItem('token')
      const existingUser = localStorage.getItem('user')
      
      if (existingToken && existingUser) {
        // User is already authenticated, use existing credentials
        console.log('Using existing authentication')
        // Authentication state will be automatically detected by useAuth hook
      } else {
        // Make real authentication API call
        console.log('Login attempt:', data.email)
        
        try {
          const response = await authApi.login(data)
          console.log('Login response:', response)
          
          // Store the real authentication tokens
          localStorage.setItem('token', response.access)
          localStorage.setItem('refreshToken', response.refresh)
          
          // Get user info from the backend
          try {
            const userInfo = await authApi.me()
            console.log('User info:', userInfo)
            localStorage.setItem('user', JSON.stringify(userInfo))
          } catch (meError) {
            console.warn('Failed to get user info, using basic info:', meError)
            // Fallback to basic user info
            const user = {
              id: 'user-from-token',
              email: data.email,
              type: 'ADMIN' as const
            }
            localStorage.setItem('user', JSON.stringify(user))
          }
          
          // Authentication state will be automatically detected by useAuth hook
          
          toast.success('Login successful!')
        } catch (authError: any) {
          console.error('Authentication failed:', authError)
          
          // Extract error details
          const errorData = authError?.response?.data || {}
          const errorCode = errorData.error || authError?.code
          const errorMessage = errorData.message || authError?.message || 'Login failed. Please check your credentials.'
          
          // Handle specific error types with user-friendly messages
          let userMessage = errorMessage
          
          if (errorCode === 'DATABASE_AUTH_ERROR' || errorCode === 'DATABASE_CONFIG_ERROR') {
            userMessage = 'Database connection error. Please contact the administrator or check server logs.'
          } else if (errorCode === 'EMAIL_NOT_VERIFIED') {
            userMessage = 'Please verify your email address before logging in.'
          } else if (errorCode === 'AUTH_ERROR') {
            userMessage = 'Invalid email or password. Please check your credentials and try again.'
          } else if (errorCode === 'INTERNAL_ERROR' && errorMessage.includes('Access denied')) {
            userMessage = 'Server configuration error. Please contact the administrator.'
          } else if (errorCode === 'INTERNAL_ERROR' && errorMessage.includes('DATABASE_URL')) {
            userMessage = 'Server configuration error. Please contact the administrator.'
          } else if (authError?.response?.status === 500 || authError?.response?.status === 503) {
            userMessage = 'Server error. Please try again later or contact support.'
          }
          
          console.error('Error details:', {
            status: authError?.response?.status,
            code: errorCode,
            data: errorData,
            message: errorMessage
          })
          
          toast.error(userMessage)
          return
        }
      }
      
      // Navigate to connectivity page (terms acceptance no longer required)
      navigate('/connectivity')
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-6">
            <img 
              src={logoImage} 
              alt="Gloria Connect" 
              className="h-16 w-auto object-contain"
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Admin Dashboard
          </h2>
          <p className="text-sm text-gray-600">
            Sign in to access the Gloria Connect admin interface
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-gray-900">Welcome back</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your credentials to continue</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
              
              <div className="space-y-2">
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                />
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                className="w-full"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <p className="text-xs">
                  Secure access to Gloria Connect administration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Gloria Connect Platform
          </p>
        </div>
      </div>
    </div>
  )
}
