import { describe, expect, it } from 'vitest'
import { pageWindow } from './pageWindow'

describe('pageWindow', () => {
  it('starts as 1 2 3, a gap, and the last page', () => {
    expect(pageWindow(1, 8)).toEqual([1, 2, 3, 'gap', 8])
  })

  it('keeps the same three on the second page, so nothing jumps', () => {
    expect(pageWindow(2, 8)).toEqual([1, 2, 3, 'gap', 8])
  })

  it('follows the current page, keeping it in the middle', () => {
    expect(pageWindow(3, 8)).toEqual([2, 3, 4, 'gap', 8])
    expect(pageWindow(5, 8)).toEqual([4, 5, 6, 'gap', 8])
  })

  it('has no gap when no page is left out before the last', () => {
    expect(pageWindow(6, 8)).toEqual([5, 6, 7, 8])
  })

  it('ends on the last three pages', () => {
    expect(pageWindow(7, 8)).toEqual([6, 7, 8])
    expect(pageWindow(8, 8)).toEqual([6, 7, 8])
  })

  it('shows every page when there are four or fewer', () => {
    expect(pageWindow(1, 2)).toEqual([1, 2])
    expect(pageWindow(3, 3)).toEqual([1, 2, 3])
    expect(pageWindow(1, 4)).toEqual([1, 2, 3, 4])
    expect(pageWindow(4, 4)).toEqual([1, 2, 3, 4])
  })

  it('leaves out a single page behind the gap when there are five', () => {
    expect(pageWindow(1, 5)).toEqual([1, 2, 3, 'gap', 5])
    expect(pageWindow(3, 5)).toEqual([2, 3, 4, 5])
    expect(pageWindow(5, 5)).toEqual([3, 4, 5])
  })

  it('always includes the current page and never more than five slots', () => {
    for (let total = 1; total <= 30; total++) {
      for (let page = 1; page <= total; page++) {
        const slots = pageWindow(page, total)
        expect(slots).toContain(page)
        expect(slots.length).toBeLessThanOrEqual(5)
      }
    }
  })
})
