import type { CSSProperties, ReactNode } from 'react'
import type { Category } from '../../../categories/domain/category'
import type { CurrentCycle } from '../../../cycles/domain/cycle'
import { bentoLayout, type Tile } from '../../domain/bentoLayout'
import {
  WIDGETS,
  movementCount,
  type WidgetID,
  type WidgetSettings,
} from '../../domain/widgets'
import { CategoryDistributionWidget } from './widgets/CategoryDistributionWidget'
import { NetBalanceWidget } from './widgets/NetBalanceWidget'
import { StatTile } from './widgets/StatTile'

type Props = {
  // The logging streak panel: always the first tile, whatever the widgets do.
  streak: ReactNode
  ready: boolean
  settings: WidgetSettings | null
  cycle: CurrentCycle | null
  categories: Category[]
  colors: Map<number, string>
  dataError: string | null
  // Why the widgets cannot be shown at all, when they cannot.
  unavailable: string | null
}

const LABELS = new Map(WIDGETS.map((widget) => [widget.id, widget.label]))

// Placement goes through custom properties so the stylesheet can drop it
// below the wide breakpoint, where every tile takes the full width.
function placement(tile: Tile): CSSProperties {
  return {
    '--col': `${tile.col} / span ${tile.colSpan}`,
    '--row': `${tile.row} / span ${tile.rowSpan}`,
  } as CSSProperties
}

export function WidgetSection({
  streak,
  ready,
  settings,
  cycle,
  categories,
  colors,
  dataError,
  unavailable,
}: Props) {
  // A placeholder until the selection arrives: never flash the default
  // widget set when the saved one differs.
  if (unavailable || !ready || !settings || !cycle) {
    return (
      <section className="bento" aria-label="Insights">
        <div className="bento-full">{streak}</div>
        {unavailable ? (
          <p className="empty bento-full">{unavailable}</p>
        ) : (
          <div className="loading-state bento-full" role="status">
            Loading your insights…
          </div>
        )}
      </section>
    )
  }

  const tiles = bentoLayout(settings)
  return (
    <section className="bento" aria-label="Insights">
      {tiles.map((tile) => (
        <div key={tile.id} className="bento-tile" style={placement(tile)}>
          {tile.id === 'streak' ? (
            streak
          ) : tile.id === 'category-distribution' && dataError ? (
            <p className="error">
              Category distribution is unavailable: {dataError}
            </p>
          ) : (
            <WidgetBody
              id={tile.id}
              cycle={cycle}
              categories={categories}
              colors={colors}
            />
          )}
        </div>
      ))}
      {tiles.length === 1 && (
        <p className="insights-hidden bento-full">
          A little less on your dashboard. Restore insights with Customize.
        </p>
      )}
    </section>
  )
}

type BodyProps = {
  id: WidgetID
  cycle: CurrentCycle
  categories: Category[]
  colors: Map<number, string>
}

function WidgetBody({ id, cycle, categories, colors }: BodyProps) {
  switch (id) {
    case 'net-balance':
      return <NetBalanceWidget balance={cycle.balance} />
    case 'total-income':
      return (
        <StatTile
          label={LABELS.get(id) ?? ''}
          cents={cycle.balance.total_in}
          count={movementCount(cycle.category_totals, 'in')}
          tone="in"
        />
      )
    case 'total-expenses':
      return (
        <StatTile
          label={LABELS.get(id) ?? ''}
          cents={cycle.balance.total_out}
          count={movementCount(cycle.category_totals, 'out')}
          tone="out"
        />
      )
    case 'category-distribution':
      return (
        <CategoryDistributionWidget
          totals={cycle.category_totals}
          categories={categories}
          colors={colors}
        />
      )
  }
}
