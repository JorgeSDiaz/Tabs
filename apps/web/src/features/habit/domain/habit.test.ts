import { describe, expect, it } from 'vitest'
import { levelProgress, xpByMovement, type Habit } from './habit'

const xp = (total: number, start: number, next: number): Habit['xp'] => ({
  total,
  level: 1,
  level_starts_at: start,
  next_level_at: next,
})

describe('levelProgress', () => {
  it('is the share of the current level earned', () => {
    expect(levelProgress(xp(1265, 1250, 1500))).toBeCloseTo(0.06)
    expect(levelProgress(xp(0, 0, 250))).toBe(0)
    expect(levelProgress(xp(250, 250, 500))).toBe(0)
  })

  it('stays within 0 and 1', () => {
    expect(levelProgress(xp(600, 250, 500))).toBe(1)
    expect(levelProgress(xp(1, 5, 5))).toBe(0)
  })
})

describe('xpByMovement', () => {
  it('maps movement id to XP and tolerates no habit', () => {
    const habit = { movement_xp: [{ movement_id: 7, xp: 25 }] } as Habit
    expect(xpByMovement(habit).get(7)).toBe(25)
    expect(xpByMovement(null).size).toBe(0)
  })
})
