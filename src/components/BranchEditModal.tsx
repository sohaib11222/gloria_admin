import React, { useState, useEffect, useRef } from 'react'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { branchesApi, Branch, UpdateBranchRequest } from '../api/branches'
import { unlocodesApi, UNLocode } from '../api/unlocodes'
import toast from 'react-hot-toast'
import {
  MapPin,
  Mail,
  Globe,
  Clock,
  Plane,
  Navigation,
  Tag,
  ChevronDown,
  ChevronUp,
  Info,
  Car,
} from 'lucide-react'

interface BranchEditModalProps {
  branch: Branch | null
  isOpen: boolean
  onClose: () => void
}

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const
const DAY_LABELS: Record<string, string> = {
  monday: 'Mon',
  tuesday: 'Tue',
  wednesday: 'Wed',
  thursday: 'Thu',
  friday: 'Fri',
  saturday: 'Sat',
  sunday: 'Sun',
}
const DAY_CAPITALIZED: Record<string, string> = {
  monday: 'Monday',
  tuesday: 'Tuesday',
  wednesday: 'Wednesday',
  thursday: 'Thursday',
  friday: 'Friday',
  saturday: 'Saturday',
  sunday: 'Sunday',
}

function getAttr(obj: Record<string, unknown> | null | undefined, key: string): string {
  if (!obj || typeof obj !== 'object') return ''
  const o = obj as Record<string, unknown>
  const val =
    (o.attr as Record<string, unknown> | undefined)?.[key] ??
    (o['@attributes'] as Record<string, unknown> | undefined)?.[key] ??
    o[`@_${key}`] ??
    o[key] ??
    o[key.toLowerCase()]
  return typeof val === 'object' ? '' : String(val ?? '')
}

function extractOpeningHours(branch: Branch | null): Record<string, string> {
  const hours: Record<string, string> = {}
  DAYS.forEach((d) => {
    hours[d] = ''
  })
  const raw = branch?.rawJson as Record<string, unknown> | undefined | null
  if (!raw || typeof raw !== 'object') return hours

  const opening = (raw.Opening ?? raw.opening) as Record<string, unknown> | undefined
  if (!opening || typeof opening !== 'object') return hours

  for (const day of DAYS) {
    const cap = DAY_CAPITALIZED[day]
    const entry =
      (opening[day] ?? opening[cap]) as Record<string, unknown> | string | undefined
    if (!entry) continue

    if (typeof entry === 'string') {
      hours[day] = entry
      continue
    }
    if (typeof entry !== 'object') continue

    const openTime = getAttr(entry, 'Open')
    const closedTime = getAttr(entry, 'Closed') || getAttr(entry, 'Close')
    if (openTime && closedTime) hours[day] = `${openTime} - ${closedTime}`
    else if (openTime) hours[day] = openTime
    else hours[day] = 'Closed'
  }
  return hours
}

function extractPickupInstructions(branch: Branch | null): string {
  const raw = branch?.rawJson as Record<string, unknown> | undefined | null
  if (!raw || typeof raw !== 'object') return ''
  const pi = (raw.PickupInstructions ?? raw.pickupInstructions) as Record<string, unknown> | string | undefined
  if (!pi) return ''
  if (typeof pi === 'string') return pi
  return getAttr(pi as Record<string, unknown>, 'Pickup')
}

function extractAtAirport(branch: Branch | null): boolean {
  const raw = branch?.rawJson as Record<string, unknown> | undefined | null
  if (!raw || typeof raw !== 'object') return false
  const val =
    raw.AtAirport ??
    raw.atAirport ??
    raw['@_AtAirport'] ??
    (raw['@attributes'] as Record<string, unknown> | undefined)?.AtAirport ??
    (raw.attr as Record<string, unknown> | undefined)?.AtAirport ??
    ''
  return String(val).toLowerCase() === 'true'
}

function extractBrand(branch: Branch | null): string {
  const raw = branch?.rawJson as Record<string, unknown> | undefined | null
  if (!raw || typeof raw !== 'object') return ''
  const b =
    raw.Brand ??
    raw.brand ??
    raw['@_Brand'] ??
    (raw['@attributes'] as Record<string, unknown> | undefined)?.Brand ??
    (raw.attr as Record<string, unknown> | undefined)?.Brand ??
    ''
  return typeof b === 'string' ? b : ''
}

