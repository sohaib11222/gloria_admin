import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { companyWhitelistApi } from '../api/whitelist'
import { smtpApi, type SmtpConfigInput } from '../api/smtp'
import http from '../lib/http'
import toast from 'react-hot-toast'
import { Shield, Save, Plus, X, Mail, TestTube, Trash2, Settings as SettingsIcon, Server, Activity } from 'lucide-react'

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

  const { data: systemStatus } = useQuery({
    queryKey: ['system-status'],
    queryFn: async () => {
      const { data } = await http.get('/admin/system-status')
      return data
    },
    retry: 1,
  })

  const { data: healthCheck } = useQuery({
    queryKey: ['admin-health'],
    queryFn: async () => {
      const { data } = await http.get('/admin/health')
      return data
    },
    retry: 1,
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

  if (isLoading || isLoadingSmtp) {
    return (
      <div className="space-y-6">
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <SettingsIcon className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
              <p className="mt-1 text-sm text-gray-600">System configuration and preferences</p>
            </div>
          </div>
        </div>
        <Loader className="min-h-96" />
      </div>
    )
  }

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? window.location.origin : 'http://localhost:8080')
  const healthMonitorEnabled = healthCheck?.checks?.db === 'ok'
  const otaMapperEnabled = true // OTA mapper is always enabled in middleware

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gray-100 rounded">
            <SettingsIcon className="w-6 h-6 text-gray-700" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
            <p className="mt-1 text-sm text-gray-600">System configuration and preferences</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <Activity className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">System Configuration</CardTitle>
                <p className="text-sm text-gray-600 mt-1">System features and capabilities</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">Health Monitor</p>
                  <p className="text-sm text-gray-600">Automatic health monitoring for sources</p>
                </div>
                <Badge variant={healthMonitorEnabled ? 'success' : 'danger'}>
                  {healthMonitorEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div>
                  <p className="font-medium text-gray-900">OTA Mapper</p>
                  <p className="text-sm text-gray-600">OTA data mapping middleware</p>
                </div>
                <Badge variant={otaMapperEnabled ? 'success' : 'danger'}>
                  {otaMapperEnabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              {systemStatus && (
                <>
                  <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <div>
                      <p className="font-medium text-gray-900">gRPC Services</p>
                      <p className="text-sm text-gray-600">{systemStatus.grpcServices?.message || 'Checking...'}</p>
                    </div>
                    <Badge 
                      variant={
                        systemStatus.grpcServices?.status === 'operational' ? 'success' :
                        systemStatus.grpcServices?.status === 'degraded' ? 'warning' : 'danger'
                      }
                    >
                      {systemStatus.grpcServices?.status || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <p className="font-medium text-gray-900">Job Queue</p>
                      <p className="text-sm text-gray-600">{systemStatus.jobQueue?.message || 'No active jobs'}</p>
                    </div>
                    <Badge 
                      variant={
                        systemStatus.jobQueue?.status === 'idle' ? 'success' :
                        systemStatus.jobQueue?.status === 'processing' ? 'info' : 'warning'
                      }
                    >
                      {systemStatus.jobQueue?.status || 'Unknown'}
                    </Badge>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded">
                <Server className="h-5 w-5 text-gray-700" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold text-gray-900">Backend Information</CardTitle>
                <p className="text-sm text-gray-600 mt-1">System connection and version details</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">API Base URL</p>
                <code className="text-sm bg-gray-100 px-3 py-2 rounded block font-mono text-gray-900 break-all">
                  {apiBaseUrl}
                </code>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Environment</p>
                <p className="text-sm text-gray-900">
                  {import.meta.env.PROD ? 'Production' : 'Development'}
                </p>
              </div>
              {healthCheck && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">System Health</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Database</span>
                      <Badge variant={healthCheck.checks?.db === 'ok' ? 'success' : 'danger'} size="sm">
                        {healthCheck.checks?.db === 'ok' ? 'Connected' : 'Error'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">gRPC Core</span>
                      <Badge variant={healthCheck.checks?.grpc_core === 'ok' ? 'success' : 'danger'} size="sm">
                        {healthCheck.checks?.grpc_core === 'ok' ? 'Operational' : 'Error'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Mailer</span>
                      <Badge variant={healthCheck.checks?.mailer === 'ok' ? 'success' : 'danger'} size="sm">
                        {healthCheck.checks?.mailer === 'ok' ? 'Ready' : 'Error'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* SMTP Configuration */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <Mail className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">SMTP Configuration</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Email server settings for notifications</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {smtpData?.usingEnvVars && !smtpData?.configured && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm text-blue-800">
                <strong>Using environment variables:</strong> SMTP is configured via EMAIL_HOST, EMAIL_USER, EMAIL_PASS environment variables.
              </p>
            </div>
          )}

          <form onSubmit={handleSmtpSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMTP Host"
                placeholder="smtp.gmail.com"
                value={smtpForm.host}
                onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                required
              />
              <Input
                label="SMTP Port"
                type="number"
                placeholder="587"
                value={smtpForm.port}
                onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="SMTP Username"
                placeholder="your-email@gmail.com"
                value={smtpForm.user}
                onChange={(e) => setSmtpForm({ ...smtpForm, user: e.target.value })}
                required
              />
              <Input
                label="SMTP Password"
                type="password"
                placeholder={smtpData?.config ? 'Leave blank to keep existing' : 'Enter password'}
                value={smtpForm.password}
                onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                required={!smtpData?.config}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="From Email"
                type="email"
                placeholder="no-reply@example.com"
                value={smtpForm.fromEmail}
                onChange={(e) => setSmtpForm({ ...smtpForm, fromEmail: e.target.value })}
                required
              />
              <Input
                label="From Name"
                placeholder="Gloria Connect"
                value={smtpForm.fromName}
                onChange={(e) => setSmtpForm({ ...smtpForm, fromName: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpForm.secure}
                  onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Use SSL/TLS (port 465)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={smtpForm.enabled}
                  onChange={(e) => setSmtpForm({ ...smtpForm, enabled: e.target.checked })}
                  className="rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Enabled</span>
              </label>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <Button
                type="submit"
                variant="primary"
                disabled={saveSmtpMutation.isPending}
                loading={saveSmtpMutation.isPending}
                className="flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {saveSmtpMutation.isPending ? 'Saving...' : 'Save SMTP Config'}
              </Button>
              
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="email"
                  placeholder="test@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (!testEmail.trim()) {
                      toast.error('Please enter an email address')
                      return
                    }
                    testSmtpMutation.mutate(testEmail)
                  }}
                  disabled={testSmtpMutation.isPending || !testEmail.trim()}
                  loading={testSmtpMutation.isPending}
                  className="flex items-center gap-2"
                >
                  <TestTube className="h-4 w-4" />
                  Test
                </Button>
              </div>

              {smtpData?.configured && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    if (confirm('Are you sure you want to delete the SMTP configuration? The system will fall back to environment variables.')) {
                      deleteSmtpMutation.mutate()
                    }
                  }}
                  disabled={deleteSmtpMutation.isPending}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              )}
            </div>
          </form>

          {smtpData?.config && (
            <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Current Configuration</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Host:</strong> {smtpData.config.host}:{smtpData.config.port}</p>
                <p><strong>User:</strong> {smtpData.config.user}</p>
                <p><strong>From:</strong> {smtpData.config.fromEmail} ({smtpData.config.fromName || 'N/A'})</p>
                <p><strong>Status:</strong> {smtpData.config.enabled ? 'Enabled' : 'Disabled'}</p>
                {smtpData.config.updatedAt && (
                  <p className="text-xs text-gray-500 mt-2">
                    Last updated: {new Date(smtpData.config.updatedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Company Whitelist (Domains) */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <Shield className="h-5 w-5 text-gray-700" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Company Domain Whitelist</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Manage allowed domains for company registrations</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="example.com or 192.168.1.1"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddDomain()
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleAddDomain}
                disabled={updateMutation.isPending}
                loading={updateMutation.isPending}
                variant="primary"
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add Domain
              </Button>
            </div>

            {whitelistedDomains.length > 0 ? (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                {whitelistedDomains.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <code className="text-sm font-mono text-gray-900">{domain}</code>
                    <Button
                      onClick={() => handleRemoveDomain(domain)}
                      disabled={updateMutation.isPending}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 border border-gray-200 rounded-lg bg-gray-50">
                <Shield className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">No whitelisted domains</p>
                <p className="text-xs text-gray-500 mt-1">Add domains or IP addresses to restrict company registrations</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
