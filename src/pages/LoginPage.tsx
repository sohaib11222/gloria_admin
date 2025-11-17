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
  const { setAuthed, setRole, setAgreementsAccepted, state } = useAppStore()
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
        } catch (authError) {
          console.error('Authentication failed:', authError)
          toast.error('Login failed. Please check your credentials.')
          return
        }
      }
      
      // Check if agreements are accepted
      if (!state.agreementsAccepted) {
        navigate('/agreements')
      } else {
        navigate('/connectivity')
      }
    } catch (error) {
      console.error('Login failed:', error)
      toast.error('Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl p-3 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Admin Dashboard
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to access the Car Hire middleware admin interface
          </p>
        </div>
        
        <Card className="shadow-2xl border-0">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your credentials to continue</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <Input
                  label="Email Address"
                  type="email"
                  autoComplete="email"
                  placeholder="admin@example.com"
                  error={errors.email?.message}
                  {...register('email')}
                  className="transition-all duration-200"
                />
              </div>
              
              <div>
                <Input
                  label="Password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  error={errors.password?.message}
                  {...register('password')}
                  className="transition-all duration-200"
                />
              </div>
              
              <Button
                type="submit"
                loading={isLoading}
                className="w-full mt-2 h-11"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <p className="text-xs text-center text-gray-500">
                Secure access to Car Hire Middleware administration
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Car Hire Middleware Platform
          </p>
        </div>
      </div>
    </div>
  )
}
