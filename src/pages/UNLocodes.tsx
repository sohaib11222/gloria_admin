import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit, Trash2, Upload, MapPin, X, AlertCircle, RefreshCw, Globe, Building2, Navigation, ChevronLeft, ChevronRight, Database } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
import { ErrorDisplay } from '../components/ui/ErrorDisplay'
import { unlocodesApi, UNLocode, CreateUNLocodeRequest, UpdateUNLocodeRequest } from '../api/unlocodes'
import toast from 'react-hot-toast'

export default function UNLocodes() {
  const [filters, setFilters] = useState({
    query: '',
    country: '',
  })
  const [page, setPage] = useState(0)
  const [limit] = useState(25)
  const [selectedLocode, setSelectedLocode] = useState<UNLocode | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [importCsv, setImportCsv] = useState('')

  const queryClient = useQueryClient()

  // Fetch UN/LOCODEs
  const { data: unlocodesData, isLoading, error } = useQuery({
    queryKey: ['unlocodes', filters, page],
    queryFn: () =>
      unlocodesApi.list({
        ...filters,
        limit,
        offset: page * limit,
      }),
  })

  // Fetch detail for selected UN/LOCODE
  const { data: locodeDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['unlocode', selectedLocode?.unlocode],
    queryFn: () => unlocodesApi.get(selectedLocode!.unlocode),
    enabled: !!selectedLocode && isDetailModalOpen,
  })

  // Create mutation
  const createMutation = useMutation({
    mutationFn: (data: CreateUNLocodeRequest) => unlocodesApi.create(data),
    onSuccess: () => {
      toast.success('UN/LOCODE created successfully')
      queryClient.invalidateQueries({ queryKey: ['unlocodes'] })
      setIsCreateModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create UN/LOCODE')
    },
  })

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ unlocode, data }: { unlocode: string; data: UpdateUNLocodeRequest }) =>
      unlocodesApi.update(unlocode, data),
    onSuccess: () => {
      toast.success('UN/LOCODE updated successfully')
      queryClient.invalidateQueries({ queryKey: ['unlocodes'] })
      queryClient.invalidateQueries({ queryKey: ['unlocode', selectedLocode?.unlocode] })
      setIsEditModalOpen(false)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update UN/LOCODE')
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (unlocode: string) => unlocodesApi.delete(unlocode),
    onSuccess: () => {
      toast.success('UN/LOCODE deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['unlocodes'] })
      setIsDeleteModalOpen(false)
      setSelectedLocode(null)
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Failed to delete UN/LOCODE'
      toast.error(message)
      if (error.response?.data?.usage) {
        toast.error(
          `In use by ${error.response.data.usage.sources} source(s) and ${error.response.data.usage.agreements} agreement(s)`,
          { duration: 5000 }
        )
      }
    },
  })

  // Import mutation
  const importMutation = useMutation({
    mutationFn: (csv: string) => unlocodesApi.import({ csv }),
    onSuccess: (data) => {
      toast.success(`Import completed: ${data.imported} imported, ${data.updated} updated`)
      if (data.errors && data.errors.length > 0) {
        toast.error(`${data.errors.length} errors occurred`, { duration: 5000 })
        console.error('Import errors:', data.errors)
      }
      queryClient.invalidateQueries({ queryKey: ['unlocodes'] })
      setIsImportModalOpen(false)
      setImportCsv('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to import UN/LOCODEs')
    },
  })

  const handleDelete = () => {
    if (selectedLocode) {
      deleteMutation.mutate(selectedLocode.unlocode)
    }
  }

  const handleImport = () => {
    if (!importCsv.trim()) {
      toast.error('Please enter CSV data')
      return
    }
    importMutation.mutate(importCsv)
  }

  const unlocodes = unlocodesData?.items || []
  const total = unlocodesData?.total || 0
  const hasMore = unlocodesData?.hasMore || false

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl shadow-sm">
              <Database className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                UN/LOCODE Management
              </h1>
              <p className="mt-2 text-gray-600 font-medium">
                Manage United Nations Location Codes (UN/LOCODEs) used for location standardization
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Upload className="w-4 h-4" />
              Import CSV
            </Button>
            <Button
              variant="primary"
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center gap-2 shadow-md hover:shadow-lg transition-shadow"
            >
              <Plus className="w-4 h-4" />
              Add UN/LOCODE
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Search className="w-5 h-5 text-blue-600" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900">Filter & Search</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by code, place, country, or IATA..."
                  value={filters.query}
                  onChange={(e) => {
                    setFilters({ ...filters, query: e.target.value })
                    setPage(0)
                  }}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Country Code</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="e.g., GB, US"
                  value={filters.country}
                  onChange={(e) => {
                    setFilters({ ...filters, country: e.target.value.toUpperCase() })
                    setPage(0)
                  }}
                  maxLength={2}
                  className="pl-10 font-mono"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={() => {
                  setFilters({ query: '', country: '' })
                  setPage(0)
                }}
                className="w-full"
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Total UN/LOCODEs</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {total.toLocaleString()}
                </div>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Showing</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {unlocodes.length}
                </div>
                <div className="text-sm text-gray-500 mt-1">of {total.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                <MapPin className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Page</div>
                <div className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                  {page + 1}
                </div>
                <div className="text-sm text-gray-500 mt-1">of {Math.ceil(total / limit)}</div>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl">
                <Navigation className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="transform transition-all duration-300 hover:shadow-xl border-2 border-gray-100">
        <CardHeader className="bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Database className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">UN/LOCODEs</CardTitle>
                <p className="text-sm text-gray-600 mt-1">
                  {total > 0 ? `${total.toLocaleString()} location${total !== 1 ? 's' : ''} in database` : 'No locations found'}
                </p>
              </div>
            </div>
            <Button 
              variant="secondary" 
              onClick={() => queryClient.invalidateQueries({ queryKey: ['unlocodes'] })}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader />
            </div>
          ) : error ? (
            <ErrorDisplay error={error} title="Failed to load UN/LOCODEs" />
          ) : unlocodes.length === 0 ? (
            <div className="text-center py-16">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                <Database className="w-8 h-8 text-gray-400" />
              </div>
              <div className="text-gray-500 text-lg font-semibold mb-2">No UN/LOCODEs found</div>
              {(filters.query || filters.country) ? (
                <div className="text-sm text-gray-400 mb-4">
                  Try adjusting your filters or search query
                </div>
              ) : (
                <div className="text-sm text-gray-400 mb-4">
                  Get started by adding your first UN/LOCODE or importing from CSV
                </div>
              )}
              <Button
                variant="primary"
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-4"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add UN/LOCODE
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200 bg-gray-50">
                      <th className="text-left p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">UN/LOCODE</th>
                      <th className="text-left p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">Place</th>
                      <th className="text-left p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">Country</th>
                      <th className="text-left p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">IATA</th>
                      <th className="text-left p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">Coordinates</th>
                      <th className="text-left p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">Usage</th>
                      <th className="text-right p-4 font-semibold text-gray-700 uppercase text-xs tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlocodes.map((locode, index) => (
                      <tr 
                        key={locode.unlocode} 
                        className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-colors group"
                      >
                        <td className="p-4">
                          <code className="text-sm font-mono font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                            {locode.unlocode}
                          </code>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-gray-400" />
                            <span className="font-medium text-gray-900">{locode.place}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant="info" className="font-semibold">{locode.country}</Badge>
                        </td>
                        <td className="p-4">
                          {locode.iataCode ? (
                            <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded text-gray-700">
                              {locode.iataCode}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-gray-600">
                          {locode.latitude && locode.longitude ? (
                            <div className="flex items-center gap-1">
                              <Navigation className="w-3.5 h-3.5 text-gray-400" />
                              <span className="font-mono">
                                {locode.latitude.toFixed(4)}, {locode.longitude.toFixed(4)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="p-4">
                          {locode.usageCount !== undefined && locode.usageCount > 0 ? (
                            <Badge variant="success" className="font-semibold">
                              {locode.usageCount}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 text-sm">0</span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocode(locode)
                                setIsDetailModalOpen(true)
                              }}
                              className="hover:bg-blue-50 hover:text-blue-600 transition-colors"
                            >
                              <MapPin className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocode(locode)
                                setIsEditModalOpen(true)
                              }}
                              className="hover:bg-emerald-50 hover:text-emerald-600 transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocode(locode)
                                setIsDeleteModalOpen(true)
                              }}
                              className="text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold text-gray-900">{page * limit + 1}</span> to{' '}
                  <span className="font-semibold text-gray-900">{Math.min((page + 1) * limit, total)}</span> of{' '}
                  <span className="font-semibold text-gray-900">{total.toLocaleString()}</span> UN/LOCODEs
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <div className="px-3 py-1 text-sm text-gray-600 bg-gray-50 rounded-lg">
                    Page {page + 1} of {Math.ceil(total / limit)}
                  </div>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                    className="flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateUNLocodeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={(data) => createMutation.mutate(data)}
        isLoading={createMutation.isPending}
      />

      {/* Edit Modal */}
      {selectedLocode && (
        <EditUNLocodeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          locode={selectedLocode}
          onUpdate={(data) => updateMutation.mutate({ unlocode: selectedLocode.unlocode, data })}
          isLoading={updateMutation.isPending}
        />
      )}

      {/* Delete Modal */}
      <DeleteUNLocodeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        locode={selectedLocode}
        onDelete={handleDelete}
        isLoading={deleteMutation.isPending}
      />

      {/* Import Modal */}
      <ImportUNLocodeModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false)
          setImportCsv('')
        }}
        csv={importCsv}
        onCsvChange={setImportCsv}
        onImport={handleImport}
        isLoading={importMutation.isPending}
        errors={importMutation.data?.errors}
      />

      {/* Detail Modal */}
      {selectedLocode && (
        <UNLocodeDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false)
            setSelectedLocode(null)
          }}
          locode={selectedLocode}
          detail={locodeDetail}
          isLoading={detailLoading}
        />
      )}
    </div>
  )
}

