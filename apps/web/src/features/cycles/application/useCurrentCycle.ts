import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { getCurrentCycle } from '../adapters/api/currentCycle'
import type { CurrentCycle } from '../domain/cycle'

export function useCurrentCycle() {
  const [cycle, setCycle] = useState<CurrentCycle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    let cancelled = false
    getCurrentCycle()
      .then((data) => {
        if (!cancelled) {
          setCycle(data ?? null)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => setVersion((v) => v + 1), [])

  return { cycle, error, reload }
}
