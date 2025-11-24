import React, { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { branchesApi, Branch } from '../api/branches'
import toast from 'react-hot-toast'

interface BranchEditModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
}

export const BranchEditModal: React.FC<BranchEditModalProps> = ({ branch, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: '',
    locationType: '',
    collectionType: '',
    email: '',
    phone: '',
    latitude: '',
    longitude: '',
    addressLine: '',
    city: '',
    postalCode: '',
    country: '',
    countryCode: '',
    natoLocode: '',
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (branch) {
      setFormData({
        name: branch.name || '',
        status: branch.status || '',
        locationType: branch.locationType || '',
        collectionType: branch.collectionType || '',
        email: branch.email || '',
        phone: branch.phone || '',
        latitude: branch.latitude?.toString() || '',
        longitude: branch.longitude?.toString() || '',
        addressLine: branch.addressLine || '',
        city: branch.city || '',
        postalCode: branch.postalCode || '',
        country: branch.country || '',
        countryCode: branch.countryCode || '',
        natoLocode: branch.natoLocode || '',
      })
    }
  }, [branch, isOpen])

  const updateMutation = useMutation({
    mutationFn: (data: any) => {
      const updateData: any = {}
      Object.keys(data).forEach((key) => {
        if (data[key] !== '') {
          updateData[key] = data[key]
        }
      })
      return branchesApi.updateBranch(branch!.id, updateData)
    },
    onSuccess: () => {
      toast.success('Branch updated successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      queryClient.invalidateQueries({ queryKey: ['branchStats'] })
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update branch')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateMutation.mutate(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Branch">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              options={[
                { value: '', label: 'Select status' },
                { value: 'ACTIVE', label: 'Active' },
                { value: 'INACTIVE', label: 'Inactive' },
              ]}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
            <Input
              value={formData.locationType}
              onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">UN/LOCODE</label>
            <Input
              value={formData.natoLocode}
              onChange={(e) => setFormData({ ...formData, natoLocode: e.target.value })}
              placeholder="e.g., GBMAN"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
            <Input
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
            <Input
              value={formData.country}
              onChange={(e) => setFormData({ ...formData, country: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
          <Input
            value={formData.addressLine}
            onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={updateMutation.isPending}>
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}