// Create Modal Component
function CreateUNLocodeModal({
  isOpen,
  onClose,
  onCreate,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onCreate: (data: CreateUNLocodeRequest) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<CreateUNLocodeRequest>({
    unlocode: '',
    country: '',
    place: '',
    iataCode: '',
    latitude: null,
    longitude: null,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCreate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add UN/LOCODE">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">UN/LOCODE *</label>
          <Input
            value={formData.unlocode}
            onChange={(e) => setFormData({ ...formData, unlocode: e.target.value.toUpperCase() })}
            placeholder="e.g., GBMAN"
            required
            maxLength={10}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              placeholder="e.g., GB"
              required
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place Name *</label>
            <Input
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              placeholder="e.g., Manchester"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IATA Code</label>
          <Input
            value={formData.iataCode || ''}
            onChange={(e) => setFormData({ ...formData, iataCode: e.target.value.toUpperCase() || null })}
            placeholder="e.g., MAN"
            maxLength={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              type="number"
              step="any"
              value={formData.latitude || ''}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })
              }
              placeholder="e.g., 53.3656"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              type="number"
              step="any"
              value={formData.longitude || ''}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })
              }
              placeholder="e.g., -2.2729"
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Create
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Edit Modal Component
function EditUNLocodeModal({
  isOpen,
  onClose,
  locode,
  onUpdate,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  locode: UNLocode
  onUpdate: (data: UpdateUNLocodeRequest) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState<UpdateUNLocodeRequest>({
    country: locode.country,
    place: locode.place,
    iataCode: locode.iataCode || null,
    latitude: locode.latitude || null,
    longitude: locode.longitude || null,
  })

  React.useEffect(() => {
    setFormData({
      country: locode.country,
      place: locode.place,
      iataCode: locode.iataCode || null,
      latitude: locode.latitude || null,
      longitude: locode.longitude || null,
    })
  }, [locode])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onUpdate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Edit UN/LOCODE: ${locode.unlocode}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600">UN/LOCODE</div>
          <div className="text-lg font-mono font-semibold">{locode.unlocode}</div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country Code *</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value.toUpperCase() })}
              required
              maxLength={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Place Name *</label>
            <Input
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">IATA Code</label>
          <Input
            value={formData.iataCode || ''}
            onChange={(e) => setFormData({ ...formData, iataCode: e.target.value.toUpperCase() || null })}
            maxLength={3}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
            <Input
              type="number"
              step="any"
              value={formData.latitude || ''}
              onChange={(e) =>
                setFormData({ ...formData, latitude: e.target.value ? parseFloat(e.target.value) : null })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
            <Input
              type="number"
              step="any"
              value={formData.longitude || ''}
              onChange={(e) =>
                setFormData({ ...formData, longitude: e.target.value ? parseFloat(e.target.value) : null })
              }
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            Update
          </Button>
        </div>
      </form>
    </Modal>
  )
}

