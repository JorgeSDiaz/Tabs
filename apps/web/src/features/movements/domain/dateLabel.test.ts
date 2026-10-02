import { describe, expect, it } from 'vitest'
import { dayLabel, fieldLabel, monthLabel } from './dateLabel'

describe('fieldLabel', () => {
  it('reads "Today" when the date is today', () => {
    expect(fieldLabel('2026-09-16', '2026-09-16')).toBe('Today')
  })

  it('names yesterday by weekday, month and day', () => {
    expect(fieldLabel('2026-09-15', '2026-09-16')).toBe('Tue, Sep 15')
  })

  it('names a date in another year the same way, without the year', () => {
    expect(fieldLabel('2025-12-31', '2026-09-16')).toBe('Wed, Dec 31')
  })
})

describe('dayLabel', () => {
  it('announces the full date', () => {
    expect(dayLabel('2026-09-14', '2026-09-16')).toBe(
      'Monday, September 14, 2026',
    )
  })

  it('says that today is today', () => {
    expect(dayLabel('2026-09-16', '2026-09-16')).toBe(
      'Wednesday, September 16, 2026, today',
    )
  })
})

describe('monthLabel', () => {
  it('titles the month with its year', () => {
    expect(monthLabel('2026-09-16')).toBe('September 2026')
    expect(monthLabel('2027-01-01')).toBe('January 2027')
  })
})
