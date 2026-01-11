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
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-md w-full space-y-8 relative z-10">
        <div className="text-center animate-fade-in">
          <div className="flex items-center justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl blur-lg opacity-50 animate-pulse"></div>
              <div className="relative bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-4 shadow-2xl transform transition-transform hover:scale-105">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </div>
          <h2 className="text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-base text-gray-600 font-medium">
            Sign in to access the Gloria Connect admin interface
          </p>
        </div>
        
        <Card className="shadow-2xl border-0 backdrop-blur-sm bg-white/90 transform transition-all duration-300 hover:shadow-3xl">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5"></div>
            <div className="relative">
              <CardTitle className="text-2xl font-bold text-gray-900">Welcome back</CardTitle>
              <p className="text-sm text-gray-600 mt-2 font-medium">Enter your credentials to continue</p>
            </div>
          </CardHeader>
          <CardContent className="pt-8 pb-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                  className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
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
                  className="transition-all duration-300 focus:scale-[1.02] focus:shadow-lg"
                />
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-4 h-12 text-base font-semibold shadow-lg hover:shadow-xl transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-gray-500">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <p className="text-xs font-medium">
                  Secure access to Gloria Connect administration
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500 font-medium tracking-wide">
            Gloria Connect Platform
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
      `}</style>
    </div>
  )
}
