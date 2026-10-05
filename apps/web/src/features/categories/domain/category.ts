import type { components } from '../../../shared/api/schema'

export type Category = components['schemas']['Category']
// A category as it is created: what the user chooses, and its direction.
export type CategoryInput = components['schemas']['CategoryInput']
// What an edit replaces. The direction is not in it: it never changes.
export type CategoryDetails = components['schemas']['CategoryUpdate']

// The icon of a category that has not been given one of its own, and of
// one whose stored icon this version of the app does not draw.
export const GENERIC_ICON = 'tag'

// The dropdown offers only categories belonging to the selected direction.
// The pairing itself is enforced once, by the API's database constraint;
// this filter is the UX mirror of that rule.
export function forDirection(
  categories: Category[],
  direction: Category['direction'],
): Category[] {
  return categories.filter((c) => c.direction === direction)
}