function extractCars(branch: Branch | null): unknown[] {
  const raw = branch?.rawJson as Record<string, unknown> | undefined | null
  if (!raw || typeof raw !== 'object') return []
  const cars = (raw.Cars ?? raw.cars) as Record<string, unknown> | undefined
  if (!cars || typeof cars !== 'object') return []
  const codeList = (cars.Code ?? cars.code) as unknown
  if (!codeList) return []
  return Array.isArray(codeList) ? codeList : [codeList]
}

function getCarAttr(car: unknown, key: string): string {
  if (!car || typeof car !== 'object') return ''
  const c = car as Record<string, unknown>
  const v =
    (c.attr as Record<string, unknown> | undefined)?.[key] ??
    (c['@attributes'] as Record<string, unknown> | undefined)?.[key] ??
    c[`@_${key}`] ??
    c[key] ??
    c[key.toLowerCase()]
  if (v == null) return ''
  return typeof v === 'object' ? '' : String(v)
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

  const [openingHours, setOpeningHours] = useState<Record<string, string>>(() => {
    const h: Record<string, string> = {}
    DAYS.forEach((d) => {
      h[d] = ''
    })
    return h
  })
  const [pickupInstructions, setPickupInstructions] = useState('')
  const [atAirport, setAtAirport] = useState(false)
  const [brand, setBrand] = useState('')

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basic: true,
    address: true,
    contact: true,
    coordinates: true,
    hours: true,
    gloria: false,
    cars: false,
  })

  const [locodeSearchQuery, setLocodeSearchQuery] = useState('')
  const [showLocodeDropdown, setShowLocodeDropdown] = useState(false)
  const [selectedLocode, setSelectedLocode] = useState<UNLocode | null>(null)
  const locodeInputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const queryClient = useQueryClient()

  const { data: locodeResults, isLoading: isLoadingLocodes } = useQuery({
    queryKey: ['admin', 'unlocodes', locodeSearchQuery],
    queryFn: () => unlocodesApi.list({ query: locodeSearchQuery, limit: 12 }),
    enabled: locodeSearchQuery.length >= 2 && showLocodeDropdown,
  })

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        locodeInputRef.current &&
        !locodeInputRef.current.contains(event.target as Node)
      ) {
        setShowLocodeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (branch && isOpen) {
      setFormData({
        name: branch.name || '',
        status: branch.status || '',
        locationType: branch.locationType || '',
        collectionType: branch.collectionType || '',
        email: branch.email || '',
        phone: branch.phone || '',
        latitude:
          branch.latitude != null && Number.isFinite(branch.latitude) ? String(branch.latitude) : '',
        longitude:
          branch.longitude != null && Number.isFinite(branch.longitude) ? String(branch.longitude) : '',
        addressLine: branch.addressLine || '',
        city: branch.city || '',
        postalCode: branch.postalCode || '',
        country: branch.country || '',
        countryCode: branch.countryCode || '',
        natoLocode: branch.natoLocode || '',
      })
      setLocodeSearchQuery(branch.natoLocode || '')
      setSelectedLocode(null)
      setShowLocodeDropdown(false)
      setOpeningHours(extractOpeningHours(branch))
      setPickupInstructions(extractPickupInstructions(branch))
      setAtAirport(extractAtAirport(branch))
      setBrand(extractBrand(branch))
    }
  }, [branch, isOpen])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!branch) throw new Error('No branch selected')

      const updateData: UpdateBranchRequest = {
        name: formData.name.trim(),
        status: formData.status === '' ? null : formData.status,
        locationType: formData.locationType.trim() === '' ? null : formData.locationType.trim(),
        collectionType: formData.collectionType.trim() === '' ? null : formData.collectionType.trim(),
        email: formData.email.trim() === '' ? null : formData.email.trim(),
        phone: formData.phone.trim() === '' ? null : formData.phone.trim(),
        addressLine: formData.addressLine.trim() === '' ? null : formData.addressLine.trim(),
        city: formData.city.trim() === '' ? null : formData.city.trim(),
        postalCode: formData.postalCode.trim() === '' ? null : formData.postalCode.trim(),
        country: formData.country.trim() === '' ? null : formData.country.trim(),
        countryCode: formData.countryCode.trim() === '' ? null : formData.countryCode.trim().toUpperCase(),
        natoLocode: formData.natoLocode.trim() === '' ? null : formData.natoLocode.trim().toUpperCase(),
      }

      const latStr = formData.latitude.trim()
      const lngStr = formData.longitude.trim()
      updateData.latitude = latStr === '' ? null : Number(latStr)
      updateData.longitude = lngStr === '' ? null : Number(lngStr)

      const rawJsonUpdates: Record<string, unknown> = {}
      const hasOpeningChanges = DAYS.some((d) => (openingHours[d] ?? '').trim() !== '')
      if (hasOpeningChanges) {
        const opening: Record<string, { attr: { Open?: string; Closed?: string } }> = {}
        DAYS.forEach((d) => {
          const val = openingHours[d]?.trim()
          if (!val) return
          const cap = DAY_CAPITALIZED[d]
          const parts = val.split(/\s*-\s*/)
          if (parts.length === 2) {
            opening[cap] = {
              attr: { Open: parts[0].trim(), Closed: parts[1].trim() },
            }
          } else {
            opening[cap] = { attr: { Open: val } }
          }
        })
        rawJsonUpdates.Opening = opening
      }

      if (pickupInstructions.trim()) {
        rawJsonUpdates.PickupInstructions = { attr: { Pickup: pickupInstructions.trim() } }
      }
      rawJsonUpdates.AtAirport = String(atAirport)
      if (brand.trim()) {
        rawJsonUpdates.Brand = brand.trim()
      }

      if (Object.keys(rawJsonUpdates).length > 0) {
        updateData.rawJson = rawJsonUpdates
      }

      return branchesApi.updateBranch(branch.id, updateData)
    },
    onSuccess: () => {
      toast.success('Branch updated successfully')
      queryClient.invalidateQueries({ queryKey: ['branches'] })
      queryClient.invalidateQueries({ queryKey: ['branchStats'] })
      onClose()
    },
    onError: (error: any) => {
      const code = error.response?.data?.error
      const msg = error.response?.data?.message || 'Failed to update branch'
      if (code === 'INVALID_UNLOCODE' || code === 'INVALID_UNLOCODE_FORMAT') {
        toast.error(msg)
      } else {
        toast.error(msg)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!branch) return

    if (!formData.name.trim()) {
      toast.error('Name is required')
      return
    }
    if (formData.email.trim() !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      toast.error('Invalid email format')
      return
    }
    if (
      formData.latitude.trim() !== '' &&
      (!Number.isFinite(Number(formData.latitude)) ||
        Number(formData.latitude) < -90 ||
        Number(formData.latitude) > 90)
    ) {
      toast.error('Latitude must be between -90 and 90')
      return
    }
    if (
      formData.longitude.trim() !== '' &&
      (!Number.isFinite(Number(formData.longitude)) ||
        Number(formData.longitude) < -180 ||
        Number(formData.longitude) > 180)
    ) {
      toast.error('Longitude must be between -180 and 180')
      return
    }

    updateMutation.mutate()
  }

  const handleLocodeInput = (query: string) => {
    const upper = query.toUpperCase()
    setLocodeSearchQuery(upper)
    setFormData((prev) => ({ ...prev, natoLocode: upper }))
    setSelectedLocode(null)
    setShowLocodeDropdown(upper.length >= 2)
  }

  const handleSelectLocode = (locode: UNLocode) => {
    setFormData((prev) => ({
      ...prev,
      natoLocode: locode.unlocode,
      city: locode.place || prev.city,
      country: locode.country || prev.country,
      latitude: locode.latitude != null ? String(locode.latitude) : prev.latitude,
      longitude: locode.longitude != null ? String(locode.longitude) : prev.longitude,
    }))
    setLocodeSearchQuery(locode.unlocode)
    setSelectedLocode(locode)
    setShowLocodeDropdown(false)
  }

  const cars = extractCars(branch)

  const SectionHeader = ({
    id,
    Icon,
    title,
    count,
  }: {
    id: string
    Icon: typeof MapPin
    title: string
    count?: number
  }) => (
    <button
      type="button"
      onClick={() => toggleSection(id)}
      className="flex items-center justify-between w-full py-2.5 px-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
    >
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        {count !== undefined && (
          <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">{count}</span>
        )}
      </div>
      {expandedSections[id] ? (
        <ChevronUp className="w-4 h-4 text-gray-400" />
      ) : (
        <ChevronDown className="w-4 h-4 text-gray-400" />
      )}
    </button>
  )

  if (!branch) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Branch"
      size="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[min(76vh,calc(100vh-10rem))] overflow-y-auto pr-1">
        <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <Tag className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs text-blue-600 font-medium">Branch Code</div>
            <div className="text-sm font-mono font-semibold text-blue-900 truncate">{branch.branchCode || '—'}</div>
          </div>
          {atAirport && (
            <span className="flex items-center gap-1 bg-blue-100 text-blue-700 text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap">
              <Plane className="w-3 h-3" /> Airport
            </span>
          )}
          {brand && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full max-w-[120px] truncate">{brand}</span>
          )}
        </div>

        <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2 text-xs text-gray-700">
          Source:{' '}
          <span className="font-medium text-gray-900">{branch.source?.companyName ?? '—'}</span>
          {branch.source?.companyCode ? (
            <span className="text-gray-500"> · {branch.source.companyCode}</span>
          ) : null}
          <span className="font-mono text-gray-500 block mt-1">ID {branch.id}</span>
          {branch.agreementId ? (
            <span className="font-mono text-gray-500 block">Agreement {branch.agreementId}</span>
          ) : null}
        </div>

        <SectionHeader id="basic" Icon={Info} title="Basic information" />
        {expandedSections.basic && (
          <div className="space-y-3 pl-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
                <Select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  options={[
                    { value: '', label: 'Not set' },
                    { value: 'ACTIVE', label: 'Active' },
                    { value: 'INACTIVE', label: 'Inactive' },
                  ]}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Location type</label>
                <Input
                  value={formData.locationType}
                  onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                  placeholder="e.g. Outside Airport, City Center"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Collection type</label>
                <Input
                  value={formData.collectionType}
                  onChange={(e) => setFormData({ ...formData, collectionType: e.target.value })}
                  placeholder="e.g. AIRPORT, CITY"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Brand</label>
                <Input
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Europcar"
                />
              </div>
              <div className="flex items-center gap-3 pt-6 sm:pt-8">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={atAirport}
                    onChange={(e) => setAtAirport(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                  <span className="ml-2 text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Plane className="w-3 h-3" /> At airport
                  </span>
                </label>
              </div>
            </div>
          </div>
        )}

        <SectionHeader id="address" Icon={MapPin} title="Address" />
        {expandedSections.address && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Address line</label>
              <Input
                value={formData.addressLine}
                onChange={(e) => setFormData({ ...formData, addressLine: e.target.value })}
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">City</label>
                <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Postal code</label>
                <Input
                  value={formData.postalCode}
                  onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country</label>
                <Input
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  placeholder="Country name"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Country code (ISO)</label>
                <Input
                  value={formData.countryCode}
                  onChange={(e) =>
                    setFormData({ ...formData, countryCode: e.target.value.toUpperCase().slice(0, 3) })
                  }
                  placeholder="e.g. GB, AE, US"
                  maxLength={3}
                  className="font-mono"
                />
              </div>
              <div className="relative" ref={locodeInputRef}>
                <label className="block text-xs font-medium text-gray-600 mb-1">UN/LOCODE</label>
                <Input
                  value={locodeSearchQuery}
                  onChange={(e) => handleLocodeInput(e.target.value)}
                  onFocus={() => locodeSearchQuery.length >= 2 && setShowLocodeDropdown(true)}
                  placeholder="Type code or place (e.g. USTPA, Tampa)"
                  maxLength={8}
                  className="font-mono"
                />
                {showLocodeDropdown && (
                  <div
                    ref={dropdownRef}
                    className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto"
                  >
                    {isLoadingLocodes ? (
                      <div className="p-2 text-xs text-gray-500">Searching…</div>
                    ) : locodeResults?.items && locodeResults.items.length > 0 ? (
                      locodeResults.items.map((locode) => (
                        <button
                          key={locode.unlocode}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b border-gray-100 last:border-0 text-sm"
                          onClick={() => handleSelectLocode(locode)}
                        >
                          <span className="font-mono font-semibold text-gray-900">{locode.unlocode}</span>
                          <span className="text-gray-600 text-xs block">
                            {locode.place}, {locode.country}
                            {locode.iataCode ? ` · IATA ${locode.iataCode}` : ''}
                          </span>
                        </button>
                      ))
                    ) : (
                      <div className="p-2 text-xs text-gray-500">
                        No matches — you can save a 4–5 character code if it validates; missing codes register on save.
                      </div>
                    )}
                  </div>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Search Gloria&apos;s UN/LOCODE index. Saving still creates a stub row when needed (same as source portal).
                </p>
                {selectedLocode && (
                  <p className="text-xs text-blue-700 mt-0.5">
                    Selected: {selectedLocode.unlocode} — {selectedLocode.place}, {selectedLocode.country}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        <SectionHeader id="contact" Icon={Mail} title="Contact" />
        {expandedSections.contact && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Email</label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
              <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
          </div>
        )}

        <SectionHeader id="coordinates" Icon={Navigation} title="Coordinates" />
        {expandedSections.coordinates && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Latitude</label>
              <Input
                type="number"
                step="any"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Longitude</label>
              <Input
                type="number"
                step="any"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
              />
            </div>
          </div>
        )}

        <SectionHeader id="hours" Icon={Clock} title="Opening hours" />
        {expandedSections.hours && (
          <div className="space-y-2 pl-1">
            <p className="text-xs text-gray-500 mb-2">Format: HH:mm – HH:mm (open – close)</p>
            <div className="grid grid-cols-1 gap-1.5">
              {DAYS.map((day) => {
                const val = openingHours[day]
                const hasValue = val && val.trim() !== ''
                return (
                  <div key={day} className="flex items-center gap-2">
                    <span className="w-10 text-xs font-semibold text-gray-500 text-right shrink-0">{DAY_LABELS[day]}</span>
                    <Input
                      value={val}
                      onChange={(e) =>
                        setOpeningHours({
                          ...openingHours,
                          [day]: e.target.value,
                        })
                      }
                      placeholder="e.g. 08:00 – 20:00"
                      className={`flex-1 text-sm ${hasValue ? 'border-green-300 bg-green-50/30' : ''}`}
                    />
                    {hasValue && <span className="text-xs text-green-600 shrink-0 w-6 text-center">✓</span>}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <SectionHeader id="gloria" Icon={Globe} title="GLORIA details" />
        {expandedSections.gloria && (
          <div className="space-y-3 pl-1">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Pickup instructions</label>
              <textarea
                value={pickupInstructions}
                onChange={(e) => setPickupInstructions(e.target.value)}
                rows={3}
                className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-300 focus:border-blue-400 outline-none resize-y"
                placeholder="Instructions for customer pickup…"
              />
            </div>
            {branch.rawJson && typeof branch.rawJson === 'object' && (
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="text-xs font-medium text-gray-500 mb-2">Raw GLORIA data (read-only)</div>
                <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words max-h-48 overflow-y-auto font-mono leading-relaxed">
                  {JSON.stringify(branch.rawJson, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {cars.length > 0 && (
          <>
            <SectionHeader id="cars" Icon={Car} title="Available cars" count={cars.length} />
            {expandedSections.cars && (
              <div className="pl-1">
                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">ACRISS</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Group</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Make</th>
                        <th className="px-2 py-1.5 text-left font-medium text-gray-600">Model</th>
                        <th className="px-2 py-1.5 text-center font-medium text-gray-600">Doors</th>
                        <th className="px-2 py-1.5 text-center font-medium text-gray-600">Seats</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {cars.map((car, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-2 py-1.5 font-mono font-semibold text-blue-700">{getCarAttr(car, 'Acrisscode') || '—'}</td>
                          <td className="px-2 py-1.5 text-gray-700">{getCarAttr(car, 'Group') || '—'}</td>
                          <td className="px-2 py-1.5 text-gray-700">{getCarAttr(car, 'Make') || '—'}</td>
                          <td className="px-2 py-1.5 text-gray-700">{getCarAttr(car, 'Model') || '—'}</td>
                          <td className="px-2 py-1.5 text-center text-gray-700">{getCarAttr(car, 'Doors') || '—'}</td>
                          <td className="px-2 py-1.5 text-center text-gray-700">{getCarAttr(car, 'Seats') || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 sticky bottom-0 bg-white pb-1">
          <Button variant="secondary" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={updateMutation.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Modal>
  )
}
