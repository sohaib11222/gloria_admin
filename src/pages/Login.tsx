import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useAtom } from 'jotai'
import { loginAtom } from '../store/auth'
import { authApi } from '../api/auth'
import { LoginSchema, type LoginForm } from '../lib/validators'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { Button } from '../components/ui/Button'
import { Loader } from '../components/ui/Loader'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const [, login] = useAtom(loginAtom)
  
  const from = location.state?.from?.pathname || '/'

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(LoginSchema),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      console.log('Login successful:', data)
      
      // Extract user info from JWT token
      const tokenPayload = JSON.parse(atob(data.access.split('.')[1]))
      const user = {
        id: tokenPayload.sub,
        email: tokenPayload.email || 'user@example.com', // Adjust based on your JWT payload
        type: tokenPayload.type || 'ADMIN',
        companyId: tokenPayload.companyId
      }
      
      login({ token: data.access, user })
      toast.success('Login successful!')
      navigate(from, { replace: true })
    },
    onError: (error: any) => {
      console.error('Login error:', error)
      toast.error(error.response?.data?.message || 'Login failed')
    },
  })

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-2xl p-3 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-gray-900">
            Car Hire Admin
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your admin account
          </p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Enter your credentials to continue</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                autoComplete="email"
                placeholder="admin@example.com"
                error={errors.email?.message}
                {...register('email')}
                className="transition-all duration-200"
              />

              <Input
                label="Password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                error={errors.password?.message}
                {...register('password')}
                className="transition-all duration-200"
              />

              <Button
                type="submit"
                className="w-full mt-2 h-11"
                loading={loginMutation.isPending}
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-xs font-semibold text-blue-900 mb-1">Demo credentials</p>
            <p className="text-xs text-blue-700">
              admin@example.com / password123
            </p>
          </div>
          <p className="mt-4 text-xs text-gray-400">
            Car Hire – Admin Portal
          </p>
        </div>
      </div>
    </div>
  )
}
