import { describe, expect, it } from 'vitest'
import { NEUTRAL_COLOR } from '../../categories/domain/categoryColors'
import {
  MAX_MARKS,
  WAFFLE_SQUARES,
  allocateSquares,
  expenseSlices,
  visibleMarks,
} from './waffle'
import type { NamedTotal } from './widgets'

const sum = (values: number[]) => values.reduce((a, b) => a + b, 0)

describe('allocateSquares', () => {
  it('always adds up to 100', () => {
    const cases = [
      [1, 1, 1],
      [1, 1, 1, 1, 1, 1, 1],
      [33, 33, 34],
      [1, 99999],
      [5],
      [17, 23, 41, 7, 12],
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    ]
    for (const values of cases) {
      expect(sum(allocateSquares(values))).toBe(WAFFLE_SQUARES)
    }
  })

  it('gives a third each to equal thirds, the odd square to the first', () => {
    expect(allocateSquares([1, 1, 1])).toEqual([34, 33, 33])
  })

  it('returns zeros when there is nothing to draw', () => {
    expect(allocateSquares([])).toEqual([])
    expect(allocateSquares([0, 0])).toEqual([0, 0])
  })
})

const out = (id: number, cents: number): NamedTotal => ({
  category_id: id,
  name: `Category ${id}`,
  direction: 'out',
  total_cents: cents,
  movement_count: 1,
})

describe('expenseSlices', () => {
  // Each category's own color: the ones drawn alone keep it, whatever
  // their rank; the grouped ones give it up for the neutral color.
  const colors = new Map(
    [1, 2, 3, 4, 5, 6, 7, 9].map((id) => [id, '#00000' + id]),
  )

  it('keeps five categories separate and groups the rest as neutral', () => {
    const slices = expenseSlices(
      [1, 2, 3, 4, 5, 6, 7].map((id) => out(id, 1000 - id)),
      colors,
    )
    expect(slices).toHaveLength(6)
    expect(slices.slice(0, 5).map((s) => s.color)).toEqual([
      '#000001',
      '#000002',
      '#000003',
      '#000004',
      '#000005',
    ])
    const other = slices[5]
    expect(other.color).toBe(NEUTRAL_COLOR)
    expect(other.name).toBe('2 others')
    expect(sum(slices.map((s) => s.squares))).toBe(WAFFLE_SQUARES)
  })

  it('names the categories in the neutral slice, largest first, with their shares', () => {
    const slices = expenseSlices(
      [7, 3, 6, 1, 5, 2, 4].map((id) => out(id, 1000 - id)),
      colors,
    )
    const other = slices[5]
    expect(other.members?.map((m) => m.name)).toEqual([
      'Category 6',
      'Category 7',
    ])
    expect(sum(other.members!.map((m) => m.percent))).toBeCloseTo(
      other.percent,
    )
    for (const slice of slices.slice(0, 5)) {
      expect(slice.members).toBeUndefined()
    }
  })

  it('draws a category in its own color whatever its rank', () => {
    const ranked = (first: number) =>
      expenseSlices([out(first, 900), out(first === 1 ? 2 : 1, 100)], colors)
    expect(ranked(1).find((s) => s.key === '2')?.color).toBe('#000002')
    expect(ranked(2).find((s) => s.key === '2')?.color).toBe('#000002')
  })

  it('ignores income categories', () => {
    const slices = expenseSlices(
      [
        {
          category_id: 9,
          name: 'Salary',
          direction: 'in',
          total_cents: 9999,
          movement_count: 1,
        },
        out(1, 500),
      ],
      colors,
    )
    expect(slices.map((s) => s.name)).toEqual(['Category 1'])
    expect(slices[0].squares).toBe(WAFFLE_SQUARES)
  })

  it('returns no slices when there are no expenses', () => {
    expect(expenseSlices([], colors)).toEqual([])
  })
})

describe('visibleMarks', () => {
  it('draws one mark per movement up to the limit', () => {
    expect(visibleMarks(0)).toEqual({ shown: 0, hidden: 0 })
    expect(visibleMarks(2)).toEqual({ shown: 2, hidden: 0 })
    expect(visibleMarks(39)).toEqual({ shown: 39, hidden: 0 })
    expect(visibleMarks(MAX_MARKS)).toEqual({ shown: 40, hidden: 0 })
  })

  it('reports the remainder beyond the limit', () => {
    expect(visibleMarks(63)).toEqual({ shown: 40, hidden: 23 })
  })
})
