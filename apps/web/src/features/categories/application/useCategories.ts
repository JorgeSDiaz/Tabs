import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { createCategory, listCategories } from '../adapters/api/categories'
import type { Category } from '../domain/category'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => setError(errorMessage(err)))
  }, [])

  // Creation errors propagate to the caller (the form's modal) so they can
  // be shown there; the state is the single owner of the list, so the new
  // category is offered by every dropdown right away.
  const create = useCallback(
    async (name: string, direction: Category['direction']) => {
      const created = await createCategory(name, direction)
      setCategories((prev) => [...prev, created])
      return created
    },
    [],
  )

  return { categories, error, create }
}
