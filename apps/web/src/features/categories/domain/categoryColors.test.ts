import { describe, expect, it } from 'vitest'
import type { Category } from './category'
import {
  categoryColors,
  colorChoices,
  colorFor,
  colorName,
  FIXED_COLORS,
  INK_ON_DARK,
  INK_ON_LIGHT,
  inkFor,
  leastUsedColor,
  NEUTRAL_COLOR,
} from './categoryColors'

const withColors = (...colors: string[]): Category[] =>
  colors.map((color, index) => ({
    id: index + 1,
    name: `Category ${index + 1}`,
    direction: 'out',
    color,
    icon: 'tag',
    sort_order: index + 1,
  }))

describe('the fixed set', () => {
  it('holds twelve different colors, none of them the neutral gray', () => {
    expect(FIXED_COLORS).toHaveLength(12)
    expect(new Set(FIXED_COLORS).size).toBe(12)
    expect(FIXED_COLORS).not.toContain(NEUTRAL_COLOR)
  })

  it('is legible with the dark ink throughout', () => {
    for (const color of FIXED_COLORS) expect(inkFor(color)).toBe(INK_ON_LIGHT)
  })
})

describe('categoryColors', () => {
  it('gives every category its own stored color', () => {
    const colors = categoryColors(withColors('#6b8cff', '#123456'))
    expect(colors.get(1)).toBe('#6b8cff')
    expect(colors.get(2)).toBe('#123456')
  })

  it('falls back to neutral for a category that is not listed', () => {
    expect(colorFor(new Map(), 42)).toBe(NEUTRAL_COLOR)
  })
})

describe('leastUsedColor', () => {
  it('starts with the first fixed color', () => {
    expect(leastUsedColor([])).toBe(FIXED_COLORS[0])
  })

  it('takes the first fixed color no category uses', () => {
    const used = FIXED_COLORS.slice(0, 10)
    expect(leastUsedColor(withColors(...used))).toBe(FIXED_COLORS[10])
    // A gap earlier in the set comes before a later one.
    const gapped = FIXED_COLORS.filter((_, index) => index !== 3)
    expect(leastUsedColor(withColors(...gapped))).toBe(FIXED_COLORS[3])
  })

  it('goes back to the start once every color is in use', () => {
    expect(leastUsedColor(withColors(...FIXED_COLORS))).toBe(FIXED_COLORS[0])
    expect(
      leastUsedColor(withColors(...FIXED_COLORS, FIXED_COLORS[0])),
    ).toBe(FIXED_COLORS[1])
  })

  it('breaks a tie toward the earlier color', () => {
    const twice = [...FIXED_COLORS, ...FIXED_COLORS.slice(0, 2)]
    expect(leastUsedColor(withColors(...twice))).toBe(FIXED_COLORS[2])
  })

  it('counts a fixed color whatever its case, and ignores custom ones', () => {
    const categories = withColors(FIXED_COLORS[0].toUpperCase(), '#123456')
    expect(leastUsedColor(categories)).toBe(FIXED_COLORS[1])
  })
})

describe('colorChoices', () => {
  it('offers only the fixed set while no category has a custom color', () => {
    expect(colorChoices(withColors(...FIXED_COLORS.slice(0, 4)))).toEqual(
      FIXED_COLORS,
    )
  })

  it('adds each custom color in use once, after the fixed set', () => {
    const categories = withColors('#123456', FIXED_COLORS[2], '#123456', '#ABCDEF')
    expect(colorChoices(categories)).toEqual([
      ...FIXED_COLORS,
      '#123456',
      '#abcdef',
    ])
  })

  it('drops a custom color once no category uses it', () => {
    expect(colorChoices(withColors(FIXED_COLORS[0]))).not.toContain('#123456')
  })
})

describe('colorName', () => {
  it('names a fixed color and spells out a custom one', () => {
    expect(colorName('#6b8cff')).toBe('Blue')
    expect(colorName('#6B8CFF')).toBe('Blue')
    expect(colorName('#123abc')).toBe('#123ABC')
  })
})

describe('inkFor', () => {
  it('draws light on a dark color and dark on a light one', () => {
    expect(inkFor('#141821')).toBe(INK_ON_DARK)
    expect(inkFor('#000000')).toBe(INK_ON_DARK)
    expect(inkFor('#f5c451')).toBe(INK_ON_LIGHT)
    expect(inkFor('#ffffff')).toBe(INK_ON_LIGHT)
  })
})
