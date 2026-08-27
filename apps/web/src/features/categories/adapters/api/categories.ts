import { api } from '../../../../shared/api/client'

export async function listCategories() {
  const { data, error } = await api.GET('/api/v1/categories')
  if (error) throw new Error(error.error)
  return data ?? []
}
