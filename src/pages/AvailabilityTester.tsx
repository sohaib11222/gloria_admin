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
  Calendar
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AvailabilityForm>({
    resolver: zodResolver(AvailabilitySchema),
  })

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
    submitMutation.mutate(data)
  }

  const handleReset = () => {
    setRequestId(null)
    setOffers([])
    setIsPolling(false)
    setPollingStatus('')
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Availability Tester</h1>
        <p className="mt-2 text-gray-600">
          Test availability requests and view real-time results
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Request Form */}
        <Card>
          <CardHeader>
            <CardTitle>Availability Request</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Pickup Location (UN/LOCODE)"
                  placeholder="USNYC"
                  error={errors.pickup_unlocode?.message}
                  {...register('pickup_unlocode')}
                />
                <Input
                  label="Dropoff Location (UN/LOCODE)"
                  placeholder="USLAX"
                  error={errors.dropoff_unlocode?.message}
                  {...register('dropoff_unlocode')}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Pickup Date"
                  type="datetime-local"
                  error={errors.pickup_iso?.message}
                  {...register('pickup_iso')}
                />
                <Input
                  label="Dropoff Date"
                  type="datetime-local"
                  error={errors.dropoff_iso?.message}
                  {...register('dropoff_iso')}
                />
              </div>

              <div className="flex space-x-3">
                <Button
                  type="submit"
                  loading={submitMutation.isPending}
                  disabled={isPolling}
                  className="flex-1"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Availability
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleReset}
                  disabled={isPolling}
                >
                  Reset
                </Button>
              </div>
            </form>

            {/* Status */}
            {requestId && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">Request ID</p>
                    <code className="text-xs text-blue-700">{requestId}</code>
                  </div>
                  <CopyButton text={requestId} />
                </div>
                <div className="mt-2 flex items-center space-x-2">
                  {isPolling ? (
                    <Clock className="h-4 w-4 text-blue-600 animate-spin" />
                  ) : pollingStatus === 'COMPLETE' ? (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-blue-700">{pollingStatus}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle>Results ({offers.length} offers)</CardTitle>
          </CardHeader>
          <CardContent>
            {offers.length > 0 ? (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {offers.map((offer, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {offer.vehicle_make_model}
                        </h4>
                        <p className="text-sm text-gray-600">{offer.vehicle_class}</p>
                      </div>
                      <Badge 
                        variant={offer.availability_status === 'AVAILABLE' ? 'success' : 'warning'}
                        size="sm"
                      >
                        {offer.availability_status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">
                          {offer.pickup_location} → {offer.dropoff_location}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Car className="h-4 w-4 text-gray-400" />
                        <span className="text-gray-600">{offer.rate_plan_code}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-semibold text-gray-900">
                          {offer.currency} {offer.total_price.toFixed(2)}
                        </span>
                        <p className="text-xs text-gray-500">{offer.supplier_name}</p>
                      </div>
                      <CopyButton 
                        text={JSON.stringify(offer, null, 2)} 
                        label="Copy JSON"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No offers yet. Submit a request to see results.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
