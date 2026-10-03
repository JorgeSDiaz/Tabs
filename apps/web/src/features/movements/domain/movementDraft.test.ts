import { describe, expect, it } from 'vitest'
import type { Movement } from './movement'
import { toDraft, toInput } from './movementDraft'
import type { MovementDraft } from './movementDraft'

const draft: MovementDraft = {
  amount: '184300',
  direction: 'out',
  categoryId: 4,
  date: '2026-09-28',
  note: 'Supermarket run',
}

describe('toInput', () => {
  it('turns a valid draft into the input the API takes', () => {
    expect(toInput(draft)).toEqual({
      ok: true,
      input: {
        amount_cents: 18430000,
        direction: 'out',
        category_id: 4,
        occurred_on: '2026-09-28',
        note: 'Supermarket run',
      },
    })
  })

  it.each([
    ['blank', ''],
    ['zero', '0'],
    ['negative', '-12.50'],
  ])('refuses a %s amount', (_, amount) => {
    expect(toInput({ ...draft, amount })).toEqual({
      ok: false,
      message: 'Amount must be a positive number',
    })
  })

  it('refuses an unselected category', () => {
    expect(toInput({ ...draft, categoryId: '' })).toEqual({
      ok: false,
      message: 'Pick a category',
    })
  })

  it('names the amount first when both are wrong', () => {
    expect(toInput({ ...draft, amount: '', categoryId: '' })).toEqual({
      ok: false,
      message: 'Amount must be a positive number',
    })
  })

  // 0.29 * 100 and 1.15 * 100 both land just under the whole cent.
  it.each([
    ['19.99', 1999],
    ['0.29', 29],
    ['1.15', 115],
  ])('rounds %s to %i cents', (amount, cents) => {
    const result = toInput({ ...draft, amount })
    expect(result.ok && result.input.amount_cents).toBe(cents)
  })
})

describe('toDraft', () => {
  const movement: Movement = {
    id: 7,
    amount_cents: 18430000,
    direction: 'out',
    category_id: 4,
    occurred_on: '2026-09-28',
    note: 'Supermarket run',
    created_at: '2026-09-16T09:00:00Z',
  }

  it('shows the amount as the user would type it', () => {
    expect(toDraft(movement)).toEqual(draft)
    expect(toDraft({ ...movement, amount_cents: 1050 }).amount).toBe('10.5')
  })

  it('round-trips a movement back to the same input', () => {
    for (const amount_cents of [18430000, 1999, 1, 1050]) {
      const result = toInput(toDraft({ ...movement, amount_cents }))
      expect(result).toEqual({
        ok: true,
        input: {
          amount_cents,
          direction: 'out',
          category_id: 4,
          occurred_on: '2026-09-28',
          note: 'Supermarket run',
        },
      })
    }
  })
})
