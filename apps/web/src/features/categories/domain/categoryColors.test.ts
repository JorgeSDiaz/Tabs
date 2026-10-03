import { describe, expect, it } from 'vitest'
import {
  categoryColors,
  colorFor,
  EXPENSE_PALETTE,
  INCOME_COLOR,
  NEUTRAL_COLOR,
} from './categoryColors'

const out = (id: number, cents: number) => ({
  category_id: id,
  direction: 'out' as const,
  total_cents: cents,
})

describe('categoryColors', () => {
  it('gives the top five expense categories palette slots in rank order', () => {
    const colors = categoryColors([
      out(1, 100),
      out(2, 500),
      out(3, 300),
      out(4, 400),
      out(5, 200),
    ])
    expect(colors.get(2)).toBe(EXPENSE_PALETTE[0])
    expect(colors.get(4)).toBe(EXPENSE_PALETTE[1])
    expect(colors.get(3)).toBe(EXPENSE_PALETTE[2])
    expect(colors.get(5)).toBe(EXPENSE_PALETTE[3])
    expect(colors.get(1)).toBe(EXPENSE_PALETTE[4])
  })

  it('groups every category beyond the fifth under the neutral color', () => {
    const colors = categoryColors([
      out(1, 600),
      out(2, 500),
      out(3, 400),
      out(4, 300),
      out(5, 200),
      out(6, 100),
      out(7, 50),
    ])
    expect(colors.get(6)).toBe(NEUTRAL_COLOR)
    expect(colors.get(7)).toBe(NEUTRAL_COLOR)
    expect(colors.get(5)).toBe(EXPENSE_PALETTE[4])
  })

  it('colors income categories with the income color, outside the ranking', () => {
    const colors = categoryColors([
      { category_id: 9, direction: 'in', total_cents: 999999 },
      out(1, 100),
    ])
    expect(colors.get(9)).toBe(INCOME_COLOR)
    expect(colors.get(1)).toBe(EXPENSE_PALETTE[0])
  })

  it('breaks ties by category id so colors are stable', () => {
    const colors = categoryColors([out(8, 100), out(3, 100)])
    expect(colors.get(3)).toBe(EXPENSE_PALETTE[0])
    expect(colors.get(8)).toBe(EXPENSE_PALETTE[1])
  })

  it('falls back to neutral for a category with no movements', () => {
    expect(colorFor(new Map(), 42)).toBe(NEUTRAL_COLOR)
  })
})
