import { useCallback, useEffect, useState } from 'react'

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

export function useLocalStorage<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => read(key, fallback))

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or unavailable — data stays in memory for this session
    }
  }, [key, value])

  const update = useCallback((updater: T | ((prev: T) => T)) => {
    setValue((prev) =>
      typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater,
    )
  }, [])

  return [value, update] as const
}

/** Keyed store: a map of records addressed by a string key (e.g. date), each lazily created. */
export function useLocalStorageMap<T>(storageKey: string) {
  const [map, setMap] = useLocalStorage<Record<string, T>>(storageKey, {})

  const get = useCallback((key: string, fallback: T) => map[key] ?? fallback, [map])

  const set = useCallback(
    (key: string, updater: T | ((prev: T) => T), fallback: T) => {
      setMap((prev) => {
        const prevValue = prev[key] ?? fallback
        const nextValue =
          typeof updater === 'function' ? (updater as (p: T) => T)(prevValue) : updater
        return { ...prev, [key]: nextValue }
      })
    },
    [setMap],
  )

  return { map, get, set }
}
