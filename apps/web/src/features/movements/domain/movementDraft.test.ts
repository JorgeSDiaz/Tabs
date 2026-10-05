import { describe, expect, it } from 'vitest'
import type { Category } from '../../categories/domain/category'
import type { Movement } from './movement'
import { resolveCategoryId, toDraft, toInput } from './movementDraft'
import type { MovementDraft } from './movementDraft'

const categories: Category[] = [
  { id: 1, name: 'Salary', direction: 'in', color: '#6b8cff', icon: 'tag', sort_order: 1 },
  { id: 2, name: 'Gift', direction: 'in', color: '#6b8cff', icon: 'tag', sort_order: 2 },
  { id: 3, name: 'Housing', direction: 'out', color: '#6b8cff', icon: 'tag', sort_order: 3 },
  { id: 4, name: 'Groceries', direction: 'out', color: '#6b8cff', icon: 'tag', sort_order: 4 },
]

const draft: MovementDraft = {
  amount: '184300',
  direction: 'out',
  categoryId: 4,
  date: '2026-09-28',
  note: 'Supermarket run',
}

describe('resolveCategoryId', () => {
  it('keeps a category of the draft direction', () => {
    expect(resolveCategoryId(draft, categories)).toBe(4)
  })

  it('takes the first category of the direction when none is chosen', () => {
    expect(resolveCategoryId({ ...draft, categoryId: '' }, categories)).toBe(3)
    expect(
      resolveCategoryId({ ...draft, direction: 'in', categoryId: '' }, categories),
    ).toBe(1)
  })

  it('replaces a category of the other direction', () => {
    expect(resolveCategoryId({ ...draft, direction: 'in' }, categories)).toBe(1)
  })

  it('replaces a category that is no longer listed', () => {
    expect(resolveCategoryId({ ...draft, categoryId: 99 }, categories)).toBe(3)
  })

  it('stays empty while there are no categories', () => {
    expect(resolveCategoryId(draft, [])).toBe('')
  })
})

describe('toInput', () => {
  it('turns a valid draft into the input the API takes', () => {
    expect(toInput(draft, categories)).toEqual({
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
    expect(toInput({ ...draft, amount }, categories)).toEqual({
      ok: false,
      message: 'Amount must be a positive number',
    })
  })

  it('sends the first category of the direction when none is chosen', () => {
    const result = toInput({ ...draft, categoryId: '' }, categories)
    expect(result.ok && result.input.category_id).toBe(3)
  })

  it('refuses a draft while there are no categories', () => {
    expect(toInput(draft, [])).toEqual({
      ok: false,
      message: 'Pick a category',
    })
  })

  it('names the amount first when both are wrong', () => {
    expect(toInput({ ...draft, amount: '' }, [])).toEqual({
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
    const result = toInput({ ...draft, amount }, categories)
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
    expect(toDraft({ ...movement, amount_cents: 1050 }).amount).toBe('10.50')
  })

  it('round-trips a movement back to the same input', () => {
    for (const amount_cents of [18430000, 1999, 1, 1050]) {
      const result = toInput(toDraft({ ...movement, amount_cents }), categories)
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
