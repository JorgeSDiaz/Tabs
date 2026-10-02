import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { listMovements } from '../adapters/api/movements'
import type { Movement } from '../domain/movement'

export function useMovements() {
  const [movements, setMovements] = useState<Movement[]>([])
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    listMovements()
      .then((data) => {
        if (!cancelled) {
          setMovements(data)
          setError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err))
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setReady(true)
        }
      })
    return () => {
      cancelled = true
    }
  }, [version])

  const reload = useCallback(() => {
    setLoading(true)
    setVersion((v) => v + 1)
  }, [])

  return { movements, error, reload, loading, ready }
}
