import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { RequireAgreement } from './RequireAgreement'
import { Shell } from '../components/layout/Shell'
import { NavShell } from '../components/NavShell'
import Dashboard from '../pages/Dashboard'
import Sources from '../pages/Sources'
import Agents from '../pages/Agents'
import Companies from '../pages/Companies'
import Agreements from '../pages/Agreements'
import AgreementsManagement from '../pages/AgreementsManagement'
import Locations from '../pages/Locations'
import AvailabilityTester from '../pages/AvailabilityTester'
import BookingsTester from '../pages/BookingsTester'
import Verification from '../pages/Verification'
import Health from '../pages/Health'
import Metrics from '../pages/Metrics'
import Logs from '../pages/Logs'
import Settings from '../pages/Settings'
import Integrations from '../pages/Integrations'
import BookingLogs from '../pages/BookingLogs'
import DocsPage from '../pages/Docs'
import Activity from '../pages/Activity'
import Changelog from '../pages/Changelog'
import IpWhitelist from '../pages/IpWhitelist'
import LocationValidation from '../pages/LocationValidation'

// Import new pages
import LoginPage from '../pages/LoginPage'
import AgreementsPage from '../pages/AgreementsPage'
import RegistrationPage from '../pages/RegistrationPage'
import ConnectivityPage from '../pages/ConnectivityPage'
import AgentPage from '../pages/AgentPage'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* New Admin UI Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route
          path="dashboard"
          element={
            <RequireAgreement>
              <Dashboard />
            </RequireAgreement>
          }
        />
        <Route path="agreements" element={<AgreementsPage />} />
        <Route
          path="registration"
          element={
            <RequireAgreement>
              <RegistrationPage />
            </RequireAgreement>
          }
        />
        <Route
          path="connectivity"
          element={
            <RequireAgreement>
              <ConnectivityPage />
            </RequireAgreement>
          }
        />
        <Route
          path="agent"
          element={
            <RequireAgreement>
              <AgentPage />
            </RequireAgreement>
          }
        />
        <Route
          path="companies"
          element={
            <RequireAgreement>
              <Companies />
            </RequireAgreement>
          }
        />
        <Route
          path="agreements-management"
          element={
            <RequireAgreement>
              <AgreementsManagement />
            </RequireAgreement>
          }
        />
        <Route
          path="locations"
          element={
            <RequireAgreement>
              <Locations />
            </RequireAgreement>
          }
        />
        <Route
          path="integrations"
          element={
            <RequireAgreement>
              <Integrations />
            </RequireAgreement>
          }
        />
        <Route
          path="logs"
          element={
            <RequireAgreement>
              <Logs />
            </RequireAgreement>
          }
        />
        <Route
          path="booking-logs"
          element={
            <RequireAgreement>
              <BookingLogs />
            </RequireAgreement>
          }
        />
        <Route
          path="metrics"
          element={
            <RequireAgreement>
              <Metrics />
            </RequireAgreement>
          }
        />
        <Route
          path="health"
          element={
            <RequireAgreement>
              <Health />
            </RequireAgreement>
          }
        />
        <Route
          path="settings"
          element={
            <RequireAgreement>
              <Settings />
            </RequireAgreement>
          }
        />
        <Route
          path="docs"
          element={
            <RequireAgreement>
              <DocsPage />
            </RequireAgreement>
          }
        />
        <Route
          path="agents"
          element={
            <RequireAgreement>
              <Agents />
            </RequireAgreement>
          }
        />
        <Route
          path="sources"
          element={
            <RequireAgreement>
              <Sources />
            </RequireAgreement>
          }
        />
        <Route
          path="availability"
          element={
            <RequireAgreement>
              <AvailabilityTester />
            </RequireAgreement>
          }
        />
        <Route
          path="verification"
          element={
            <RequireAgreement>
              <Verification />
            </RequireAgreement>
          }
        />
        <Route
          path="bookings-test"
          element={
            <RequireAgreement>
              <BookingsTester />
            </RequireAgreement>
          }
        />
        <Route
          path="activity"
          element={
            <RequireAgreement>
              <Activity />
            </RequireAgreement>
          }
        />
        <Route
          path="changelog"
          element={
            <RequireAgreement>
              <Changelog />
            </RequireAgreement>
          }
        />
        <Route
          path="ip-whitelist"
          element={
            <RequireAgreement>
              <IpWhitelist />
            </RequireAgreement>
          }
        />
        <Route
          path="location-validation"
          element={
            <RequireAgreement>
              <LocationValidation />
            </RequireAgreement>
          }
        />
      </Route>

      {/* Legacy Routes (kept for backward compatibility) */}
      <Route
        path="/legacy"
        element={
          <ProtectedRoute>
            <Shell />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="sources" element={<Sources />} />
        <Route path="agents" element={<Agents />} />
        <Route path="companies" element={<Companies />} />
        <Route path="agreements" element={<Agreements />} />
        <Route path="locations" element={<Locations />} />
        <Route path="availability-test" element={<AvailabilityTester />} />
        <Route path="bookings-test" element={<BookingsTester />} />
        <Route path="verification" element={<Verification />} />
        <Route path="health" element={<Health />} />
        <Route path="metrics" element={<Metrics />} />
        <Route path="logs" element={<Logs />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
