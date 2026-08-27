import { useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import { listCategories } from '../adapters/api/categories'
import type { Category } from '../domain/category'

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listCategories()
      .then(setCategories)
      .catch((err) => setError(errorMessage(err)))
  }, [])

  return { categories, error }
}
