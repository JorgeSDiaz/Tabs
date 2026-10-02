import { describe, expect, it } from 'vitest'
import { addDays, addMonths, calendarMonth } from './calendarMonth'

describe('calendarMonth', () => {
  it('starts on the 1st when the month starts on a Monday', () => {
    const cells = calendarMonth(2026, 6)
    expect(cells).toHaveLength(42)
    expect(cells[0]).toEqual({ date: '2026-06-01', day: 1, inMonth: true })
    expect(cells[29]).toEqual({ date: '2026-06-30', day: 30, inMonth: true })
    expect(cells[30]).toEqual({ date: '2026-07-01', day: 1, inMonth: false })
    expect(cells[41].date).toBe('2026-07-12')
  })

  it('leads with six days when the month starts on a Sunday', () => {
    const cells = calendarMonth(2026, 2)
    expect(cells[0]).toEqual({ date: '2026-01-26', day: 26, inMonth: false })
    expect(cells[6]).toEqual({ date: '2026-02-01', day: 1, inMonth: true })
    expect(cells[41].date).toBe('2026-03-08')
  })

  it('gives February 29 days in a leap year', () => {
    const cells = calendarMonth(2028, 2)
    expect(cells.filter((cell) => cell.inMonth)).toHaveLength(29)
    expect(cells[0].date).toBe('2028-01-31')
    expect(cells[29]).toEqual({ date: '2028-02-29', day: 29, inMonth: true })
    expect(cells[30]).toEqual({ date: '2028-03-01', day: 1, inMonth: false })
  })

  it('rolls December over into January of the next year', () => {
    const cells = calendarMonth(2026, 12)
    expect(cells[0]).toEqual({ date: '2026-11-30', day: 30, inMonth: false })
    expect(cells[31]).toEqual({ date: '2026-12-31', day: 31, inMonth: true })
    expect(cells[32]).toEqual({ date: '2027-01-01', day: 1, inMonth: false })
    expect(cells[41].date).toBe('2027-01-10')
  })
})

describe('addDays', () => {
  it('crosses month and year edges', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01')
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30')
    expect(addDays('2026-12-28', 7)).toBe('2027-01-04')
    expect(addDays('2027-01-04', -7)).toBe('2026-12-28')
  })
})

describe('addMonths', () => {
  it('keeps the day when the month has it', () => {
    expect(addMonths('2026-09-16', 1)).toBe('2026-10-16')
    expect(addMonths('2026-01-16', -1)).toBe('2025-12-16')
  })

  it('stops at the last day of a shorter month', () => {
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2028-03-31', -1)).toBe('2028-02-29')
    expect(addMonths('2026-10-31', 1)).toBe('2026-11-30')
  })
})
