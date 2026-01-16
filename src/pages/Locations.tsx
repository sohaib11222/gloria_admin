import React, { useMemo, useState } from 'react'
import { Input } from '../components/ui/Input'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Select } from '../components/ui/Select'
import { Loader } from '../components/ui/Loader'
import { Badge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { locationsApi } from '../api/locations'
import { agreementsApi } from '../api/agreements'
import { unlocodesApi, CreateUNLocodeRequest } from '../api/unlocodes'
import { Plus } from 'lucide-react'
import toast from 'react-hot-toast'

interface AddLocationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const AddLocationModal: React.FC<AddLocationModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState<CreateUNLocodeRequest>({
    unlocode: '',
    country: '',
    place: '',
    iataCode: null,
    latitude: null,
    longitude: null,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const queryClient = useQueryClient()

  const createMutation = useMutation({
    mutationFn: (data: CreateUNLocodeRequest) => unlocodesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] })
      queryClient.invalidateQueries({ queryKey: ['locations', 'all'] })
      toast.success('Location added successfully')
      setFormData({
        unlocode: '',
        country: '',
        place: '',
        iataCode: null,
        latitude: null,
        longitude: null,
      })
      setErrors({})
      onSuccess()
      onClose()
    },
    onError: (error: any) => {
      const errorMessage = error.response?.data?.message || 'Failed to add location'
      const errorCode = error.response?.data?.error
      
      if (errorCode === 'UNLOCODE_EXISTS') {
        setErrors({ unlocode: 'This UN/LOCODE already exists' })
      } else if (errorCode === 'VALIDATION_ERROR') {
        const details = error.response?.data?.details || []
        const newErrors: Record<string, string> = {}
        details.forEach((err: any) => {
          if (err.path) {
            newErrors[err.path[0]] = err.message
          }
        })
        setErrors(newErrors)
      } else {
        toast.error(errorMessage)
      }
    },
  })

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.unlocode || formData.unlocode.length < 2 || formData.unlocode.length > 10) {
      newErrors.unlocode = 'UN/LOCODE must be between 2 and 10 characters'
    }
    
    if (!formData.country || formData.country.length !== 2) {
      newErrors.country = 'Country code must be exactly 2 characters (e.g., GB, US)'
    }
    
    if (!formData.place || formData.place.trim().length === 0) {
      newErrors.place = 'Place name is required'
    }
    
    if (formData.iataCode && formData.iataCode.length > 3) {
      newErrors.iataCode = 'IATA code must be 3 characters or less'
    }
    
    if (formData.latitude !== null && (formData.latitude < -90 || formData.latitude > 90)) {
      newErrors.latitude = 'Latitude must be between -90 and 90'
    }
    
    if (formData.longitude !== null && (formData.longitude < -180 || formData.longitude > 180)) {
      newErrors.longitude = 'Longitude must be between -180 and 180'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      createMutation.mutate(formData)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Location">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="UN/LOCODE *"
            placeholder="e.g., GBMAN"
            value={formData.unlocode}
            onChange={(e) => setFormData({ ...formData, unlocode: e.target.value.toUpperCase() })}
            error={errors.unlocode}
            required
            helperText="2-10 characters, will be converted to uppercase"
          />
          <Input
            label="Country Code *"
            placeholder="e.g., GB"
            value={formData.country}
            onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
            error={errors.country}
            required
            helperText="2-letter ISO country code"
            maxLength={2}
          />
        </div>

        <Input
          label="Place Name *"
          placeholder="e.g., Manchester"
          value={formData.place}
          onChange={(e) => setFormData({ ...formData, place: e.target.value })}
          error={errors.place}
          required
        />

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="IATA Code"
            placeholder="e.g., MAN"
            value={formData.iataCode || ''}
            onChange={(e) => setFormData({ ...formData, iataCode: e.target.value.toUpperCase() || null })}
            error={errors.iataCode}
            helperText="Optional, 3 characters"
            maxLength={3}
          />
          <Input
            label="Latitude"
            type="number"
            step="any"
            placeholder="e.g., 53.3656"
            value={formData.latitude !== null ? formData.latitude.toString() : ''}
            onChange={(e) => {
              const val = e.target.value
              setFormData({ ...formData, latitude: val ? parseFloat(val) : null })
            }}
            error={errors.latitude}
            helperText="Optional, -90 to 90"
          />
          <Input
            label="Longitude"
            type="number"
            step="any"
            placeholder="e.g., -2.2729"
            value={formData.longitude !== null ? formData.longitude.toString() : ''}
            onChange={(e) => {
              const val = e.target.value
              setFormData({ ...formData, longitude: val ? parseFloat(val) : null })
            }}
            error={errors.longitude}
            helperText="Optional, -180 to 180"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={createMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={createMutation.isPending}
            loading={createMutation.isPending}
          >
            {createMutation.isPending ? 'Adding...' : 'Add Location'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default function Locations() {
  const [tab, setTab] = useState<'all' | 'byAgreement' | 'bySource'>('all')
  const [agreementId, setAgreementId] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState<string>('')
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data: agreements } = useQuery({
    queryKey: ['agreements'],
    queryFn: () => agreementsApi.listAgreements(),
  })

  const { data: allLocations, isLoading: allLoading } = useQuery({
    queryKey: ['locations', 'all'],
    queryFn: () => locationsApi.getAllLocations({ limit: 50 }),
  })

  const { data: byAgreementLocations, isLoading: byAgreementLoading } = useQuery({
    queryKey: ['locations', 'agreement', agreementId],
    queryFn: () => agreementId ? locationsApi.getAgreementLocations(agreementId) : Promise.resolve({ items: [], inherited: false }),
    enabled: tab === 'byAgreement',
  })

  const { data: sourceCounts, isLoading: bySourceLoading } = useQuery({
    queryKey: ['locations', 'by-source'],
    queryFn: () => locationsApi.listSourcesLocationCounts(),
    enabled: tab === 'bySource',
  })

  const isLoading = tab === 'all' ? allLoading : tab === 'byAgreement' ? byAgreementLoading : bySourceLoading

  // Get unique countries for filter
  const countries = React.useMemo(() => {
    if (tab !== 'all' || !allLocations) return []
    const locations = allLocations?.items ?? allLocations?.data ?? []
    const uniqueCountries = Array.from(new Set(locations.map((loc: any) => loc.country).filter(Boolean)))
    return uniqueCountries.sort()
  }, [allLocations, tab])

  // Filter locations
  const filteredAllLocations = React.useMemo(() => {
    if (tab !== 'all' || !allLocations) return []
    const locations = allLocations?.items ?? allLocations?.data ?? []
    return locations.filter((loc: any) => {
      const matchesSearch = !searchQuery || 
        loc.unlocode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.place?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        loc.iata_code?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesCountry = !countryFilter || loc.country === countryFilter
      
      return matchesSearch && matchesCountry
    })
  }, [allLocations, tab, searchQuery, countryFilter])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gray-100 rounded">
              <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Locations
              </h1>
              <p className="mt-1 text-sm text-gray-600">Manage supported locations and UN/LOCODE data</p>
            </div>
          </div>
          {tab === 'all' && (
            <Button
              variant="primary"
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Location
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gray-100 rounded">
              <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900">Location Management</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Browse and filter locations by different criteria</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="mb-6 space-y-4">
            {/* Tab Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Button 
                variant={tab === 'all' ? 'primary' : 'secondary'} 
                size="sm" 
                onClick={() => setTab('all')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                All LOCODE
              </Button>
              <Button 
                variant={tab === 'byAgreement' ? 'primary' : 'secondary'} 
                size="sm" 
                onClick={() => setTab('byAgreement')}
                className={tab === 'byAgreement' ? 'shadow-md' : ''}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                By Agreement
              </Button>
              <Button 
                variant={tab === 'bySource' ? 'primary' : 'secondary'} 
                size="sm" 
                onClick={() => setTab('bySource')}
                className={tab === 'bySource' ? 'shadow-md' : ''}
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                By Source
              </Button>
              {tab === 'byAgreement' && (
                <div className="w-72">
                  <Select
                    label="Agreement"
                    value={agreementId}
                    onChange={(e) => setAgreementId(e.target.value)}
                    options={[{ value: '', label: 'Select agreement' }].concat(
                      (agreements?.data ?? []).map((a) => ({ value: a.id, label: `${a.agreementRef} (${a.status})` }))
                    )}
                  />
                </div>
              )}
            </div>
            {tab === 'all' && (
              <>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      label="Search"
                      placeholder="Search by UN/LOCODE, name, or IATA code..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <div className="flex-1">
                    <Select
                      label="Filter by Country"
                      value={countryFilter}
                      onChange={(e) => setCountryFilter(e.target.value)}
                      options={[
                        { value: '', label: 'All Countries' },
                        ...countries.map((country) => ({ value: country, label: country })),
                      ]}
                    />
                  </div>
                </div>
                {(searchQuery || countryFilter) && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded">
                    <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="text-sm font-semibold text-blue-900">
                      Showing {filteredAllLocations.length} of {(allLocations?.items ?? allLocations?.data ?? []).length} locations
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {isLoading ? (
            <Loader className="min-h-48" />
          ) : (
            <>
              {tab === 'all' && (
                <div>
                  {filteredAllLocations.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
                      {(searchQuery || countryFilter) && (
                        <p className="text-sm text-gray-500 mb-4">
                          Try adjusting your filters or search query
                        </p>
                      )}
                      {(searchQuery || countryFilter) && (
                        <Button 
                          variant="secondary" 
                          size="sm"
                          onClick={() => {
                            setSearchQuery('')
                            setCountryFilter('')
                          }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">UN/LOCODE</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Country</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">IATA Code</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredAllLocations.map((loc: any, index: number) => (
                            <tr key={loc.unlocode} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">{loc.unlocode}</code>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{loc.place || loc.name || '—'}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge variant="info" size="sm">{loc.country}</Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                {loc.iata_code ? (
                                  <Badge variant="success" size="sm">{loc.iata_code}</Badge>
                                ) : (
                                  <span className="text-xs text-gray-400">—</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'byAgreement' && (
                <div>
                  {(byAgreementLocations?.inherited) && (
                    <div className="mb-4 p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-amber-900">Locations inherited from global coverage</span>
                      </div>
                    </div>
                  )}
                  {(byAgreementLocations?.items ?? []).length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
                      <p className="text-sm text-gray-500">This agreement has no specific locations assigned</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">UN/LOCODE</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(byAgreementLocations?.items ?? []).map((loc: any, index: number) => (
                            <tr key={loc.unlocode} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <code className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-mono font-semibold">{loc.unlocode}</code>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {tab === 'bySource' && (
                <div>
                  {(sourceCounts?.items ?? []).length === 0 ? (
                    <div className="text-center py-16">
                      <div className="mx-auto w-16 h-16 bg-gray-100 rounded flex items-center justify-center mb-4">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No source data available</h3>
                      <p className="text-sm text-gray-500">No location counts found for sources</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto rounded border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Source</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">Locations</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {(sourceCounts?.items ?? []).map((s: any, index: number) => (
                            <tr key={s.sourceId} className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm font-semibold text-gray-900">{s.companyName}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <Badge 
                                  variant={
                                    s.status === 'ACTIVE' ? 'success' : 
                                    s.status === 'PENDING_VERIFICATION' ? 'warning' : 
                                    'default'
                                  }
                                  size="sm"
                                >
                                  {s.status}
                                </Badge>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center gap-2">
                                  <div className="text-2xl font-semibold text-gray-900">
                                    {s.locations}
                                  </div>
                                  <span className="text-xs text-gray-500">locations</span>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <AddLocationModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Query invalidation is handled in the mutation's onSuccess
        }}
      />
    </div>
  )
}
