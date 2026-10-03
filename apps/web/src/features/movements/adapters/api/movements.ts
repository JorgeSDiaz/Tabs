import { api } from '../../../../shared/api/client'
import type { MovementInput } from '../../domain/movement'

// One page of the active cycle. The page that comes back is the last one
// when the asked page no longer exists.
export async function listMovements(page: number) {
  const { data, error } = await api.GET('/api/v1/movements', {
    params: { query: { page } },
  })
  if (error) throw new Error(error.error)
  return data
}

export async function recordMovement(input: MovementInput) {
  const { data, error } = await api.POST('/api/v1/movements', { body: input })
  if (error) throw new Error(error.error)
  return data
}

export async function updateMovement(id: number, input: MovementInput) {
  const { data, error } = await api.PUT('/api/v1/movements/{id}', {
    params: { path: { id } },
    body: input,
  })
  if (error) throw new Error(error.error)
  return data
}

export async function deleteMovement(id: number) {
  const { error } = await api.DELETE('/api/v1/movements/{id}', {
    params: { path: { id } },
  })
  if (error) throw new Error(error.error)
}
