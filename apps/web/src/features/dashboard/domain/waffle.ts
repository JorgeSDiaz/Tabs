import {
  EXPENSE_PALETTE,
  NEUTRAL_COLOR,
  colorFor,
} from '../../categories/domain/categoryColors'
import type { CategoryTotal } from './widgets'

export const WAFFLE_SQUARES = 100

// Largest-remainder rounding: every value gets its floored share of the
// 100 squares, then the leftover squares go to the largest fractions, so
// the total is always exactly 100 (or 0 when there is nothing to draw).
export function allocateSquares(values: number[]): number[] {
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum <= 0) return values.map(() => 0)
  const exact = values.map((v) => (v / sum) * WAFFLE_SQUARES)
  const squares = exact.map(Math.floor)
  let leftover = WAFFLE_SQUARES - squares.reduce((a, b) => a + b, 0)
  const byFraction = exact
    .map((e, index) => ({ index, fraction: e - Math.floor(e) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index)
  for (const { index } of byFraction) {
    if (leftover === 0) break
    squares[index] += 1
    leftover -= 1
  }
  return squares
}

export type Slice = {
  key: string
  name: string
  color: string
  totalCents: number
  percent: number
  squares: number
  // Set only on the neutral group: how many categories it holds.
  grouped?: number
}

// The expense slices of the waffle: the five largest categories keep
// their own color, the rest collapse into one neutral slice.
export function expenseSlices(
  totals: CategoryTotal[],
  colors: Map<number, string>,
): Slice[] {
  const expenses = totals
    .filter((total) => total.direction === 'out' && total.totalCents > 0)
    .sort((a, b) => b.totalCents - a.totalCents || a.categoryId - b.categoryId)
  const head = expenses.slice(0, EXPENSE_PALETTE.length)
  const rest = expenses.slice(EXPENSE_PALETTE.length)

  const slices: Omit<Slice, 'percent' | 'squares'>[] = head.map((total) => ({
    key: String(total.categoryId),
    name: total.name,
    color: colorFor(colors, total.categoryId),
    totalCents: total.totalCents,
  }))
  if (rest.length > 0) {
    slices.push({
      key: 'other',
      name: `${rest.length} ${rest.length === 1 ? 'other' : 'others'}`,
      color: NEUTRAL_COLOR,
      totalCents: rest.reduce((sum, total) => sum + total.totalCents, 0),
      grouped: rest.length,
    })
  }

  const sum = slices.reduce((a, s) => a + s.totalCents, 0)
  const squares = allocateSquares(slices.map((s) => s.totalCents))
  return slices.map((slice, i) => ({
    ...slice,
    percent: sum === 0 ? 0 : (slice.totalCents / sum) * 100,
    squares: squares[i],
  }))
}

export const MAX_MARKS = 40

// How many one-per-movement marks fit, and how many are left undrawn.
export function visibleMarks(count: number): { shown: number; hidden: number } {
  const shown = Math.min(Math.max(count, 0), MAX_MARKS)
  return { shown, hidden: Math.max(count, 0) - shown }
}
