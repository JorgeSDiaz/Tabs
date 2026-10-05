import { api } from '../../../../shared/api/client'
import type {
  Category,
  CategoryDetails,
  CategoryInput,
} from '../../domain/category'

export async function listCategories() {
  const { data, error } = await api.GET('/api/v1/categories')
  if (error) throw new Error(error.error)
  return data ?? []
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data, error } = await api.POST('/api/v1/categories', { body: input })
  if (error) throw new Error(error.error)
  if (!data) throw new Error('The category was not created')
  return data
}

export async function updateCategory(
  id: number,
  details: CategoryDetails,
): Promise<Category> {
  const { data, error } = await api.PUT('/api/v1/categories/{id}', {
    params: { path: { id } },
    body: details,
  })
  if (error) throw new Error(error.error)
  if (!data) throw new Error('The category was not updated')
  return data
}

export async function deleteCategory(id: number) {
  const { error } = await api.DELETE('/api/v1/categories/{id}', {
    params: { path: { id } },
  })
  if (error) throw new Error(error.error)
}
