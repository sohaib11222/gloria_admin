import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MapPin, Edit, Trash2, Filter, X, RefreshCw, Building2, TrendingUp, AlertCircle, Database, Eye } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
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
  const { data: branchesData, isLoading, error } = useQuery({
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
      {/* Page Header */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Building2 className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Branches</h1>
              <p className="mt-2 text-blue-100">Manage source branches and locations</p>
            </div>
          </div>
          <Button 
            variant="secondary" 
            onClick={() => setShowStats(!showStats)}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
          >
            {showStats ? 'Hide' : 'Show'} Stats
          </Button>
        </div>
      </div>

      {/* Stats Card */}
      {showStats && stats && (
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
          <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
                <TrendingUp className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Branch Statistics</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-700">Total Branches</div>
                  <Database className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-orange-700">Unmapped</div>
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div className="text-3xl font-bold text-orange-900">{stats.unmapped}</div>
              </div>
              <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-700">By Source</div>
                  <Building2 className="w-5 h-5 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-900">
                  {stats.bySource.length} source{stats.bySource.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200 transform transition-all duration-300 hover:scale-105 hover:shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-green-700">By Status</div>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-900">
                  {stats.byStatus.length} status{stats.byStatus.length !== 1 ? 'es' : ''}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg text-white">
                <Filter className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">Filters</CardTitle>
            </div>
            {hasActiveFilters && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearFilters}
                className="text-gray-600 hover:text-gray-900 hover:bg-white/50"
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
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
          {hasActiveFilters && (
            <div className="mt-2 text-sm text-gray-600">
              Showing {branchesData?.items?.length ?? 0} of {branchesData?.total ?? 0} branches
            </div>
          )}
        </CardContent>
      </Card>

      {/* Branches Table */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg text-white">
                <MapPin className="w-5 h-5" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Branches ({branchesData?.total ?? 0})
              </CardTitle>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
              className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
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
            <ErrorDisplay 
              error={error} 
              title="Failed to load branches"
              onDismiss={() => queryClient.invalidateQueries({ queryKey: ['branches'] })}
            />
          ) : (branchesData?.items ?? []).length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-medium mb-2">No branches found</div>
              {hasActiveFilters && (
                <div className="text-sm text-gray-400 mb-4">
                  Try adjusting your filters or search query
                </div>
              )}
              {hasActiveFilters && (
                <Button variant="secondary" onClick={clearFilters} size="sm">
                  <X className="w-4 h-4 mr-2" />
                  Clear Filters
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Branch Code
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Location
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        UN/LOCODE
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {(branchesData?.items ?? []).map((branch) => (
                      <tr key={branch.id} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-colors duration-150 cursor-pointer">
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
                              className="hover:bg-blue-50 hover:text-blue-700"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedBranch(branch)
                                setIsEditModalOpen(true)
                              }}
                              className="hover:bg-indigo-50 hover:text-indigo-700"
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
                              className="hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
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
                <div className="mt-6 pt-4 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-sm text-gray-600 font-medium">
                    Showing <span className="font-semibold text-gray-900">{page * limit + 1}</span> to{' '}
                    <span className="font-semibold text-gray-900">{Math.min((page + 1) * limit, branchesData.total)}</span> of{' '}
                    <span className="font-semibold text-gray-900">{branchesData.total}</span> branches
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(0, p - 1))}
                      disabled={page === 0}
                      className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={!branchesData.hasMore}
                      className="bg-white hover:bg-gray-50 border border-gray-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg text-white">
              <MapPin className="w-5 h-5" />
            </div>
            <span>Branch Details</span>
          </div>
        }
        size="lg"
      >
        {selectedBranch && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Branch Code</label>
                <div className="mt-2 text-sm font-mono font-semibold text-gray-900">{selectedBranch.branchCode}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Name</label>
                <div className="mt-2 text-sm font-medium text-gray-900">{selectedBranch.name}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Source</label>
                <div className="mt-2 text-sm text-gray-900">
                  {selectedBranch.source?.companyName || '—'}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</label>
                <div className="mt-2">
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
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">UN/LOCODE</label>
                <div className="mt-2">
                  {selectedBranch.natoLocode ? (
                    <Badge variant="info">{selectedBranch.natoLocode}</Badge>
                  ) : (
                    <Badge variant="warning">Unmapped</Badge>
                  )}
                </div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Location Type</label>
                <div className="mt-2 text-sm text-gray-900">{selectedBranch.locationType || '—'}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">City</label>
                <div className="mt-2 text-sm text-gray-900">{selectedBranch.city || '—'}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Country</label>
                <div className="mt-2 text-sm text-gray-900">{selectedBranch.country || '—'}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Address</label>
                <div className="mt-2 text-sm text-gray-900">{selectedBranch.addressLine || '—'}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</label>
                <div className="mt-2 text-sm text-gray-900">{selectedBranch.email || '—'}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phone</label>
                <div className="mt-2 text-sm text-gray-900">{selectedBranch.phone || '—'}</div>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 col-span-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Coordinates</label>
                <div className="mt-2 text-sm font-mono text-gray-900">
                  {selectedBranch.latitude && selectedBranch.longitude
                    ? `${selectedBranch.latitude}, ${selectedBranch.longitude}`
                    : '—'}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Created:</span>{' '}
                  <span className="font-medium text-gray-900">{formatDate(selectedBranch.createdAt)}</span>
                </div>
                <div>
                  <span className="text-gray-500">Updated:</span>{' '}
                  <span className="font-medium text-gray-900">{formatDate(selectedBranch.updatedAt)}</span>
                </div>
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
        title={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-lg text-white">
              <Trash2 className="w-5 h-5" />
            </div>
            <span>Delete Branch</span>
          </div>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-gray-700">
              Are you sure you want to delete branch <strong className="font-semibold text-gray-900">{selectedBranch?.branchCode}</strong>? 
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false)
                setSelectedBranch(null)
              }}
              className="bg-white hover:bg-gray-50 border border-gray-200"
            >
              Cancel
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDelete} 
              loading={deleteMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
            >
              Delete Branch
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

