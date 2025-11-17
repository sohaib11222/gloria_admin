import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppStore } from '../state/useAppStore'
import { getAgreementTemplate, acceptAgreement } from '../api/client'
import { Button } from '../components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Loader } from '../components/ui/Loader'

interface AgreementTemplate {
  title: string
  content: string
  version: string
}

export default function AgreementsPage() {
  const navigate = useNavigate()
  const { setAgreementsAccepted } = useAppStore()
  const [agreement, setAgreement] = useState<AgreementTemplate | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAccepting, setIsAccepting] = useState(false)
  const [agreed, setAgreed] = useState(false)

  useEffect(() => {
    loadAgreement()
  }, [])

  const loadAgreement = async () => {
    try {
      setIsLoading(true)
      
      try {
        // Try to get agreement from server
        const template = await getAgreementTemplate()
        setAgreement(template)
      } catch (error) {
        // Fallback to local markdown file
        console.log('Server agreement not available, loading local file')
        const response = await fetch('/agreements/terms.md')
        if (response.ok) {
          const content = await response.text()
          setAgreement({
            title: 'Terms of Service',
            content,
            version: '1.0',
          })
        } else {
          // Final fallback
          setAgreement({
            title: 'Terms of Service',
            content: 'Default agreement terms. Please contact your administrator for the full terms.',
            version: '1.0',
          })
        }
      }
    } catch (error) {
      console.error('Failed to load agreement:', error)
      setAgreement({
        title: 'Terms of Service',
        content: 'Default agreement terms. Please contact your administrator for the full terms.',
        version: '1.0',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!agreed) return

    setIsAccepting(true)
    
    try {
      // Try to accept on server
      try {
        await acceptAgreement()
      } catch (error) {
        // Fallback to local storage
        console.log('Server agreement acceptance not available, storing locally')
      }
      
      // Set local state
      setAgreementsAccepted(true)
      
      // Navigate to registration (first-time) or connectivity
      navigate('/registration')
    } catch (error) {
      console.error('Failed to accept agreement:', error)
    } finally {
      setIsAccepting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{agreement?.title}</CardTitle>
            <p className="text-sm text-gray-600">Version: {agreement?.version}</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div 
                className="prose max-w-none bg-gray-50 p-6 rounded-lg max-h-96 overflow-y-auto"
                dangerouslySetInnerHTML={{ 
                  __html: agreement?.content.replace(/\n/g, '<br />') || '' 
                }}
              />
              
              <div className="border-t pt-6">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-700">
                    I have read and agree to the terms and conditions
                  </span>
                </label>
              </div>
              
              <div className="flex justify-end space-x-4">
                <Button
                  variant="secondary"
                  onClick={() => navigate('/login')}
                  disabled={isAccepting}
                >
                  Back to Login
                </Button>
                <Button
                  onClick={handleAccept}
                  disabled={!agreed || isAccepting}
                  loading={isAccepting}
                >
                  I Agree
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
