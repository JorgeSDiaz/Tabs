import type { Category } from './category'

// Slots handed to the five largest expense categories, in rank order.
export const EXPENSE_PALETTE = [
  '#6B8CFF',
  '#F5C451',
  '#C3AEFF',
  '#3CCBB8',
  '#9ACCFF',
]
export const NEUTRAL_COLOR = '#8A93A5'
export const INCOME_COLOR = 'var(--leaf)'

export type ColorInput = {
  categoryId: number
  direction: Category['direction']
  totalCents: number
}

// The one place a category gets its color: the waffle chart and the
// ledger both read this map, so they cannot disagree.
export function categoryColors(totals: ColorInput[]): Map<number, string> {
  const colors = new Map<number, string>()
  const expenses = totals
    .filter((total) => total.direction === 'out')
    .sort((a, b) => b.totalCents - a.totalCents || a.categoryId - b.categoryId)
  expenses.forEach((total, rank) => {
    colors.set(total.categoryId, EXPENSE_PALETTE[rank] ?? NEUTRAL_COLOR)
  })
  for (const total of totals) {
    if (total.direction === 'in') colors.set(total.categoryId, INCOME_COLOR)
  }
  return colors
}

// A category with no movement this cycle is not in the map; it is never
// drawn in the chart, so the neutral color is only a safe default.
export function colorFor(colors: Map<number, string>, id: number): string {
  return colors.get(id) ?? NEUTRAL_COLOR
}
