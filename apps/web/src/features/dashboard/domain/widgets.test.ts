import { describe, expect, it } from 'vitest'
import type { Category } from '../../categories/domain/category'
import type { CategoryTotal } from '../../cycles/domain/cycle'
import { movementCount, nameTotals } from './widgets'

const categories: Category[] = [
  { id: 1, name: 'Salary', direction: 'in', color: '#6b8cff', icon: 'tag', sort_order: 1 },
  { id: 3, name: 'Housing', direction: 'out', color: '#6b8cff', icon: 'tag', sort_order: 3 },
  { id: 4, name: 'Groceries', direction: 'out', color: '#6b8cff', icon: 'tag', sort_order: 4 },
]

// As the server orders them: in first, then by descending total.
const totals: CategoryTotal[] = [
  { category_id: 1, direction: 'in', total_cents: 500000, movement_count: 1 },
  { category_id: 4, direction: 'out', total_cents: 60000, movement_count: 3 },
  { category_id: 3, direction: 'out', total_cents: 1500, movement_count: 2 },
]

describe('nameTotals', () => {
  it('adds each category name and keeps the total and the count', () => {
    expect(nameTotals(totals, categories)).toEqual([
      { ...totals[0], name: 'Salary' },
      { ...totals[1], name: 'Groceries' },
      { ...totals[2], name: 'Housing' },
    ])
  })

  it('keeps the order it was given, not the order of the categories', () => {
    const reversed = [...totals].reverse()
    expect(nameTotals(reversed, categories).map((t) => t.name)).toEqual([
      'Housing',
      'Groceries',
      'Salary',
    ])
  })

  it('leaves out a total whose category is not in the list', () => {
    const withUnknown: CategoryTotal[] = [
      ...totals,
      { category_id: 99, direction: 'out', total_cents: 700, movement_count: 1 },
    ]
    expect(nameTotals(withUnknown, categories).map((t) => t.category_id)).toEqual([
      1, 4, 3,
    ])
  })

  it('has nothing to name in an empty cycle', () => {
    expect(nameTotals([], categories)).toEqual([])
  })
})

describe('movementCount', () => {
  it('adds up the movements of one direction', () => {
    expect(movementCount(totals, 'in')).toBe(1)
    expect(movementCount(totals, 'out')).toBe(5)
  })

  it('counts a total even when its category is not in the list', () => {
    const withUnknown: CategoryTotal[] = [
      ...totals,
      { category_id: 99, direction: 'out', total_cents: 700, movement_count: 4 },
    ]
    expect(movementCount(withUnknown, 'out')).toBe(9)
  })

  it('is zero for an empty cycle', () => {
    expect(movementCount([], 'in')).toBe(0)
    expect(movementCount([], 'out')).toBe(0)
  })
})
