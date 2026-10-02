import type { WidgetID, WidgetSettings } from './widgets'

export type TileID = 'streak' | WidgetID

export type Tile = {
  id: TileID
  col: 1 | 2
  colSpan: 1 | 2
  row: number
  rowSpan: number
}

// Places the streak panel and the visible widgets on the two-column bento
// (wide column 1, narrow column 2). Tiles come back in catalog order with
// the streak first; no cell of the rows they use is left empty.
export function bentoLayout(settings: WidgetSettings): Tile[] {
  const net = settings['net-balance']
  const totals = (['total-income', 'total-expenses'] as const).filter(
    (id) => settings[id],
  )
  const category = settings['category-distribution']

  const tiles: Tile[] = [
    { id: 'streak', col: 1, colSpan: net ? 1 : 2, row: 1, rowSpan: 1 },
  ]
  if (net) tiles.push({ id: 'net-balance', col: 2, colSpan: 1, row: 1, rowSpan: 1 })

  if (category) {
    // The chart takes the wide column; the totals stack beside it.
    totals.forEach((id, index) =>
      tiles.push({ id, col: 2, colSpan: 1, row: 2 + index, rowSpan: 1 }),
    )
    tiles.push({
      id: 'category-distribution',
      col: 1,
      colSpan: totals.length ? 1 : 2,
      row: 2,
      rowSpan: Math.max(totals.length, 1),
    })
  } else if (totals.length === 2) {
    tiles.push({ id: totals[0], col: 1, colSpan: 1, row: 2, rowSpan: 1 })
    tiles.push({ id: totals[1], col: 2, colSpan: 1, row: 2, rowSpan: 1 })
  } else if (totals.length === 1) {
    tiles.push({ id: totals[0], col: 1, colSpan: 2, row: 2, rowSpan: 1 })
  }
  return tiles
}
