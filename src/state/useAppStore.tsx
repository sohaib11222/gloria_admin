import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react'

export type Role = 'admin' | 'viewer'
export type Tabs = 'connectivity' | 'source' | 'agent' | 'registration' | 'agreements'

interface AppState {
  authed: boolean | null
  role: Role
  addresses: {
    sourceGrpcAddr?: string
    agentGrpcAddr?: string
    sourceHttpUrl?: string
    agentHttpUrl?: string
  }
  features: {
    whitelist?: boolean
    metrics?: boolean
    verification?: boolean
    grpcTesting?: boolean
  }
  agreementsAccepted: boolean
}

type AppAction =
  | { type: 'SET_AUTHED'; payload: boolean | null }
  | { type: 'SET_ROLE'; payload: Role }
  | { type: 'SET_ADDRESSES'; payload: Partial<AppState['addresses']> }
  | { type: 'SET_FEATURES'; payload: Partial<AppState['features']> }
  | { type: 'SET_AGREEMENTS_ACCEPTED'; payload: boolean }
  | { type: 'HYDRATE_FROM_LOCAL' }

const initialState: AppState = {
  authed: null, // Start as null to indicate loading state
  role: 'admin',
  addresses: {},
  features: {},
  agreementsAccepted: false,
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_AUTHED':
      return { ...state, authed: action.payload }
    case 'SET_ROLE':
      return { ...state, role: action.payload }
    case 'SET_ADDRESSES':
      const newAddresses = { ...state.addresses, ...action.payload }
      localStorage.setItem('addresses', JSON.stringify(newAddresses))
      return { ...state, addresses: newAddresses }
    case 'SET_FEATURES':
      return { ...state, features: { ...state.features, ...action.payload } }
    case 'SET_AGREEMENTS_ACCEPTED':
      localStorage.setItem('agreements.accepted', action.payload ? 'true' : 'false')
      return { ...state, agreementsAccepted: action.payload }
    case 'HYDRATE_FROM_LOCAL':
      try {
        const addr = JSON.parse(localStorage.getItem('addresses') || '{}')
        const acc = localStorage.getItem('agreements.accepted') === 'true'
        
        // Check for existing authentication
        const existingToken = localStorage.getItem('token')
        const existingUser = localStorage.getItem('user')
        const isAuthenticated = !!(existingToken && existingUser)
        
        
        return { 
          ...state, 
          addresses: addr, 
          agreementsAccepted: acc,
          authed: isAuthenticated
        }
      } catch (error) {
        console.warn('Failed to hydrate from localStorage:', error)
        return { ...state, authed: false }
      }
    default:
      return state
  }
}

interface AppContextType {
  state: AppState
  setAuthed: (b: boolean | null) => void
  setRole: (r: Role) => void
  setAddresses: (patch: Partial<AppState['addresses']>) => void
  setFeatures: (f: Partial<AppState['features']>) => void
  setAgreementsAccepted: (b: boolean) => void
  hydrateFromLocal: () => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState)

  const setAuthed = (b: boolean | null) => dispatch({ type: 'SET_AUTHED', payload: b })
  const setRole = (r: Role) => dispatch({ type: 'SET_ROLE', payload: r })
  const setAddresses = (patch: Partial<AppState['addresses']>) => 
    dispatch({ type: 'SET_ADDRESSES', payload: patch })
  const setFeatures = (f: Partial<AppState['features']>) => 
    dispatch({ type: 'SET_FEATURES', payload: f })
  const setAgreementsAccepted = (b: boolean) => 
    dispatch({ type: 'SET_AGREEMENTS_ACCEPTED', payload: b })
  const hydrateFromLocal = () => dispatch({ type: 'HYDRATE_FROM_LOCAL' })

  useEffect(() => {
    hydrateFromLocal()
  }, [])

  return (
    <AppContext.Provider value={{
      state,
      setAuthed,
      setRole,
      setAddresses,
      setFeatures,
      setAgreementsAccepted,
      hydrateFromLocal,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useAppStore must be used within an AppProvider')
  }
  return context
}
