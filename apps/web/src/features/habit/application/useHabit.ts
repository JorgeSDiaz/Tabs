import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { getHabit } from '../adapters/api/habit'
import type { Habit } from '../domain/habit'

export function useHabit() {
  const [habit, setHabit] = useState<Habit | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    getHabit()
      .then((data) => {
        if (!cancelled) {
          setHabit(data ?? null)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => {
    setLoading(true)
    setVersion((v) => v + 1)
  }, [])

  return { habit, error, reload, loading }
}
