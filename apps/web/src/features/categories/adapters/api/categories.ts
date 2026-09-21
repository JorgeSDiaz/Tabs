import { api } from '../../../../shared/api/client'
import type { Category } from '../../domain/category'

export async function listCategories() {
  const { data, error } = await api.GET('/api/v1/categories')
  if (error) throw new Error(error.error)
  return data ?? []
}

export async function createCategory(
  name: string,
  direction: Category['direction'],
): Promise<Category> {
  const { data, error } = await api.POST('/api/v1/categories', {
    body: { name, direction },
  })
  if (error) throw new Error(error.error)
  if (!data) throw new Error('The category was not created')
  return data
}
