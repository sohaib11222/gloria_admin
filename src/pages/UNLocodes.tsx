import React, { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, Plus, Edit, Trash2, Upload, MapPin, X, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Modal } from '../components/ui/Modal'
import { Badge } from '../components/ui/Badge'
import { Loader } from '../components/ui/Loader'
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
  const { data: unlocodesData, isLoading } = useQuery({
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">UN/LOCODE Management</h1>
          <p className="mt-2 text-gray-600">
            Manage United Nations Location Codes (UN/LOCODEs) used for location standardization
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setIsImportModalOpen(true)}
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add UN/LOCODE
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
              <Input
                placeholder="Country code (e.g., GB, US)"
                value={filters.country}
                onChange={(e) => {
                  setFilters({ ...filters, country: e.target.value.toUpperCase() })
                  setPage(0)
                }}
                maxLength={2}
              />
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
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Total UN/LOCODEs</div>
            <div className="text-2xl font-bold text-gray-900">{total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Showing</div>
            <div className="text-2xl font-bold text-gray-900">
              {unlocodes.length} of {total}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-gray-600">Page</div>
            <div className="text-2xl font-bold text-gray-900">{page + 1}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>UN/LOCODEs</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : unlocodes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No UN/LOCODEs found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium text-gray-700">UN/LOCODE</th>
                      <th className="text-left p-3 font-medium text-gray-700">Place</th>
                      <th className="text-left p-3 font-medium text-gray-700">Country</th>
                      <th className="text-left p-3 font-medium text-gray-700">IATA</th>
                      <th className="text-left p-3 font-medium text-gray-700">Coordinates</th>
                      <th className="text-left p-3 font-medium text-gray-700">Usage</th>
                      <th className="text-right p-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unlocodes.map((locode) => (
                      <tr key={locode.unlocode} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <code className="text-sm font-mono font-semibold">{locode.unlocode}</code>
                        </td>
                        <td className="p-3">{locode.place}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{locode.country}</Badge>
                        </td>
                        <td className="p-3">{locode.iataCode || '-'}</td>
                        <td className="p-3 text-sm text-gray-600">
                          {locode.latitude && locode.longitude
                            ? `${locode.latitude.toFixed(4)}, ${locode.longitude.toFixed(4)}`
                            : '-'}
                        </td>
                        <td className="p-3">
                          {locode.usageCount !== undefined && locode.usageCount > 0 ? (
                            <Badge variant="primary">{locode.usageCount}</Badge>
                          ) : (
                            <span className="text-gray-400">0</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocode(locode)
                                setIsDetailModalOpen(true)
                              }}
                            >
                              <MapPin className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocode(locode)
                                setIsEditModalOpen(true)
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedLocode(locode)
                                setIsDeleteModalOpen(true)
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600">
                  Showing {page * limit + 1} to {Math.min((page + 1) * limit, total)} of {total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={page === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    Next
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
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV Data</label>
          <p className="text-xs text-gray-500 mb-2">
            Format: unlocode,country,place,iataCode,latitude,longitude
            <br />
            Example: GBMAN,GB,Manchester,MAN,53.3656,-2.2729
          </p>
          <textarea
            className="w-full h-64 p-3 border border-gray-300 rounded-lg font-mono text-sm"
            value={csv}
            onChange={(e) => onCsvChange(e.target.value)}
            placeholder="GBMAN,GB,Manchester,MAN,53.3656,-2.2729&#10;GBGLA,GB,Glasgow,GLA,55.8642,-4.4331"
          />
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
    <Modal isOpen={isOpen} onClose={onClose} title={`UN/LOCODE: ${locode.unlocode}`} size="large">
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600">UN/LOCODE</div>
              <div className="text-lg font-mono font-semibold">{locode.unlocode}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Country</div>
              <div className="text-lg">{locode.country}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Place</div>
              <div className="text-lg">{locode.place}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">IATA Code</div>
              <div className="text-lg">{locode.iataCode || '-'}</div>
            </div>
            {locode.latitude && locode.longitude && (
              <>
                <div>
                  <div className="text-sm text-gray-600">Latitude</div>
                  <div className="text-lg">{locode.latitude}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Longitude</div>
                  <div className="text-lg">{locode.longitude}</div>
                </div>
              </>
            )}
          </div>

          {detail && (
            <>
              {detail._count && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Usage Statistics</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Used by Sources</div>
                      <div className="text-lg font-semibold">{detail._count.sourceLocations}</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-xs text-gray-600">Used in Agreements</div>
                      <div className="text-lg font-semibold">{detail._count.agreementLocationOverrides}</div>
                    </div>
                  </div>
                </div>
              )}

              {detail.sourceLocations && detail.sourceLocations.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Used by Sources</div>
                  <div className="space-y-2">
                    {detail.sourceLocations.map((sl: any) => (
                      <div key={sl.id} className="p-2 bg-gray-50 rounded text-sm">
                        {sl.source.companyName} ({sl.source.companyCode})
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {detail.agreementLocationOverrides && detail.agreementLocationOverrides.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Used in Agreements</div>
                  <div className="space-y-2">
                    {detail.agreementLocationOverrides.map((alo: any) => (
                      <div key={alo.id} className="p-2 bg-gray-50 rounded text-sm">
                        {alo.agreement.agreementRef} - {alo.agreement.agent.companyName} ↔{' '}
                        {alo.agreement.source.companyName}
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

