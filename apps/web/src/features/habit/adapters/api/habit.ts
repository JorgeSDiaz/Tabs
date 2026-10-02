import { api } from '../../../../shared/api/client'

export async function getHabit() {
  const { data, error } = await api.GET('/api/v1/habit')
  // A failure with no JSON body (API down behind the proxy) has no
  // `error` object, so key off the missing data instead.
  if (!data) throw new Error(error?.error || 'The habit could not be loaded')
  return data
}

