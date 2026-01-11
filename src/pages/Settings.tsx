import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { companyWhitelistApi } from '../api/whitelist'
import { smtpApi, type SmtpConfigInput } from '../api/smtp'
import toast from 'react-hot-toast'
import { Shield, Save, Plus, X, Mail, TestTube, Trash2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function Settings() {
  const [newDomain, setNewDomain] = useState('')
  const [testEmail, setTestEmail] = useState('')
  const [smtpForm, setSmtpForm] = useState<SmtpConfigInput>({
    host: '',
    port: 587,
    secure: false,
    user: '',
    password: '',
    fromEmail: 'no-reply@carhire.local',
    fromName: 'Gloria Connect',
    enabled: true,
  })
  const queryClient = useQueryClient()

  const { data: whitelistedDomains = [], isLoading } = useQuery({
    queryKey: ['companyWhitelist'],
    queryFn: () => companyWhitelistApi.getCompanyWhitelist(),
  })

  const { data: smtpData, isLoading: isLoadingSmtp } = useQuery({
    queryKey: ['smtpConfig'],
    queryFn: () => smtpApi.getConfig(),
  })

  // Populate form when SMTP config is loaded
  useEffect(() => {
    if (smtpData?.config) {
      setSmtpForm({
        host: smtpData.config.host,
        port: smtpData.config.port,
        secure: smtpData.config.secure,
        user: smtpData.config.user,
        password: '', // Don't populate password
        fromEmail: smtpData.config.fromEmail,
        fromName: smtpData.config.fromName || 'Gloria Connect',
        enabled: smtpData.config.enabled,
      })
    }
  }, [smtpData])

  const updateMutation = useMutation({
    mutationFn: (domains: string[]) => companyWhitelistApi.updateCompanyWhitelist(domains),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companyWhitelist'] })
      toast.success('Company whitelist updated successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update company whitelist')
    },
  })

  const handleAddDomain = () => {
    if (!newDomain.trim()) {
      toast.error('Please enter a domain or IP address')
      return
    }
    const updated = [...whitelistedDomains, newDomain.trim()]
    updateMutation.mutate(updated)
    setNewDomain('')
  }

  const handleRemoveDomain = (domain: string) => {
    const updated = whitelistedDomains.filter((d) => d !== domain)
    updateMutation.mutate(updated)
  }

  // SMTP mutations
  const saveSmtpMutation = useMutation({
    mutationFn: (config: SmtpConfigInput) => smtpApi.saveConfig(config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtpConfig'] })
      toast.success('SMTP configuration saved successfully')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save SMTP configuration')
    },
  })

  const testSmtpMutation = useMutation({
    mutationFn: (to: string) => smtpApi.testConfig(to),
    onSuccess: () => {
      toast.success('Test email sent successfully! Check your inbox.')
      setTestEmail('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send test email')
    },
  })

  const deleteSmtpMutation = useMutation({
    mutationFn: () => smtpApi.deleteConfig(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtpConfig'] })
      setSmtpForm({
        host: '',
        port: 587,
        secure: false,
        user: '',
        password: '',
        fromEmail: 'no-reply@carhire.local',
        fromName: 'Gloria Connect',
        enabled: true,
      })
      toast.success('SMTP configuration deleted. System will use environment variables.')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete SMTP configuration')
    },
  })

  const handleSmtpSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!smtpForm.password && !smtpData?.config) {
      toast.error('Please enter SMTP password')
      return
    }
    // If password is empty but config exists, use existing password (don't update it)
    if (!smtpForm.password && smtpData?.config) {
      // Don't update password if it's empty
      const { password, ...configWithoutPassword } = smtpForm
      saveSmtpMutation.mutate({ ...configWithoutPassword, password: 'KEEP_EXISTING' } as any)
    } else {
      saveSmtpMutation.mutate(smtpForm)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-gray-600">
          System configuration and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Health Monitor</p>
                  <p className="text-sm text-gray-600">Enable automatic health monitoring</p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">OTA Mapper</p>
                  <p className="text-sm text-gray-600">Enable OTA data mapping</p>
                </div>
                <Badge variant="success">Enabled</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Backend Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="font-medium">API Base URL</p>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                  {(() => {
                    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL
                    if (import.meta.env.PROD) return 'Same Origin (Production)'
                    return 'http://localhost:8080'
                  })()}
                </code>
              </div>
              <div>
                <p className="font-medium">Version</p>
                <p className="text-sm text-gray-600">v1.0.0</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Whitelist (Domains) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Company Whitelist (Domains)</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Manage domains and IPs that are allowed to access your company's endpoints. 
            Used for branch import and other company-specific operations.
          </p>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="localhost, 127.0.0.1, *.example.com"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDomain()
                    }
                  }}
                />
                <Button onClick={handleAddDomain} loading={updateMutation.isPending}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Domain
                </Button>
              </div>

              <p className="text-xs text-gray-500">
                Supports IP addresses (192.168.1.1), hostnames (localhost), and wildcards (*.example.com)
              </p>

              {whitelistedDomains.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Whitelisted Domains:</p>
                  <div className="flex flex-wrap gap-2">
                    {whitelistedDomains.map((domain, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2"
                      >
                        <span className="text-sm font-mono text-blue-900">{domain}</span>
                        <button
                          onClick={() => handleRemoveDomain(domain)}
                          className="text-blue-600 hover:text-blue-800"
                          disabled={updateMutation.isPending}
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No domains whitelisted</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Add domains above to restrict access to your company endpoints
                  </p>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Company whitelist is used when importing branches from supplier endpoints. 
                  The source's HTTP endpoint must be whitelisted for branch import to work.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            <CardTitle>SMTP Configuration</CardTitle>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Configure SMTP settings for sending emails. If not configured, the system will use environment variables (EMAIL_HOST, EMAIL_USER, EMAIL_PASS).
          </p>
        </CardHeader>
        <CardContent>
          {isLoadingSmtp ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status indicator */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                {smtpData?.configured ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">SMTP Configured</p>
                      <p className="text-sm text-gray-600">
                        Using admin-configured SMTP settings
                      </p>
                    </div>
                  </>
                ) : smtpData?.usingEnvVars ? (
                  <>
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">Using Environment Variables</p>
                      <p className="text-sm text-gray-600">
                        SMTP settings are loaded from environment variables
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <p className="font-medium text-gray-900">No SMTP Configuration</p>
                      <p className="text-sm text-gray-600">
                        Configure SMTP below or set environment variables
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* SMTP Form */}
              <form onSubmit={handleSmtpSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Host <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="smtp.gmail.com"
                      value={smtpForm.host}
                      onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Port <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="number"
                      placeholder="587"
                      value={smtpForm.port}
                      onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                      required
                      min={1}
                      max={65535}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      587 (STARTTLS) or 465 (SSL/TLS)
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Username <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="text"
                      placeholder="your-email@gmail.com"
                      value={smtpForm.user}
                      onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      SMTP Password <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="password"
                      placeholder={smtpData?.config ? "Leave empty to keep existing" : "Enter password"}
                      value={smtpForm.password}
                      onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                      required={!smtpData?.config}
                    />
                    {smtpData?.config && (
                      <p className="text-xs text-gray-500 mt-1">
                        Leave empty to keep existing password
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Email <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="no-reply@carhire.local"
                      value={smtpForm.fromEmail}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      From Name
                    </label>
                    <Input
                      type="text"
                      placeholder="Gloria Connect"
                      value={smtpForm.fromName}
                      onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpForm.secure}
                      onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Use SSL/TLS (port 465)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={smtpForm.enabled}
                      onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm font-medium text-gray-700">
                      Enabled
                    </span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    loading={saveSmtpMutation.isPending}
                    className="flex-1"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save SMTP Configuration
                  </Button>

                  {smtpData?.config && (
                    <Button
                      type="button"
                      variant="danger"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete the SMTP configuration? The system will fall back to environment variables.')) {
                          deleteSmtpMutation.mutate()
                        }
                      }}
                      loading={deleteSmtpMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  )}
                </div>
              </form>

              {/* Test Email */}
              {smtpData?.configured && (
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Test SMTP Configuration</h3>
                  <div className="flex gap-2">
                    <Input
                      type="email"
                      placeholder="test@example.com"
                      value={testEmail}
                      onChange={(e) => setTestEmail(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      onClick={() => {
                        if (!testEmail) {
                          toast.error('Please enter an email address')
                          return
                        }
                        testSmtpMutation.mutate(testEmail)
                      }}
                      loading={testSmtpMutation.isPending}
                      disabled={!testEmail}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test Email
                    </Button>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Send a test email to verify your SMTP configuration is working correctly
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
