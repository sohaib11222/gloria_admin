import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAppStore } from '../state/useAppStore'

interface RequireAgreementProps {
  children: React.ReactNode
}

export const RequireAgreement: React.FC<RequireAgreementProps> = ({ children }) => {
  const { state } = useAppStore()

  if (!state.agreementsAccepted) {
    return <Navigate to="/agreements" replace />
  }

  return <>{children}</>
}
