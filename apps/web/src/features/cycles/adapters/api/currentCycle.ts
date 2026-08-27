import { api } from '../../../../shared/api/client'

export async function getCurrentCycle() {
  const { data, error } = await api.GET('/api/v1/cycles/current')
  if (error) throw new Error(error.error)
  return data
}
