import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MapPin, Edit, Trash2, Filter, X } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { BranchEditModal } from '../components/BranchEditModal'
import { branchesApi, Branch, BranchStats } from '../api/branches'
import { companiesApi } from '../api/companies'
import toast from 'react-hot-toast'
import { formatDate } from '../lib/utils'

export default function Branches() {
  const [filters, setFilters] = useState({
    sourceId: '',
    status: '',
    locationType: '',
    search: '',
  })
  const [page, setPage] = useState(0)
  const [limit] = useState(25)
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [showStats, setShowStats] = useState(true)

  const queryClient = useQueryClient()

  // Fetch branches
  const { data: branchesData, isLoading } = useQuery({
    queryKey: ['branches', filters, page],
    queryFn: () =>
      branchesApi.listBranches({
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

  // Fetch stats
  const { data: stats } = useQuery({
    queryKey: ['branchStats', filters.sourceId],
    queryFn: () => branchesApi.getBranchStats(filters.sourceId || undefined),
    enabled: showStats,
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => branchesApi.deleteBranch(id),
    onSuccess: () => {
      toast.success('Branch deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      queryClient.invalidateQueries({ queryKey: ['branchStats'] })
      setIsDeleteModalOpen(false)
      setSelectedBranch(null)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete branch')
    },
  })

  const handleDelete = () => {
    if (selectedBranch) {
      deleteMutation.mutate(selectedBranch.id)
    }
  }

  const clearFilters = () => {
    setFilters({
      sourceId: '',
      status: '',
      locationType: '',
      search: '',
    })
    setPage(0)
  }

  const hasActiveFilters = Object.values(filters).some((v) => v !== '')

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Branches</h1>
          <p className="mt-2 text-gray-600">Manage source branches and locations</p>
        </div>
        <Button variant="secondary" onClick={() => setShowStats(!showStats)}>
          {showStats ? 'Hide' : 'Show'} Stats
        </Button>
      </div>

      {/* Stats Card */}
      {showStats && stats && (
        <Card>
          <CardHeader>
            <CardTitle>Branch Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Total Branches</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">Unmapped</div>
                <div className="text-2xl font-bold text-orange-600 mt-1">{stats.unmapped}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">By Source</div>
                <div className="text-sm text-gray-700 mt-1">
                  {stats.bySource.length} source{stats.bySource.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-500">By Status</div>
                <div className="text-sm text-gray-700 mt-1">
                  {stats.byStatus.length} status{stats.byStatus.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                  { value: 'ACTIVE', label: 'Active' },
                  { value: 'INACTIVE', label: 'Inactive' },
                ]}
              />
            </div>
            <div>
              <Select
                label="Location Type"
                value={filters.locationType}
                onChange={(e) => {
                  setFilters({ ...filters, locationType: e.target.value })
                  setPage(0)
                }}
                options={[
                  { value: '', label: 'All types' },
                  { value: 'AIRPORT', label: 'Airport' },
                  { value: 'CITY', label: 'City' },
                  { value: 'RAILWAY', label: 'Railway' },
                ]}
              />
            </div>
            <div>
              <Input
                label="Search"
                placeholder="Branch code, name, city..."
                value={filters.search}
                onChange={(e) => {
                  setFilters({ ...filters, search: e.target.value })
                  setPage(0)
                }}
                icon={<Search className="w-4 h-4" />}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Branches ({branchesData?.total ?? 0})
          </CardTitle>
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
                        Branch Code
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
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
                        UN/LOCODE
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(branchesData?.items ?? []).map((branch) => (
                      <tr key={branch.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {branch.branchCode}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{branch.name}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {branch.source?.companyName || '—'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {branch.city && branch.country
                            ? `${branch.city}, ${branch.country}`
                            : '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge
                            variant={
                              branch.status === 'ACTIVE'
                                ? 'success'
                                : branch.status === 'INACTIVE'
                                ? 'error'
                                : 'secondary'
                            }
                          >
                            {branch.status || '—'}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {branch.natoLocode ? (
                            <Badge variant="info">{branch.natoLocode}</Badge>
                          ) : (
                            <Badge variant="warning">Unmapped</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsDetailModalOpen(true)
                              }}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsDeleteModalOpen(true)
                              }}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {branchesData && branchesData.total > limit && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Showing {page * limit + 1} to {Math.min((page + 1) * limit, branchesData.total)} of{' '}
                    {branchesData.total} branches
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
                      disabled={!branchesData.hasMore}
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

      {/* Branch Detail Modal */}
      <Modal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false)
          setSelectedBranch(null)
        }}
        title="Branch Details"
      >
        {selectedBranch && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Branch Code</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.branchCode}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Name</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.name}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Source</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedBranch.source?.companyName || '—'}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Status</label>
                <div className="mt-1">
                  <Badge
                    variant={
                      selectedBranch.status === 'ACTIVE'
                        ? 'success'
                        : selectedBranch.status === 'INACTIVE'
                        ? 'error'
                        : 'secondary'
                    }
                  >
                    {selectedBranch.status || '—'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">UN/LOCODE</label>
                <div className="mt-1">
                  {selectedBranch.natoLocode ? (
                    <Badge variant="info">{selectedBranch.natoLocode}</Badge>
                  ) : (
                    <Badge variant="warning">Unmapped</Badge>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Location Type</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.locationType || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">City</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.city || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Country</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.country || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Address</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.addressLine || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.email || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone</label>
                <div className="mt-1 text-sm text-gray-900">{selectedBranch.phone || '—'}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Coordinates</label>
                <div className="mt-1 text-sm text-gray-900">
                  {selectedBranch.latitude && selectedBranch.longitude
                    ? `${selectedBranch.latitude}, ${selectedBranch.longitude}`
                    : '—'}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t">
              <div className="text-sm text-gray-500">
                Created: {formatDate(selectedBranch.createdAt)}
              </div>
              <div className="text-sm text-gray-500">
                Updated: {formatDate(selectedBranch.updatedAt)}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <BranchEditModal
        branch={selectedBranch}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedBranch(null)
        }}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false)
          setSelectedBranch(null)
        }}
        title="Delete Branch"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete branch <strong>{selectedBranch?.branchCode}</strong>? This
            action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedBranch(null)
              }}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} loading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

