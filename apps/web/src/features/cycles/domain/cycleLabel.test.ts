import { describe, expect, it } from 'vitest'
import { cycleLabel } from './cycleLabel'

describe('cycleLabel', () => {
  it('counts the first day as day 1 and ends the range on the last day', () => {
    const cycle = { starts_on: '2026-09-30', ends_on: '2026-10-30' }
    expect(cycleLabel(cycle, '2026-09-30')).toEqual({
      day: 1,
      length: 30,
      range: 'Sep 30 - Oct 29',
    })
    expect(cycleLabel(cycle, '2026-10-29').day).toBe(30)
  })

  it('crosses a year end', () => {
    const cycle = { starts_on: '2026-12-30', ends_on: '2027-01-30' }
    expect(cycleLabel(cycle, '2027-01-02')).toEqual({
      day: 4,
      length: 31,
      range: 'Dec 30 - Jan 29',
    })
  })

  it('is not shifted by a daylight saving change inside the cycle', () => {
    // Clocks change on 2026-10-25 in Europe and 2026-11-01 in the US.
    const cycle = { starts_on: '2026-10-15', ends_on: '2026-11-15' }
    expect(cycleLabel(cycle, '2026-11-02')).toEqual({
      day: 19,
      length: 31,
      range: 'Oct 15 - Nov 14',
    })
  })

  it('clamps a short month the way the cycle does', () => {
    const cycle = { starts_on: '2027-01-30', ends_on: '2027-02-28' }
    expect(cycleLabel(cycle, '2027-02-27')).toEqual({
      day: 29,
      length: 29,
      range: 'Jan 30 - Feb 27',
    })
  })
})
