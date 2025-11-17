import { useEffect, useState } from 'react'

export function useLocalStorage(key: string, initialValue: string) {
  const [value, setValue] = useState<string>(() => {
    const v = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    return v ?? initialValue
  })
  useEffect(() => {
    try {
      window.localStorage.setItem(key, value)
    } catch {}
  }, [key, value])
  return [value, setValue] as const
}


