import type { Category } from './category'

// The fixed set a category's color is chosen from, in the order new
// categories take them, each with the name its swatch is announced by. The
// seeded categories hold the first nine and the last; none of the twelve
// is the chart's neutral gray.
const FIXED: Record<string, string> = {
  '#6b8cff': 'Blue',
  '#f5c451': 'Amber',
  '#ff9f6b': 'Orange',
  '#9accff': 'Sky',
  '#c3aeff': 'Lavender',
  '#ff9bc2': 'Pink',
  '#3ccbb8': 'Teal',
  '#3dbb76': 'Green',
  '#b6e06a': 'Lime',
  '#e58be0': 'Orchid',
  '#d9b38c': 'Sand',
  '#a9ad6f': 'Olive',
}
export const FIXED_COLORS = Object.keys(FIXED)

// The chart's grouped remainder, and the marker of a movement whose
// category is not in the list.
export const NEUTRAL_COLOR = '#8a93a5'

// The icon on a marker: dark on a light color, light on a dark one.
export const INK_ON_LIGHT = 'var(--ink)'
export const INK_ON_DARK = 'var(--text-h)'

// The one place a category's color is read: the chart, the ledger and the
// form all take this map, so they cannot disagree.
export function categoryColors(categories: Category[]): Map<number, string> {
  return new Map(categories.map((c) => [c.id, c.color]))
}

export function colorFor(colors: Map<number, string>, id: number): string {
  return colors.get(id) ?? NEUTRAL_COLOR
}

// What a swatch is called: the fixed color's name, or the code of a
// custom one.
export function colorName(color: string): string {
  return FIXED[color.toLowerCase()] ?? color.toUpperCase()
}

// The color a new category starts with: the fixed color the fewest
// categories use, the earliest of them when several tie.
export function leastUsedColor(categories: Category[]): string {
  const uses = new Map(FIXED_COLORS.map((color) => [color, 0]))
  for (const { color } of categories) {
    const fixed = color.toLowerCase()
    if (uses.has(fixed)) uses.set(fixed, uses.get(fixed)! + 1)
  }
  let least = FIXED_COLORS[0]
  for (const color of FIXED_COLORS) {
    if (uses.get(color)! < uses.get(least)!) least = color
  }
  return least
}

// The colors a category can be given without the free picker: the fixed
// set, then every other color some category uses, in listing order. A
// custom color is a choice for exactly as long as a category holds it.
export function colorChoices(categories: Category[]): string[] {
  const choices = new Set(FIXED_COLORS)
  for (const { color } of categories) choices.add(color.toLowerCase())
  return [...choices]
}

// Relative luminance of a #rrggbb color, as WCAG defines it.
function luminance(color: string): number {
  const channel = (start: number) => {
    const value = parseInt(color.slice(start, start + 2), 16) / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5)
}

// Below this luminance the light ink has the higher contrast with the
// color; at or above it, the dark ink does.
const INK_SWITCH = 0.18

export function inkFor(color: string): string {
  return luminance(color) < INK_SWITCH ? INK_ON_DARK : INK_ON_LIGHT
}
