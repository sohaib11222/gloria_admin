import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, Search, X, RefreshCw } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { locationRequestsApi, LocationRequest } from '../api/locationRequests'
import { companiesApi } from '../api/companies'
import toast from 'react-hot-toast'
import { formatDate } from '../lib/utils'

export default function LocationRequests() {
  const [filters, setFilters] = useState({
    sourceId: '',
    status: '',
  })
  const [page, setPage] = useState(0)
  const [limit] = useState(25)
  const [selectedRequest, setSelectedRequest] = useState<LocationRequest | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')

  const queryClient = useQueryClient()

  // Fetch location requests
  const { data: requestsData, isLoading, error } = useQuery({
    queryKey: ['locationRequests', filters, page],
    queryFn: () =>
      locationRequestsApi.listRequests({
        ...filters,
        limit,
        offset: page * limit,
      }),
  })

  // Fetch sources for filter
  const { data: sourcesData } = useQuery({
    queryKey: ['sources'],
    queryFn: () => companiesApi.listCompanies(),
  })

  const sources = (sourcesData?.data ?? []).filter((c: any) => c.type === 'SOURCE')

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => locationRequestsApi.approveRequest(id, adminNotes || undefined),
    onSuccess: () => {
      toast.success('Location request approved')
      queryClient.invalidateQueries({ queryKey: ['locationRequests'] })
      setIsApproveModalOpen(false)
      setSelectedRequest(null)
      setAdminNotes('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve request')
    },
  })

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => locationRequestsApi.rejectRequest(id, adminNotes || undefined),
    onSuccess: () => {
      toast.success('Location request rejected')
      queryClient.invalidateQueries({ queryKey: ['locationRequests'] })
      setIsRejectModalOpen(false)
      setSelectedRequest(null)
      setAdminNotes('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to reject request')
    },
  })

  const handleApprove = () => {
    if (selectedRequest) {
      approveMutation.mutate(selectedRequest.id)
    }
  }

  const handleReject = () => {
    if (selectedRequest) {
      rejectMutation.mutate(selectedRequest.id)
    }
  }

  const clearFilters = () => {
    setFilters({
      sourceId: '',
      status: '',
    })
    setPage(0)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">Approved</Badge>
      case 'REJECTED':
        return <Badge variant="error">Rejected</Badge>
      case 'PENDING':
        return <Badge variant="warning">Pending</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const requests = requestsData?.items ?? []
  const totalRequests = requestsData?.total ?? 0
  const pendingCount = requests.filter((r: LocationRequest) => r.status === 'PENDING').length
  const approvedCount = requests.filter((r: LocationRequest) => r.status === 'APPROVED').length
  const rejectedCount = requests.filter((r: LocationRequest) => r.status === 'REJECTED').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
            <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Location Requests
            </h1>
            <p className="mt-2 text-gray-600 font-medium">Review and manage location requests from sources</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Requests</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-1">
                  {totalRequests}
                </p>
                <p className="text-xs text-gray-500">All location requests</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl shadow-lg">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-yellow-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Pending</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-amber-600 bg-clip-text text-transparent mb-1">
                  {pendingCount}
                </p>
                <p className="text-xs text-gray-500">Awaiting review</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-yellow-100 to-amber-100 rounded-2xl shadow-lg">
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-green-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Approved</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent mb-1">
                  {approvedCount}
                </p>
                <p className="text-xs text-gray-500">Successfully approved</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl shadow-lg">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-red-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Rejected</p>
                <p className="text-4xl font-bold bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent mb-1">
                  {rejectedCount}
                </p>
                <p className="text-xs text-gray-500">Rejected requests</p>
              </div>
              <div className="p-4 bg-gradient-to-br from-red-100 to-rose-100 rounded-2xl shadow-lg">
                <XCircle className="h-8 w-8 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-gray-50 via-slate-50 to-zinc-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Search className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Filters</CardTitle>
                <p className="text-sm text-gray-600 mt-1">Filter location requests by source and status</p>
              </div>
            </div>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="hover:bg-red-50 hover:text-red-600">
                <X className="w-4 h-4 mr-1" />
                Clear Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Select
                label="Source"
                value={filters.sourceId}
                onChange={(e) => {
                  setFilters({ ...filters, sourceId: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All sources' },
                  ...sources.map((s: any) => ({
                    value: s.id,
                    label: s.companyName,
                  })),
                ]}
              />
            </div>
            <div>
              <Select
                label="Status"
                value={filters.status}
                onChange={(e) => {
                  setFilters({ ...filters, status: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'PENDING', label: 'Pending' },
                  { value: 'APPROVED', label: 'Approved' },
                  { value: 'REJECTED', label: 'Rejected' },
                ]}
              />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm text-blue-800">
                <span className="font-semibold">Active filters:</span> Showing {requestsData?.items?.length ?? 0} of {requestsData?.total ?? 0} requests
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Location Requests</CardTitle>
                <p className="text-sm text-gray-600 mt-1">{totalRequests} total request{totalRequests !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['locationRequests'] })}
              className="shadow-md hover:shadow-lg"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : error ? (
            <ErrorDisplay error={error} title="Failed to load location requests" />
          ) : requests.length === 0 ? (
            <div className="text-center py-16">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-gray-100 rounded-full">
                  <svg className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-gray-500 text-lg font-semibold mb-2">No location requests found</div>
              {hasActiveFilters ? (
                <div className="text-sm text-gray-400 mb-4">
                  Try adjusting your filters to see more results
                </div>
              ) : (
                <div className="text-sm text-gray-400">
                  Location requests will appear here when sources submit them
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Location Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Requested
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {requests.map((request) => (
                      <tr 
                        key={request.id} 
                        className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-150 cursor-pointer"
                        onClick={() => {
                          setSelectedRequest(request)
                          setIsDetailModalOpen(true)
                        }}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-blue-100 rounded-lg">
                              <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </div>
                            <span className="text-sm font-semibold text-gray-900">{request.locationName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-700 font-medium">
                            {request.source?.companyName || <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">
                            {request.city && request.country
                              ? `${request.city}, ${request.country}`
                              : request.country || <span className="text-gray-400">—</span>}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-600">{formatDate(request.createdAt)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div 
                            className="flex items-center justify-end gap-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setIsDetailModalOpen(true)
                              }}
                              className="hover:bg-blue-100 hover:text-blue-700"
                            >
                              View
                            </Button>
                            {request.status === 'PENDING' && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setAdminNotes('')
                                    setIsApproveModalOpen(true)
                                  }}
                                  className="hover:bg-green-100 hover:text-green-700"
                                  title="Approve"
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedRequest(request)
                                    setAdminNotes('')
                                    setIsRejectModalOpen(true)
                                  }}
                                  className="hover:bg-red-100 hover:text-red-700"
                                  title="Reject"
                                >
                                  <XCircle className="w-4 h-4 text-red-600" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {requestsData && requestsData.total > limit && (
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-sm text-gray-600">
                    Showing <span className="font-semibold text-gray-900">{page * limit + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min((page + 1) * limit, requestsData.total)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{requestsData.total}</span> requests
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="shadow-sm hover:shadow-md"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!requestsData.hasMore}
                      className="shadow-sm hover:shadow-md"
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedRequest(null)
        }}
        title="Location Request Details"
      >
        {selectedRequest && (
          <div className="space-y-6">
            {/* Header with Status */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedRequest.locationName}</h3>
                  <p className="text-sm text-gray-500 mt-1">Location request details</p>
                </div>
              </div>
              {getStatusBadge(selectedRequest.status)}
            </div>

            {/* Main Information */}
            <div className="grid grid-cols-2 gap-6">
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Location Name</label>
                <div className="text-sm font-semibold text-gray-900">{selectedRequest.locationName}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Source</label>
                <div className="text-sm font-semibold text-gray-900">
                  {selectedRequest.source?.companyName || <span className="text-gray-400">—</span>}
                </div>
              </div>
              <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-100">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Country</label>
                <div className="text-sm font-semibold text-gray-900">{selectedRequest.country}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-100">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">City</label>
                <div className="text-sm font-semibold text-gray-900">{selectedRequest.city || <span className="text-gray-400">—</span>}</div>
              </div>
              <div className="p-4 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border border-teal-100">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">IATA Code</label>
                <div className="text-sm font-semibold text-gray-900">{selectedRequest.iataCode || <span className="text-gray-400">—</span>}</div>
              </div>
            </div>

            {/* Additional Information */}
            {selectedRequest.address && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Address</label>
                <div className="text-sm text-gray-900">{selectedRequest.address}</div>
              </div>
            )}
            {selectedRequest.reason && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Reason</label>
                <div className="text-sm text-gray-900">{selectedRequest.reason}</div>
              </div>
            )}
            {selectedRequest.adminNotes && (
              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2 block">Admin Notes</label>
                <div className="text-sm text-gray-900">{selectedRequest.adminNotes}</div>
              </div>
            )}

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span><span className="font-semibold">Requested:</span> {formatDate(selectedRequest.createdAt)}</span>
              </div>
              {selectedRequest.reviewedAt && (
                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                  <CheckCircle className="w-4 h-4" />
                  <span><span className="font-semibold">Reviewed:</span> {formatDate(selectedRequest.reviewedAt)}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal
        isOpen={isApproveModalOpen}
        onClose={() => {
          setIsApproveModalOpen(false)
          setSelectedRequest(null)
          setAdminNotes('')
        }}
        title="Approve Location Request"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 font-medium">
                Approve location request for <strong className="text-gray-900">{selectedRequest?.locationName}</strong>?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This will approve the location request and make it available for use.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes (Optional)</label>
            <textarea
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
            />
            <p className="text-xs text-gray-500 mt-1">These notes will be visible to the source company.</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setIsApproveModalOpen(false)
                setSelectedRequest(null)
                setAdminNotes('')
              }}
              className="shadow-sm hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={approveMutation.isPending}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Approve Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Reject Modal */}
      <Modal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false)
          setSelectedRequest(null)
          setAdminNotes('')
        }}
        title="Reject Location Request"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-lg border border-red-200">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 font-medium">
                Reject location request for <strong className="text-gray-900">{selectedRequest?.locationName}</strong>?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                This will reject the location request. The source will be notified of the rejection.
              </p>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Admin Notes (Optional)</label>
            <textarea
              className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              rows={4}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this rejection..."
            />
            <p className="text-xs text-gray-500 mt-1">These notes will be visible to the source company.</p>
          </div>
          
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRejectModalOpen(false)
                setSelectedRequest(null)
                setAdminNotes('')
              }}
              className="shadow-sm hover:shadow-md"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 shadow-md hover:shadow-lg"
            >
              <XCircle className="w-4 h-4 mr-2" />
              Reject Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

