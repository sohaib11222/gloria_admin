import React from 'react'

interface RequireAgreementProps {
  children: React.ReactNode
}

// Terms acceptance requirement has been removed - always allow access
export const RequireAgreement: React.FC<RequireAgreementProps> = ({ children }) => {
  // Always allow access - terms acceptance is no longer required
  return <>{children}</>
}
