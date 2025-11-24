import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, Clock, Search, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
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
  const { data: requestsData, isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Location Requests</h1>
        <p className="mt-2 text-gray-600">Review and manage location requests from sources</p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Filters</CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Requests ({requestsData?.total ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Loader className="min-h-48" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Requested
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(requestsData?.items ?? []).map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {request.locationName}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {request.source?.companyName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {request.city && request.country
                            ? `${request.city}, ${request.country}`
                            : request.country || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(request.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request)
                                setIsDetailModalOpen(true)
                              }}
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
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, requestsData.total)} of{' '}
                    {requestsData.total} requests
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!requestsData.hasMore}
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
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Location Name</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.locationName}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedRequest.source?.companyName || '—'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.country}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.city || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">IATA Code</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.iataCode || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">{getStatusBadge(selectedRequest.status)}</div>
              </div>
            </div>
            {selectedRequest.address && (
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.address}</div>
              </div>
            )}
            {selectedRequest.reason && (
              <div>
                <label className="text-sm font-medium text-gray-500">Reason</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.reason}</div>
              </div>
            )}
            {selectedRequest.adminNotes && (
              <div>
                <label className="text-sm font-medium text-gray-500">Admin Notes</label>
                <div className="mt-1 text-sm text-gray-900">{selectedRequest.adminNotes}</div>
              </div>
            )}
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500">
                Requested: {formatDate(selectedRequest.createdAt)}
              </div>
              {selectedRequest.reviewedAt && (
                <div className="text-sm text-gray-500">
                  Reviewed: {formatDate(selectedRequest.reviewedAt)}
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
        <div className="space-y-4">
          <p className="text-gray-600">
            Approve location request for <strong>{selectedRequest?.locationName}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this approval..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsApproveModalOpen(false)
                setSelectedRequest(null)
                setAdminNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleApprove}
              loading={approveMutation.isPending}
            >
              Approve
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
        <div className="space-y-4">
          <p className="text-gray-600">
            Reject location request for <strong>{selectedRequest?.locationName}</strong>?
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (Optional)</label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any notes about this rejection..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsRejectModalOpen(false)
                setSelectedRequest(null)
                setAdminNotes('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={rejectMutation.isPending}
            >
              Reject
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

