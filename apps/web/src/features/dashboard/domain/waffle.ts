import {
  NEUTRAL_COLOR,
  colorFor,
} from '../../categories/domain/categoryColors'
import type { NamedTotal } from './widgets'

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
  // Set only on the neutral group: the categories it holds, largest
  // first, each with its share of all the cycle's expenses.
  members?: { name: string; percent: number }[]
}

// How many categories the chart draws on their own. A rule about the
// chart, not about how many colors there are to give out.
export const OWN_SLICES = 5

// The expense slices of the waffle: the five largest categories are drawn
// in their own color, the rest collapse into one neutral slice that names
// them.
export function expenseSlices(
  totals: NamedTotal[],
  colors: Map<number, string>,
): Slice[] {
  const expenses = totals
    .filter((total) => total.direction === 'out' && total.total_cents > 0)
    .sort(
      (a, b) => b.total_cents - a.total_cents || a.category_id - b.category_id,
    )
  const head = expenses.slice(0, OWN_SLICES)
  const rest = expenses.slice(OWN_SLICES)
  const sum = expenses.reduce((a, total) => a + total.total_cents, 0)
  const share = (cents: number) => (sum === 0 ? 0 : (cents / sum) * 100)

  const slices: Omit<Slice, 'percent' | 'squares'>[] = head.map((total) => ({
    key: String(total.category_id),
    name: total.name,
    color: colorFor(colors, total.category_id),
    totalCents: total.total_cents,
  }))
  if (rest.length > 0) {
    slices.push({
      key: 'other',
      name: `${rest.length} ${rest.length === 1 ? 'other' : 'others'}`,
      color: NEUTRAL_COLOR,
      totalCents: rest.reduce((a, total) => a + total.total_cents, 0),
      members: rest.map((total) => ({
        name: total.name,
        percent: share(total.total_cents),
      })),
    })
  }

  const squares = allocateSquares(slices.map((s) => s.totalCents))
  return slices.map((slice, i) => ({
    ...slice,
    percent: share(slice.totalCents),
    squares: squares[i],
  }))
}

export const MAX_MARKS = 40

// How many one-per-movement marks fit, and how many are left undrawn.
export function visibleMarks(count: number): { shown: number; hidden: number } {
  const shown = Math.min(Math.max(count, 0), MAX_MARKS)
  return { shown, hidden: Math.max(count, 0) - shown }
}
