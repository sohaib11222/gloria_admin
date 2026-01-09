import React, { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { 
  Search, 
  Copy, 
  Clock, 
  CheckCircle, 
  XCircle,
  Car,
  MapPin,
  Calendar,
  Building2,
  RefreshCw,
  TrendingUp,
  DollarSign,
  Package
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Badge } from '../components/ui/Badge'
import { Copy as CopyButton } from '../components/ui/Copy'
import { availabilityApi } from '../api/availability'
import { AvailabilitySchema, type AvailabilityForm } from '../lib/validators'
import { formatDate } from '../lib/utils'
import { unlocodesApi, type UNLocode } from '../api/unlocodes'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'

interface AvailabilityOffer {
  supplier_offer_ref: string
  source_id: string
  agreement_ref: string
  pickup_location: string
  dropoff_location: string
  vehicle_class: string
  vehicle_make_model: string
  rate_plan_code: string
  total_price: number
  currency: string
  availability_status: string
  supplier_name: string
}

export default function AvailabilityTester() {
  const [requestId, setRequestId] = useState<string | null>(null)
  const [offers, setOffers] = useState<AvailabilityOffer[]>([])
  const [isPolling, setIsPolling] = useState(false)
  const [pollingStatus, setPollingStatus] = useState<string>('')
  const [locationSearch, setLocationSearch] = useState({ pickup: '', dropoff: '' })

  // Fetch all UN/LOCODEs for dropdown
  const { data: locationsData, isLoading: isLoadingLocations } = useQuery({
    queryKey: ['unlocodes', 'all'],
    queryFn: async () => {
      // Fetch all locations with a high limit
      const result = await unlocodesApi.list({ limit: 1000 })
      return result.items
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(AvailabilitySchema),
  })

  const pickupUnlocode = watch('pickup_unlocode')
  const dropoffUnlocode = watch('dropoff_unlocode')

  // Filter locations based on search
  const filteredPickupLocations = locationsData?.filter((loc) => {
    if (!locationSearch.pickup) return true
    const search = locationSearch.pickup.toLowerCase()
    return (
      loc.unlocode.toLowerCase().includes(search) ||
      loc.place.toLowerCase().includes(search) ||
      loc.country.toLowerCase().includes(search) ||
      (loc.iataCode && loc.iataCode.toLowerCase().includes(search))
    )
  }) || []

  const filteredDropoffLocations = locationsData?.filter((loc) => {
    if (!locationSearch.dropoff) return true
    const search = locationSearch.dropoff.toLowerCase()
    return (
      loc.unlocode.toLowerCase().includes(search) ||
      loc.place.toLowerCase().includes(search) ||
      loc.country.toLowerCase().includes(search) ||
      (loc.iataCode && loc.iataCode.toLowerCase().includes(search))
    )
  }) || []

  // Create options for Select components
  const pickupOptions = [
    { value: '', label: '-- Select Pickup Location --' },
    ...filteredPickupLocations.map((loc) => ({
      value: loc.unlocode,
      label: `${loc.unlocode} - ${loc.place}, ${loc.country}${loc.iataCode ? ` (${loc.iataCode})` : ''}`,
    })),
  ]

  const dropoffOptions = [
    { value: '', label: '-- Select Dropoff Location --' },
    ...filteredDropoffLocations.map((loc) => ({
      value: loc.unlocode,
      label: `${loc.unlocode} - ${loc.place}, ${loc.country}${loc.iataCode ? ` (${loc.iataCode})` : ''}`,
    })),
  ]

  const submitMutation = useMutation({
    mutationFn: availabilityApi.submit,
    onSuccess: (data) => {
      setRequestId(data.request_id)
      setOffers([])
      setIsPolling(true)
      setPollingStatus('Starting availability search...')
      toast.success('Availability request submitted')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit availability request')
    },
  })

  const pollMutation = useMutation({
    mutationFn: (params: { requestId: string; sinceSeq?: number; waitMs?: number }) =>
      availabilityApi.poll(params),
    onSuccess: (data) => {
      if (data.offers && data.offers.length > 0) {
        setOffers(prev => [...prev, ...data.offers])
      }
      
      setPollingStatus(data.status)
      
      if (data.complete) {
        setIsPolling(false)
        toast.success('Availability search completed')
      }
    },
    onError: (error: any) => {
      setIsPolling(false)
      setPollingStatus('Error')
      toast.error('Polling failed')
    },
  })

  // Polling effect
  useEffect(() => {
    if (!isPolling || !requestId) return

    const poll = async () => {
      try {
        await pollMutation.mutateAsync({
          requestId,
          sinceSeq: offers.length,
          waitMs: 1500,
        })
      } catch (error) {
        // Error handled in mutation
      }
    }

    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
  }, [isPolling, requestId, offers.length])

  // Timeout after 120 seconds
  useEffect(() => {
    if (!isPolling) return

    const timeout = setTimeout(() => {
      setIsPolling(false)
      setPollingStatus('Timeout')
      toast.error('Availability search timed out after 120 seconds')
    }, 120000)

    return () => clearTimeout(timeout)
  }, [isPolling])

  const onSubmit = (data: AvailabilityForm) => {
    // Convert datetime-local format to ISO-8601 format
    const payload = {
      ...data,
      pickup_iso: new Date(data.pickup_iso).toISOString(),
      dropoff_iso: new Date(data.dropoff_iso).toISOString(),
      driver_age: 30, // Default driver age
      residency_country: 'US', // Default residency
      vehicle_classes: [], // Empty by default
    }
    submitMutation.mutate(payload)
  }

  const handleReset = () => {
    setRequestId(null)
    setOffers([])
    setIsPolling(false)
    setPollingStatus('')
    setLocationSearch({ pickup: '', dropoff: '' })
    reset()
  }

  const vehicleClassOptions = [
    { value: 'ECONOMY', label: 'Economy' },
    { value: 'COMPACT', label: 'Compact' },
    { value: 'INTERMEDIATE', label: 'Intermediate' },
    { value: 'STANDARD', label: 'Standard' },
    { value: 'FULL_SIZE', label: 'Full Size' },
    { value: 'PREMIUM', label: 'Premium' },
    { value: 'LUXURY', label: 'Luxury' },
    { value: 'MINIVAN', label: 'Minivan' },
    { value: 'SUV', label: 'SUV' },
    { value: 'CONVERTIBLE', label: 'Convertible' },
  ]

  const stats = {
    total: offers.length,
    available: offers.filter(o => o.availability_status === 'AVAILABLE').length,
    unavailable: offers.filter(o => o.availability_status !== 'AVAILABLE').length,
    avgPrice: offers.length > 0 
      ? offers.reduce((sum, o) => sum + o.total_price, 0) / offers.length 
      : 0,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
            <Search className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Availability Tester
            </h1>
            <p className="mt-2 text-gray-600 font-medium">
              Test availability requests and view real-time results from all sources
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {offers.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="transform transition-all duration-300 hover:shadow-lg border-2 border-blue-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Offers</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {stats.total}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-xl">
                  <Package className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-300 hover:shadow-lg border-2 border-green-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Available</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.available}
                  </p>
                </div>
                <div className="p-3 bg-green-100 rounded-xl">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-300 hover:shadow-lg border-2 border-yellow-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Unavailable</p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent">
                    {stats.unavailable}
                  </p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-xl">
                  <XCircle className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="transform transition-all duration-300 hover:shadow-lg border-2 border-purple-100">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Avg Price</p>
                  <p className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {stats.avgPrice > 0 ? `$${stats.avgPrice.toFixed(2)}` : '—'}
                  </p>
                </div>
                <div className="p-3 bg-purple-100 rounded-xl">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Search className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Availability Request</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Search for available vehicles across all sources</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    Pickup Location (UN/LOCODE)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch.pickup}
                      onChange={(e) => setLocationSearch({ ...locationSearch, pickup: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm hover:border-gray-400 mb-2"
                    />
                  </div>
                  <Select
                    options={pickupOptions}
                    error={errors.pickup_unlocode?.message}
                    value={pickupUnlocode || ''}
                    onChange={(e) => {
                      setValue('pickup_unlocode', e.target.value)
                      if (e.target.value) {
                        setLocationSearch({ ...locationSearch, pickup: '' })
                      }
                    }}
                    disabled={isLoadingLocations}
                  />
                  {isLoadingLocations && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      Loading locations...
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-purple-600" />
                    Dropoff Location (UN/LOCODE)
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search locations..."
                      value={locationSearch.dropoff}
                      onChange={(e) => setLocationSearch({ ...locationSearch, dropoff: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2 border-2 border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 sm:text-sm hover:border-gray-400 mb-2"
                    />
                  </div>
                  <Select
                    options={dropoffOptions}
                    error={errors.dropoff_unlocode?.message}
                    value={dropoffUnlocode || ''}
                    onChange={(e) => {
                      setValue('dropoff_unlocode', e.target.value)
                      if (e.target.value) {
                        setLocationSearch({ ...locationSearch, dropoff: '' })
                      }
                    }}
                    disabled={isLoadingLocations}
                  />
                  {isLoadingLocations && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3 animate-spin" />
                      Loading locations...
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-green-600" />
                    Pickup Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    error={errors.pickup_iso?.message}
                    {...register('pickup_iso')}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-red-600" />
                    Dropoff Date & Time
                  </label>
                  <Input
                    type="datetime-local"
                    error={errors.dropoff_iso?.message}
                    {...register('dropoff_iso')}
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <Button
                  type="submit"
                  loading={submitMutation.isPending}
                  disabled={isPolling}
                  className="flex-1 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Availability
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isPolling}
                  className="shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </form>

            {/* Status */}
            {requestId && (
              <div className="mt-6 p-5 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">Request ID</p>
                      <code className="text-xs text-blue-700 font-mono font-semibold">{requestId}</code>
                    </div>
                  </div>
                  <CopyButton text={requestId} />
                </div>
                <div className="flex items-center space-x-3 bg-white rounded-lg p-3 border border-blue-100">
                  {isPolling ? (
                    <>
                      <Clock className="h-5 w-5 text-blue-600 animate-spin" />
                      <div>
                        <span className="text-sm font-semibold text-blue-700">{pollingStatus}</span>
                        <p className="text-xs text-blue-600">Searching for availability...</p>
                      </div>
                    </>
                  ) : pollingStatus === 'COMPLETE' ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <span className="text-sm font-semibold text-green-700">Complete</span>
                        <p className="text-xs text-green-600">Search finished successfully</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <span className="text-sm font-semibold text-red-700">{pollingStatus}</span>
                        <p className="text-xs text-red-600">Search encountered an issue</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white rounded-lg shadow-sm">
                  <Package className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-xl font-bold text-gray-900">
                    Results
                    {offers.length > 0 && (
                      <Badge variant="info" className="ml-2 font-semibold">
                        {offers.length} {offers.length === 1 ? 'offer' : 'offers'}
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Real-time availability offers from sources</p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            {offers.length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {offers.map((offer, index) => (
                  <div 
                    key={index} 
                    className="p-5 border-2 border-gray-200 rounded-xl bg-gradient-to-br from-white to-gray-50/50 hover:shadow-lg hover:border-blue-300 transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          offer.availability_status === 'AVAILABLE' 
                            ? 'bg-green-100' 
                            : 'bg-yellow-100'
                        }`}>
                          <Car className={`w-5 h-5 ${
                            offer.availability_status === 'AVAILABLE' 
                              ? 'text-green-600' 
                              : 'text-yellow-600'
                          }`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg">
                            {offer.vehicle_make_model || 'Unknown Vehicle'}
                          </h4>
                          <p className="text-sm text-gray-600 font-medium mt-1">{offer.vehicle_class}</p>
                          <p className="text-xs text-gray-500 mt-1">{offer.supplier_name}</p>
                        </div>
                      </div>
                      <Badge 
                        variant={offer.availability_status === 'AVAILABLE' ? 'success' : 'warning'}
                        size="md"
                        className="font-bold"
                      >
                        {offer.availability_status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center space-x-2 p-2 bg-blue-50 rounded-lg">
                        <MapPin className="h-4 w-4 text-blue-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Route</p>
                          <p className="text-sm text-gray-700 font-medium truncate">
                            {offer.pickup_location} → {offer.dropoff_location}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 p-2 bg-purple-50 rounded-lg">
                        <TrendingUp className="h-4 w-4 text-purple-600 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 font-semibold uppercase">Rate Plan</p>
                          <p className="text-sm text-gray-700 font-medium truncate">{offer.rate_plan_code || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                      <div>
                        <p className="text-xs text-gray-500 font-semibold uppercase mb-1">Total Price</p>
                        <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                          {offer.currency} {offer.total_price.toFixed(2)}
                        </span>
                        {offer.supplier_offer_ref && (
                          <p className="text-xs text-gray-500 mt-1 font-mono">
                            Ref: {offer.supplier_offer_ref}
                          </p>
                        )}
                      </div>
                      <CopyButton 
                        text={JSON.stringify(offer, null, 2)} 
                        label="Copy JSON"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : requestId ? (
              <div className="text-center py-16">
                <div className="p-4 bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-semibold mb-2">No offers found</p>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  The request completed but no availability offers were returned. Try adjusting your search criteria.
                </p>
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Search className="h-10 w-10 text-blue-600" />
                </div>
                <p className="text-gray-500 text-lg font-semibold mb-2">No offers yet</p>
                <p className="text-sm text-gray-400 max-w-md mx-auto">
                  Submit an availability request using the form to see real-time results from all connected sources.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
