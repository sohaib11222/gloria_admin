import React, { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Loader } from '../components/ui/Loader'
import { Modal } from '../components/ui/Modal'
import { locationValidationApi, LocationValidationRequest, LocationValidationResponse } from '../api/whitelist'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, AlertCircle, FileCheck, Code, Loader2, Trash2, Maximize2, Minimize2, Info } from 'lucide-react'

export default function LocationValidation() {
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] = useState<LocationValidationResponse | null>(null)
  const [showResult, setShowResult] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const validateMutation = useMutation({
    mutationFn: (payload: LocationValidationRequest) => locationValidationApi.validateLocation(payload),
    onSuccess: (data) => {
      setValidationResult(data)
      setShowResult(true)
      if (data.status === 'success') {
        toast.success('Location data is valid!')
      } else {
        toast.error('Validation failed. Check the details below.')
      }
    },
    onError: (error: any) => {
      // Handle 422 validation errors - they contain structured error data
      const errorData = error.response?.data
      if (errorData && errorData.status === 'error') {
        // This is a validation error with structured data
        setValidationResult({
          status: 'error',
          message: errorData.message || 'Location validation failed',
          error: errorData.error || errorData.message || 'Location validation failed',
          fields: errorData.fields || [],
          days: errorData.days || [],
        })
        setShowResult(true)
        toast.error(errorData.message || 'Validation failed. Check the details below.')
      } else {
        // Generic error
        const errorMessage = errorData?.message || error.message || 'Failed to validate location'
        toast.error(errorMessage)
        setValidationResult({
          status: 'error',
          message: errorMessage,
          error: errorMessage,
        })
        setShowResult(true)
      }
    },
  })

  const handleValidate = () => {
    try {
      const parsed = JSON.parse(jsonInput)
      validateMutation.mutate(parsed)
    } catch (error) {
      toast.error('Invalid JSON format. Please check your JSON syntax.')
    }
  }

  const handleLoadExample = () => {
    // Example JSON - CompanyCode is optional for admin users
    // Note: For SOURCE users, CompanyCode must match their company code
    // For ADMIN users, CompanyCode can be any value or omitted
    const example: LocationValidationRequest = {
      // CompanyCode is optional for admins - you can remove this field entirely or set any value
      // Uncomment the line below if you want to include CompanyCode in the example
      // CompanyCode: 'EXAMPLE_CODE',
      Branchcode: 'BR001',
      Name: 'Airport Branch',
      LocationType: 'AIRPORT',
      CollectionType: 'COUNTER',
      AtAirport: true,
      Latitude: 53.36,
      Longitude: -2.27,
      EmailAddress: 'branch@example.com',
      Telephone: {
        attr: {
          PhoneNumber: '+441234567890',
        },
      },
      Address: {
        AddressLine: { value: '123 Main St' },
        CityName: { value: 'Manchester' },
        PostalCode: { value: 'M1 1AA' },
        CountryName: {
          value: 'United Kingdom',
          attr: { Code: 'GB' },
        },
      },
      Opening: {
        Monday: { attr: { Open: '08:00', Closed: '20:00' } },
        Tuesday: { attr: { Open: '08:00', Closed: '20:00' } },
        Wednesday: { attr: { Open: '08:00', Closed: '20:00' } },
        Thursday: { attr: { Open: '08:00', Closed: '20:00' } },
        Friday: { attr: { Open: '08:00', Closed: '20:00' } },
        Saturday: { attr: { Open: '09:00', Closed: '18:00' } },
        Sunday: { attr: { Open: '10:00', Closed: '16:00' } },
      },
    }
    setJsonInput(JSON.stringify(example, null, 2))
  }

  const handleClear = () => {
    setJsonInput('')
    setValidationResult(null)
    setShowResult(false)
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl shadow-sm">
            <FileCheck className="w-8 h-8 text-green-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Location Validation
            </h1>
            <p className="mt-2 text-gray-600 font-medium">
              Validate location JSON payloads before importing branches. Ensures data meets all requirements.
            </p>
          </div>
        </div>
      </div>

      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Code className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-xl font-bold text-gray-900">Location JSON Validator</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Paste your location JSON below to validate it against the specification
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex gap-3">
                <Button 
                  variant="secondary" 
                  size="sm" 
                  onClick={handleLoadExample}
                  className="flex items-center gap-2 shadow-sm hover:shadow-md"
                >
                  <Loader2 className="w-4 h-4" />
                  Load Example
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleClear}
                  className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear
                </Button>
              </div>
              <Button
                onClick={handleValidate}
                loading={validateMutation.isPending}
                disabled={!jsonInput.trim()}
                variant="primary"
                className="flex items-center gap-2 shadow-lg hover:shadow-xl"
              >
                <FileCheck className="w-4 h-4" />
                Validate JSON
              </Button>
            </div>

            <div className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Code className="w-4 h-4 text-gray-600" />
                  Location JSON
                </label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="flex items-center gap-2"
                >
                  {isExpanded ? (
                    <>
                      <Minimize2 className="w-4 h-4" />
                      Collapse
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-4 h-4" />
                      Expand
                    </>
                  )}
                </Button>
              </div>
              <div className="relative">
                <textarea
                  value={jsonInput}
                  onChange={(e) => setJsonInput(e.target.value)}
                  placeholder="Paste location JSON here..."
                  className={`w-full p-4 border-2 border-gray-300 rounded-xl font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white shadow-sm hover:shadow-md ${
                    isExpanded ? 'h-[600px]' : 'h-96'
                  }`}
                  style={{ fontFamily: 'Monaco, Menlo, "Courier New", monospace' }}
                />
                {jsonInput && (
                  <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200 inline-block">
                    <span className="flex items-center gap-1">
                      <FileCheck className="w-3 h-3" />
                      {jsonInput.split('\n').length} lines
                    </span>
                    <span className="flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {jsonInput.length} characters
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Card className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-2 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Info className="w-5 h-5 text-blue-600" />
                  </div>
                  <h4 className="text-lg font-bold text-blue-900">Validation Rules</h4>
                </div>
                <ul className="text-sm text-blue-900 space-y-3">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-blue-900">CompanyCode:</strong>
                      <ul className="ml-4 mt-1 space-y-1 text-blue-800">
                        <li>• <strong>Admin users:</strong> Optional - can be omitted or set to any value</li>
                        <li>• <strong>Source users:</strong> Required - must match your company code exactly</li>
                      </ul>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>All required fields must be present (Branchcode, Name, LocationType, CollectionType, AtAirport)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Email format must be valid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Phone must match pattern: <code className="bg-blue-100 px-2 py-0.5 rounded font-mono font-bold text-xs">^\+[0-9]{10,15}$</code></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>All 7 days of opening hours required (Monday-Sunday)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Address fields must be complete (AddressLine, CityName, PostalCode, CountryName with Code)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <span>Coordinates (Latitude/Longitude) must be valid numbers</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Validation Result Modal */}
      <Modal
        isOpen={showResult}
        onClose={() => setShowResult(false)}
        title="Validation Result"
        size="lg"
      >
        {validationResult && (
          <div className="space-y-6">
            <div className={`flex items-center gap-4 p-4 rounded-xl border-2 ${
              validationResult.status === 'success' 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' 
                : 'bg-gradient-to-r from-red-50 to-rose-50 border-red-200'
            }`}>
              {validationResult.status === 'success' ? (
                <>
                  <div className="p-3 bg-green-100 rounded-xl">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="success" size="lg" className="font-bold mb-2">Valid</Badge>
                    <p className="text-sm font-semibold text-gray-900">{validationResult.message}</p>
                  </div>
                </>
              ) : (
                <>
                  <div className="p-3 bg-red-100 rounded-xl">
                    <XCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <Badge variant="danger" size="lg" className="font-bold mb-2">Invalid</Badge>
                    <p className="text-sm font-semibold text-gray-900">{validationResult.message}</p>
                  </div>
                </>
              )}
            </div>

            {validationResult.status === 'error' && (
              <div className="space-y-4">
                {validationResult.fields && validationResult.fields.length > 0 && (
                  <Card className="border-2 border-red-200 bg-gradient-to-r from-red-50 to-rose-50">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-bold text-red-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Missing or Invalid Fields:
                      </h4>
                      <ul className="space-y-2">
                        {validationResult.fields.map((field, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-red-800 bg-white px-3 py-2 rounded-lg border border-red-200">
                            <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <code className="font-mono font-bold">{field}</code>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {validationResult.days && validationResult.days.length > 0 && (
                  <Card className="border-2 border-yellow-200 bg-gradient-to-r from-yellow-50 to-amber-50">
                    <CardContent className="p-5">
                      <h4 className="text-sm font-bold text-yellow-900 mb-3 flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600" />
                        Missing Opening Hours:
                      </h4>
                      <ul className="space-y-2">
                        {validationResult.days.map((day, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-yellow-800 bg-white px-3 py-2 rounded-lg border border-yellow-200">
                            <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                            <span className="font-semibold">{day}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {validationResult.error && (
                  <Card className="border-2 border-red-300 bg-gradient-to-r from-red-50 to-rose-50">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-sm font-bold text-red-900 mb-2">Error Details:</h4>
                          <p className="text-sm text-red-800 font-mono bg-white px-3 py-2 rounded-lg border border-red-200">{validationResult.error}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {validationResult.status === 'success' && (
              <Card className="border-2 border-green-300 bg-gradient-to-r from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-100 rounded-xl">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-bold text-green-900 mb-2">Validation Successful!</h4>
                      <p className="text-sm text-green-800 leading-relaxed">
                        ✓ All validation checks passed. This location data is ready to be imported.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

