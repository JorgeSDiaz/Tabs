import { useCallback, useEffect, useState } from 'react'
import { errorMessage } from '../../../shared/lib/error'
import {
  createCategory,
  deleteCategory,
  listCategories,
  updateCategory,
} from '../adapters/api/categories'
import type {
  Category,
  CategoryDetails,
  CategoryInput,
} from '../domain/category'

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

  // After every write the list is read again rather than patched: the
  // server owns the listing order. If that read fails the write still
  // happened, so `patch` keeps the list usable and the order is right on
  // the next load.
  const refresh = useCallback(
    async (patch: (previous: Category[]) => Category[]) => {
      try {
        setCategories(await listCategories())
        setError(null)
      } catch (err) {
        setCategories(patch)
        setError(errorMessage(err))
      }
    },
    [],
  )

  // The errors of a write propagate to the caller, the dialog it was made
  // from, so they are shown there.
  const create = useCallback(
    async (input: CategoryInput) => {
      const created = await createCategory(input)
      await refresh((previous) => [...previous, created])
      return created
    },
    [refresh],
  )

  const update = useCallback(
    async (id: number, details: CategoryDetails) => {
      const updated = await updateCategory(id, details)
      await refresh((previous) =>
        previous.map((c) => (c.id === id ? updated : c)),
      )
    },
    [refresh],
  )

  const remove = useCallback(
    async (id: number) => {
      await deleteCategory(id)
      await refresh((previous) => previous.filter((c) => c.id !== id))
    },
    [refresh],
  )

  return { categories, error, create, update, remove, loading }
}
