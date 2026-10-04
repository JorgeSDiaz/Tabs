import { describe, expect, it } from 'vitest'
import { firstStartingWith, stepRow } from './listNavigation'

describe('stepRow', () => {
  it('moves one row at a time', () => {
    expect(stepRow('ArrowDown', 0, 4)).toBe(1)
    expect(stepRow('ArrowUp', 2, 4)).toBe(1)
  })

  it('stops at both ends instead of wrapping', () => {
    expect(stepRow('ArrowDown', 3, 4)).toBe(3)
    expect(stepRow('ArrowUp', 0, 4)).toBe(0)
  })

  it('jumps to the first and the last row', () => {
    expect(stepRow('Home', 2, 4)).toBe(0)
    expect(stepRow('End', 1, 4)).toBe(3)
  })

  it('stays on the only row of a single-row list', () => {
    for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
      expect(stepRow(key, 0, 1)).toBe(0)
    }
  })

  it('leaves other keys and an empty list alone', () => {
    expect(stepRow('Enter', 1, 4)).toBeNull()
    expect(stepRow('a', 1, 4)).toBeNull()
    expect(stepRow('ArrowDown', 0, 0)).toBeNull()
  })
})

describe('firstStartingWith', () => {
  const names = ['Housing', 'Groceries', 'Eating out', 'Transport', 'Health']

  it('finds the first name starting with a letter, whatever its case', () => {
    expect(firstStartingWith(names, 't')).toBe(3)
    expect(firstStartingWith(names, 'T')).toBe(3)
    expect(firstStartingWith(names, 'h')).toBe(0)
  })

  it('narrows with a second letter', () => {
    expect(firstStartingWith(names, 'he')).toBe(4)
  })

  it('matches a space inside a name', () => {
    expect(firstStartingWith(names, 'eating o')).toBe(2)
  })

  it('reports no match', () => {
    expect(firstStartingWith(names, 'z')).toBe(-1)
    expect(firstStartingWith(names, 'hx')).toBe(-1)
    expect(firstStartingWith(names, '')).toBe(-1)
  })
})
