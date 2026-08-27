import { api } from '../../../../shared/api/client'
import type { MovementInput } from '../../domain/movement'

export async function listMovements() {
  const { data, error } = await api.GET('/api/v1/movements')
  if (error) throw new Error(error.error)
  return data ?? []
}

export async function recordMovement(input: MovementInput) {
  const { data, error } = await api.POST('/api/v1/movements', { body: input })
  if (error) throw new Error(error.error)
  return data
}

export async function deleteMovement(id: number) {
  const { error } = await api.DELETE('/api/v1/movements/{id}', {
    params: { path: { id } },
  })
  if (error) throw new Error(error.error)
}
