import type { components } from '../../../shared/api/schema'

export type Habit = components['schemas']['Habit']
export type DayStatus = Habit['days'][number]['status']

export function xpByMovement(habit: Habit | null): Map<number, number> {
  return new Map((habit?.movement_xp ?? []).map((m) => [m.movement_id, m.xp]))
}

// Share of the current level already earned, 0 to 1.
export function levelProgress(xp: Habit['xp']): number {
  const span = xp.next_level_at - xp.level_starts_at
  if (span <= 0) return 0
  return Math.min(1, Math.max(0, (xp.total - xp.level_starts_at) / span))
}