// Delete Modal Component
function DeleteUNLocodeModal({
  isOpen,
  onClose,
  locode,
  onDelete,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  locode: UNLocode | null
  onDelete: () => void
  isLoading: boolean
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete UN/LOCODE">
      <div className="space-y-4">
        <p className="text-gray-600">
          Are you sure you want to delete <strong>{locode?.unlocode}</strong> ({locode?.place})?
        </p>
        {locode?.usageCount && locode.usageCount > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div className="text-sm text-yellow-800">
              This UN/LOCODE is in use by {locode.usageCount} source(s) or agreement(s). Deleting it may cause issues.
            </div>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onDelete} loading={isLoading}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Import Modal Component
function ImportUNLocodeModal({
  isOpen,
  onClose,
  csv,
  onCsvChange,
  onImport,
  isLoading,
  errors,
}: {
  isOpen: boolean
  onClose: () => void
  csv: string
  onCsvChange: (csv: string) => void
  onImport: () => void
  isLoading: boolean
  errors?: string[]
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import UN/LOCODEs from CSV" size="xl">
      <div className="space-y-6">
        {/* Format Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-blue-900 mb-3">CSV Format Requirements</h3>
          <div className="space-y-3">
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">Required Fields:</p>
              <code className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">unlocode,country,place</code>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800 mb-1">Optional Fields:</p>
              <code className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded">iataCode,latitude,longitude</code>
            </div>
            <div>
              <p className="text-xs font-medium text-blue-800 mb-2">Full Format:</p>
              <code className="text-xs text-blue-700 bg-blue-100 px-2 py-1 rounded block">
                unlocode,country,place,iataCode,latitude,longitude
              </code>
            </div>
          </div>
        </div>

        {/* Sample CSV */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Sample CSV Data</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
            <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap">
{`GBMAN,GB,Manchester,MAN,53.3656,-2.2729
GBGLA,GB,Glasgow,GLA,55.8642,-4.4331
USNYC,US,New York,JFK,40.7128,-74.0060
FRPAR,FR,Paris,CDG,48.8566,2.3522
DEMUN,DE,Munich,MUC,48.1351,11.5820`}
            </pre>
          </div>
          <p className="text-xs text-gray-500 mb-1">
            <strong>Note:</strong> Each line represents one UN/LOCODE entry. Optional fields (iataCode, latitude, longitude) can be left empty.
          </p>
        </div>

        {/* JSON Sample */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Example: How CSV is converted to JSON</label>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-2 font-medium">CSV Line:</p>
            <code className="text-xs font-mono text-gray-700 block mb-3 bg-white px-2 py-1 rounded border">
              GBMAN,GB,Manchester,MAN,53.3656,-2.2729
            </code>
            <p className="text-xs text-gray-600 mb-2 font-medium">Becomes:</p>
            <pre className="text-xs font-mono text-gray-700 bg-white p-2 rounded border overflow-x-auto">
{`{
  "unlocode": "GBMAN",
  "country": "GB",
  "place": "Manchester",
  "iataCode": "MAN",
  "latitude": 53.3656,
  "longitude": -2.2729
}`}
            </pre>
          </div>
        </div>

        {/* CSV Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your CSV Data</label>
          <textarea
            className="w-full h-48 p-3 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={csv}
            onChange={(e) => onCsvChange(e.target.value)}
            placeholder="Paste your CSV data here...&#10;&#10;Example:&#10;GBMAN,GB,Manchester,MAN,53.3656,-2.2729&#10;GBGLA,GB,Glasgow,GLA,55.8642,-4.4331"
          />
          <p className="text-xs text-gray-500 mt-1">
            Paste your CSV data above. Each line should follow the format: <code className="bg-gray-100 px-1 rounded">unlocode,country,place,iataCode,latitude,longitude</code>
          </p>
        </div>
        {errors && errors.length > 0 && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm font-medium text-red-800 mb-2">Import Errors:</div>
            <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
              {errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onImport} loading={isLoading}>
            Import
          </Button>
        </div>
      </div>
    </Modal>
  )
}

// Detail Modal Component
function UNLocodeDetailModal({
  isOpen,
  onClose,
  locode,
  detail,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  locode: UNLocode
  detail?: any
  isLoading: boolean
}) {
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Database className="w-5 h-5 text-blue-600" />
          </div>
          <span>UN/LOCODE: <code className="font-mono">{locode.unlocode}</code></span>
        </div>
      } 
      size="large"
    >
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Location Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">UN/LOCODE</div>
                <div className="text-lg font-mono font-bold text-blue-600">{locode.unlocode}</div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Country</div>
                <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-gray-400" />
                  {locode.country}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Place</div>
                <div className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-gray-400" />
                  {locode.place}
                </div>
              </div>
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">IATA Code</div>
                <div className="text-lg">
                  {locode.iataCode ? (
                    <span className="font-mono bg-white px-2 py-1 rounded text-gray-900 font-semibold">
                      {locode.iataCode}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
              </div>
              {locode.latitude && locode.longitude && (
                <>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Latitude</div>
                    <div className="text-lg font-mono font-semibold text-gray-900">{locode.latitude}</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Longitude</div>
                    <div className="text-lg font-mono font-semibold text-gray-900">{locode.longitude}</div>
                  </div>
                </>
              )}
            </div>
          </div>

          {detail && (
            <>
              {detail._count && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Usage Statistics
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg border border-emerald-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Used by Sources</div>
                      <div className="text-2xl font-bold text-emerald-600">{detail._count.sourceLocations}</div>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Used in Agreements</div>
                      <div className="text-2xl font-bold text-purple-600">{detail._count.agreementLocationOverrides}</div>
                    </div>
                  </div>
                </div>
              )}

              {detail.sourceLocations && detail.sourceLocations.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Used by Sources ({detail.sourceLocations.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detail.sourceLocations.map((sl: any) => (
                      <div key={sl.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="font-medium text-gray-900">{sl.source.companyName}</div>
                        {sl.source.companyCode && (
                          <div className="text-xs text-gray-500 mt-1">Code: {sl.source.companyCode}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.agreementLocationOverrides && detail.agreementLocationOverrides.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    Used in Agreements ({detail.agreementLocationOverrides.length})
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {detail.agreementLocationOverrides.map((alo: any) => (
                      <div key={alo.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors">
                        <div className="font-medium text-gray-900">{alo.agreement.agreementRef}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          {alo.agreement.agent.companyName} ↔ {alo.agreement.source.companyName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Modal>
  )
}

