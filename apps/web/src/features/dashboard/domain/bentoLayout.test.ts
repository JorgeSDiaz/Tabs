import { describe, expect, it } from 'vitest'
import { bentoLayout, type Tile } from './bentoLayout'
import { WIDGETS, type WidgetSettings } from './widgets'

const ORDER = ['streak', ...WIDGETS.map((w) => w.id)]

function settingsFor(mask: number): WidgetSettings {
  return Object.fromEntries(
    WIDGETS.map((w, bit) => [w.id, Boolean(mask & (1 << bit))]),
  ) as WidgetSettings
}

const ALL = Array.from({ length: 16 }, (_, mask) => settingsFor(mask))

// How many tiles cover each cell of the rows in use.
function coverage(tiles: Tile[]): number[] {
  const rows = Math.max(...tiles.map((t) => t.row + t.rowSpan - 1))
  const cells = Array.from({ length: rows * 2 }, () => 0)
  for (const t of tiles)
    for (let r = t.row; r < t.row + t.rowSpan; r++)
      for (let c = t.col; c < t.col + t.colSpan; c++)
        cells[(r - 1) * 2 + (c - 1)] += 1
  return cells
}

const place = (tiles: Tile[], id: string) => {
  const t = tiles.find((tile) => tile.id === id)
  return t && [t.col, t.colSpan, t.row, t.rowSpan]
}

describe('bentoLayout', () => {
  it.each(ALL)('fills every cell exactly once for %j', (settings) => {
    expect(coverage(bentoLayout(settings)).every((n) => n === 1)).toBe(true)
  })

  it.each(ALL)('shows the streak and exactly the enabled widgets for %j', (settings) => {
    const ids = bentoLayout(settings).map((t) => t.id)
    const enabled = WIDGETS.filter((w) => settings[w.id]).map((w) => w.id)
    expect(ids).toEqual(['streak', ...enabled])
  })

  it.each(ALL)('keeps catalog order for %j', (settings) => {
    const ids = bentoLayout(settings).map((t) => t.id)
    expect(ids).toEqual([...ids].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b)))
  })

  it('puts the streak beside net balance and the chart beside stacked totals', () => {
    const tiles = bentoLayout(settingsFor(0b1111))
    expect(place(tiles, 'streak')).toEqual([1, 1, 1, 1])
    expect(place(tiles, 'net-balance')).toEqual([2, 1, 1, 1])
    expect(place(tiles, 'category-distribution')).toEqual([1, 1, 2, 2])
    expect(place(tiles, 'total-income')).toEqual([2, 1, 2, 1])
    expect(place(tiles, 'total-expenses')).toEqual([2, 1, 3, 1])
  })

  it('lets the streak span both columns when net balance is hidden', () => {
    expect(place(bentoLayout(settingsFor(0)), 'streak')).toEqual([1, 2, 1, 1])
  })

  it('lets the chart span both columns without totals', () => {
    const tiles = bentoLayout(settingsFor(0b1000))
    expect(place(tiles, 'category-distribution')).toEqual([1, 2, 2, 1])
  })

  it('puts the totals side by side without the chart, or one across', () => {
    const both = bentoLayout(settingsFor(0b0110))
    expect(place(both, 'total-income')).toEqual([1, 1, 2, 1])
    expect(place(both, 'total-expenses')).toEqual([2, 1, 2, 1])
    const one = bentoLayout(settingsFor(0b0100))
    expect(place(one, 'total-expenses')).toEqual([1, 2, 2, 1])
  })
})
