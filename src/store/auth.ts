import { atom } from 'jotai'

export interface User {
  id: string
  email: string
  type: 'ADMIN' | 'SOURCE' | 'AGENT'
  companyId?: string
}

export interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
}

// Base atoms
export const tokenAtom = atom<string | null>(
  typeof window !== 'undefined' ? localStorage.getItem('token') : null
)

export const userAtom = atom<User | null>(
  typeof window !== 'undefined' 
    ? JSON.parse(localStorage.getItem('user') || 'null')
    : null
)

// Derived atoms
export const isAuthenticatedAtom = atom(
  (get) => !!get(tokenAtom) && !!get(userAtom)
)

export const authStateAtom = atom(
  (get) => ({
    token: get(tokenAtom),
    user: get(userAtom),
    isAuthenticated: get(isAuthenticatedAtom)
  })
)

// Actions
export const loginAtom = atom(
  null,
  (get, set, { token, user }: { token: string; user: User }) => {
    set(tokenAtom, token)
    set(userAtom, user)
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(user))
  }
)

export const logoutAtom = atom(
  null,
  (get, set) => {
    set(tokenAtom, null)
    set(userAtom, null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
)

export const updateUserAtom = atom(
  null,
  (get, set, user: User) => {
    set(userAtom, user)
    localStorage.setItem('user', JSON.stringify(user))
  }
)
