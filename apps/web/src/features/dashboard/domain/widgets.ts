import type { components } from '../../../shared/api/schema'
import type { Category } from '../../categories/domain/category'
import type { CategoryTotal } from '../../cycles/domain/cycle'

// The id set and the full-map requirement come from the OpenAPI schema,
// so the catalog cannot silently drift from the server enum.
export type WidgetSettings = components['schemas']['WidgetSettings']['widgets']
export type WidgetID = keyof WidgetSettings

export type WidgetDefinition = {
  id: WidgetID
  label: string
}

// The whole catalog, in render order. Enable/disable is the only
// customization this change allows.
export const WIDGETS: WidgetDefinition[] = [
  { id: 'net-balance', label: 'Net balance' },
  { id: 'total-income', label: 'Total income' },
  { id: 'total-expenses', label: 'Total expenses' },
  { id: 'category-distribution', label: 'Category distribution' },
]

export type NamedTotal = CategoryTotal & { name: string }

// The cycle's category totals with the names the chart shows. The server
// sums the whole cycle and orders it ('in' first, each group by descending
// amount); this only adds the name and keeps that order. A total whose
// category is not in the list has no name to show and is left out.
export function nameTotals(
  totals: CategoryTotal[],
  categories: Category[],
): NamedTotal[] {
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const out: NamedTotal[] = []
  for (const total of totals) {
    const name = names.get(total.category_id)
    if (name !== undefined) out.push({ ...total, name })
  }
  return out
}

// How many movements of one direction the cycle holds.
export function movementCount(
  totals: CategoryTotal[],
  direction: CategoryTotal['direction'],
): number {
  return totals
    .filter((total) => total.direction === direction)
    .reduce((sum, total) => sum + total.movement_count, 0)
}
