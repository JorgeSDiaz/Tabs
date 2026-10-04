import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { createCategory, listCategories } from '../adapters/api/categories'
import type { Category } from '../domain/category'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => setError(errorMessage(err)))
      .finally(() => setLoading(false))
  }, [])

  // Creation errors propagate to the caller (the form's modal) so they can
  // be shown there. The server owns the listing order, so the list is read
  // again rather than patched here; if that read fails, the new category is
  // appended so it can still be used, and the order is right on next load.
  const create = useCallback(
    async (name: string, direction: Category['direction']) => {
      const created = await createCategory(name, direction)
      try {
        setCategories(await listCategories())
      } catch (err) {
        setCategories((prev) => [...prev, created])
        setError(errorMessage(err))
      }
      return created
    },
    [],
  )

  return { categories, error, create, loading }
}
