import type { components } from '../../../shared/api/schema'
import type { Category } from '../../categories/domain/category'
import type { Movement } from '../../movements/domain/movement'

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

export type CategoryTotal = {
  categoryId: number
  name: string
  direction: Category['direction']
  totalCents: number
}

// Pure aggregation over the active cycle's movements the dashboard
// already holds: only categories with at least one movement appear,
// grouped with 'in' first, each group ordered by descending amount.
export function sumByCategory(
  movements: Movement[],
  categories: Category[],
): CategoryTotal[] {
  const totals = new Map<number, number>()
  for (const movement of movements) {
    totals.set(
      movement.category_id,
      (totals.get(movement.category_id) ?? 0) + movement.amount_cents,
    )
  }

  const byId = new Map(categories.map((c) => [c.id, c]))
  const out: CategoryTotal[] = []
  for (const [categoryId, totalCents] of totals) {
    const category = byId.get(categoryId)
    if (!category) continue
    out.push({
      categoryId,
      name: category.name,
      direction: category.direction,
      totalCents,
    })
  }

  const rank = { in: 0, out: 1 } as const
  return out.sort(
    (a, b) => rank[a.direction] - rank[b.direction] || b.totalCents - a.totalCents,
  )
}
