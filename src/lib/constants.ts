import { LayoutDashboard, Building, FileText, MapPin, HeartPulse, Puzzle, Settings, BookOpen, Users, Server, Search, ClipboardList, BarChart3, CheckCircle, Activity as ActivityIcon, History, HelpCircle, Shield, FileCheck } from 'lucide-react'

export const ROUTES = {
  LOGIN: '/login',
  DASHBOARD: '/',
  SOURCES: '/sources',
  AGENTS: '/agents',
  COMPANIES: '/companies',
  AGREEMENTS: '/agreements',
  AGREEMENTS_MANAGEMENT: '/agreements-management',
  LOCATIONS: '/locations',
  AVAILABILITY_TEST: '/availability-test',
  BOOKINGS_TEST: '/bookings-test',
  VERIFICATION: '/verification',
  HEALTH: '/health',
  METRICS: '/metrics',
  LOGS: '/logs',
  SETTINGS: '/settings',
} as const

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SOURCE: 'SOURCE',
  AGENT: 'AGENT',
} as const

export const COMPANY_TYPES = {
  SOURCE: 'SOURCE',
  AGENT: 'AGENT',
} as const

export const AGREEMENT_STATUSES = {
  DRAFT: 'DRAFT',
  OFFERED: 'OFFERED',
  ACTIVE: 'ACTIVE',
  SUSPENDED: 'SUSPENDED',
  EXPIRED: 'EXPIRED',
} as const

export const BOOKING_STATUSES = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const

export const VEHICLE_CLASSES = [
  'ECONOMY',
  'COMPACT',
  'INTERMEDIATE',
  'STANDARD',
  'FULL_SIZE',
  'PREMIUM',
  'LUXURY',
  'MINIVAN',
  'SUV',
  'CONVERTIBLE',
] as const

export const NAVIGATION_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { path: '/companies', label: 'Companies', icon: 'Building' },
  { path: '/agents', label: 'Agents', icon: 'Users' },
  { path: '/sources', label: 'Sources', icon: 'Server' },
  { path: '/agreements-management', label: 'Agreements', icon: 'FileText' },
  { path: '/locations', label: 'Locations', icon: 'MapPin' },
  { path: '/location-validation', label: 'Location Validation', icon: 'FileCheck' },
  { path: '/availability', label: 'Availability', icon: 'Search' },
  { path: '/verification', label: 'Verification', icon: 'CheckCircle' },
  { path: '/booking-logs', label: 'Bookings', icon: 'ClipboardList' },
  { path: '/health', label: 'Health', icon: 'HeartPulse' },
  { path: '/activity', label: 'Activity', icon: 'ActivityIcon' },
  { path: '/integrations', label: 'Integrations', icon: 'Puzzle' },
  { path: '/ip-whitelist', label: 'IP Whitelist', icon: 'Shield' },
  { path: '/logs', label: 'System Logs', icon: 'FileText' },
  { path: '/metrics', label: 'Metrics', icon: 'BarChart3' },
  { path: '/docs', label: 'API Reference', icon: 'BookOpen' },
  { path: '/changelog', label: "What's New", icon: 'HelpCircle' },
  { path: '/settings', label: 'Settings', icon: 'Settings' },
] as const

export const Icons = {
  LayoutDashboard,
  Building,
  FileText,
  MapPin,
  HeartPulse,
  Puzzle,
  Settings,
  BookOpen,
  Users,
  Server,
  Search,
  ClipboardList,
  BarChart3,
  CheckCircle,
  ActivityIcon,
  History,
  HelpCircle,
  Shield,
  FileCheck,
}

export const POLL_INTERVALS = {
  FAST: 1000,
  NORMAL: 2000,
  SLOW: 5000,
} as const

export const METRICS_REFRESH_INTERVALS = {
  FAST: 5000,
  NORMAL: 10000,
  SLOW: 30000,
} as const
