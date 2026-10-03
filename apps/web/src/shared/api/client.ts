import createClient from 'openapi-fetch'
import type { paths } from './schema'

// A failed response that does not carry the API's error body (a proxy's 502
// while the API is down) would reach the callers as no error at all. This
// gives it one, so every call's `if (error)` check sees the failure.
export async function withErrorBody(
  response: Response,
): Promise<Response | undefined> {
  if (response.ok) return undefined
  try {
    const body: { error?: unknown } | null = await response.clone().json()
    if (typeof body?.error === 'string') return undefined
  } catch {
    // Not JSON: an empty body, or the proxy's own error page.
  }
  return Response.json(
    {
      error: `The server could not be reached (${response.status}). Try again in a moment.`,
    },
    { status: response.status },
  )
}

export const api = createClient<paths>()

api.use({ onResponse: ({ response }) => withErrorBody(response) })
