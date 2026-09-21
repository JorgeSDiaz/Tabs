import type { components } from '../../../shared/api/schema'

export type Category = components['schemas']['Category']

// The dropdown offers only categories belonging to the selected direction.
// The pairing itself is enforced once, by the API's database constraint;
// this filter is the UX mirror of that rule.
export function forDirection(
  categories: Category[],
  direction: Category['direction'],
): Category[] {
  return categories.filter((c) => c.direction === direction)
}
