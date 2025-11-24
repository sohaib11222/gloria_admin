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
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default function LocationValidation() {
  const [jsonInput, setJsonInput] = useState('')
  const [validationResult, setValidationResult] = useState<LocationValidationResponse | null>(null)
  const [showResult, setShowResult] = useState(false)

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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Location Validation</h1>
        <p className="mt-2 text-gray-600">
          Validate location JSON payloads before importing branches. Ensures data meets all requirements.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Location JSON Validator</CardTitle>
          <p className="text-sm text-gray-600 mt-1">
            Paste your location JSON below to validate it against the specification
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleLoadExample}>
                  Load Example
                </Button>
                <Button variant="ghost" size="sm" onClick={handleClear}>
                  Clear
                </Button>
              </div>
              <Button
                onClick={handleValidate}
                loading={validateMutation.isPending}
                disabled={!jsonInput.trim()}
              >
                Validate JSON
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location JSON
              </label>
              <textarea
                value={jsonInput}
                onChange={(e) => setJsonInput(e.target.value)}
                placeholder="Paste location JSON here..."
                className="w-full h-96 p-4 border border-gray-300 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                style={{ fontFamily: 'Monaco, Menlo, monospace' }}
              />
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-blue-900 mb-2">Validation Rules:</h4>
              <ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
                <li><strong>CompanyCode:</strong> 
                  <ul className="ml-4 mt-1 space-y-0.5">
                    <li>• <strong>Admin users:</strong> Optional - can be omitted or set to any value</li>
                    <li>• <strong>Source users:</strong> Required - must match your company code exactly</li>
                  </ul>
                </li>
                <li>All required fields must be present (Branchcode, Name, LocationType, CollectionType, AtAirport)</li>
                <li>Email format must be valid</li>
                <li>Phone must match pattern: <code className="bg-blue-100 px-1 rounded">^\+[0-9]{10,15}$</code></li>
                <li>All 7 days of opening hours required (Monday-Sunday)</li>
                <li>Address fields must be complete (AddressLine, CityName, PostalCode, CountryName with Code)</li>
                <li>Coordinates (Latitude/Longitude) must be valid numbers</li>
              </ul>
            </div>
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
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {validationResult.status === 'success' ? (
                <>
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <Badge variant="success" size="md">Valid</Badge>
                </>
              ) : (
                <>
                  <XCircle className="h-6 w-6 text-red-600" />
                  <Badge variant="danger" size="md">Invalid</Badge>
                </>
              )}
              <span className="text-sm text-gray-600">{validationResult.message}</span>
            </div>

            {validationResult.status === 'error' && (
              <div className="space-y-3">
                {validationResult.fields && validationResult.fields.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Missing or Invalid Fields:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                      {validationResult.fields.map((field, idx) => (
                        <li key={idx} className="font-mono">{field}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.days && validationResult.days.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      Missing Opening Hours:
                    </h4>
                    <ul className="list-disc list-inside text-sm text-gray-600 space-y-1 ml-2">
                      {validationResult.days.map((day, idx) => (
                        <li key={idx}>{day}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {validationResult.error && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-sm text-red-800 font-mono">{validationResult.error}</p>
                  </div>
                )}
              </div>
            )}

            {validationResult.status === 'success' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  ✓ All validation checks passed. This location data is ready to be imported.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

