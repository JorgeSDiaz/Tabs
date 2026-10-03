import { describe, expect, it } from 'vitest'
import { withErrorBody } from './client'

describe('withErrorBody', () => {
  it('leaves an ok response alone', async () => {
    expect(await withErrorBody(Response.json([]))).toBeUndefined()
    expect(await withErrorBody(new Response(null, { status: 204 }))).toBeUndefined()
  })

  it("leaves a failure that carries the API's error body alone", async () => {
    const rejected = Response.json(
      { error: 'amount must be positive' },
      { status: 400 },
    )
    expect(await withErrorBody(rejected)).toBeUndefined()
    // Still readable by the client afterwards.
    expect(await rejected.json()).toEqual({ error: 'amount must be positive' })
  })

  it.each([
    ['an empty body', null],
    ["a proxy's error page", '<html><h1>502 Bad Gateway</h1></html>'],
    ['JSON without an error message', '{"status":"down"}'],
  ])('gives a failure with %s an error body', async (_, body) => {
    const replaced = await withErrorBody(new Response(body, { status: 502 }))
    expect(replaced?.status).toBe(502)
    expect(await replaced?.json()).toEqual({
      error: 'The server could not be reached (502). Try again in a moment.',
    })
  })
})
