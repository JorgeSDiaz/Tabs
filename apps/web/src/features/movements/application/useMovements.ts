import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { listMovements } from '../adapters/api/movements'
import type { Movement } from '../domain/movement'

export function useMovements() {
  const [movements, setMovements] = useState<Movement[]>([])
  // What the last response described. `page` is the page the server
  // returned, which is the last one when the asked page no longer exists.
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [error, setError] = useState<string | null>(null)
  // The page to ask for. A new object every time, so asking for the same
  // page again still refetches.
  const [request, setRequest] = useState({ page: 1 })
  const [loading, setLoading] = useState(true)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let cancelled = false
    listMovements(request.page)
      .then((data) => {
        if (!cancelled) {
          setMovements(data.items)
          setPage(data.page)
          setTotalPages(data.total_pages)
          setTotal(data.total)
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
  }, [request])

  const goToPage = useCallback((next: number) => {
    setLoading(true)
    setRequest({ page: next })
  }, [])

  // Asks again for the page on screen, not the one last asked for: they
  // differ after the server answered with the last page.
  const reload = useCallback(() => goToPage(page), [goToPage, page])

  return {
    movements,
    page,
    totalPages,
    total,
    error,
    goToPage,
    reload,
    loading,
    ready,
  }
}
