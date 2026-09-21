import type { components } from '../../../shared/api/schema'

export type Category = components['schemas']['Category']

// The one place the in/out category priority rule lives. Names match the
// seeded set (001_category.sql); rename categories only by editing here.
const IN_PRIORITY = ['Income']
const OUT_PRIORITY = ['Groceries', 'Eating out', 'Transport', 'Housing', 'Subscriptions']

// Priority categories first, in their list order; the rest keep server order.
export function orderedForDirection(
  categories: Category[],
  direction: 'in' | 'out',
): Category[] {
  const priority = direction === 'in' ? IN_PRIORITY : OUT_PRIORITY
  const leading: Category[] = []
  for (const name of priority) {
    const found = categories.find((c) => c.name === name)
    if (found) leading.push(found)
  }
  const rest = categories.filter((c) => !leading.includes(c))
  return [...leading, ...rest]
}
