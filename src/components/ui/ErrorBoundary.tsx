import React, { Component, ErrorInfo, ReactNode } from 'react'
import { ErrorDisplay } from './ErrorDisplay'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full">
            <ErrorDisplay
              error={this.state.error}
              title="Something went wrong"
              variant="error"
            />
            <div className="mt-4 flex gap-2">
              <Button onClick={this.handleReset} variant="primary">
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="secondary"
              >
                Reload Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

