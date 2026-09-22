import type { Category } from '../../../categories/domain/category'
import type { CurrentCycle } from '../../../cycles/domain/cycle'
import type { Movement } from '../../../movements/domain/movement'
import {
  WIDGETS,
  type WidgetDefinition,
  type WidgetSettings,
} from '../../domain/widgets'
import { CategoryDistributionWidget } from './widgets/CategoryDistributionWidget'
import { NetBalanceWidget } from './widgets/NetBalanceWidget'
import { StatTile } from './widgets/StatTile'

type Props = {
  ready: boolean
  settings: WidgetSettings | null
  cycle: CurrentCycle | null
  movements: Movement[]
  categories: Category[]
}

export function WidgetSection({ ready, settings, cycle, movements, categories }: Props) {
  // A placeholder until the selection arrives: never flash the default
  // widget set when the saved one differs.
  if (!ready || !settings || !cycle) {
    return <p className="empty">Loading widgets…</p>
  }

  return (
    <>
      {WIDGETS.map((widget) =>
        settings[widget.id] ? (
          <WidgetBody
            key={widget.id}
            widget={widget}
            cycle={cycle}
            movements={movements}
            categories={categories}
          />
        ) : null,
      )}
    </>
  )
}

type BodyProps = {
  widget: WidgetDefinition
  cycle: CurrentCycle
  movements: Movement[]
  categories: Category[]
}

function WidgetBody({ widget, cycle, movements, categories }: BodyProps) {
  switch (widget.id) {
    case 'net-balance':
      return <NetBalanceWidget balance={cycle.balance} />
    case 'total-income':
      return <StatTile label={widget.label} cents={cycle.balance.total_in} tone="in" />
    case 'total-expenses':
      return <StatTile label={widget.label} cents={cycle.balance.total_out} tone="out" />
    case 'category-distribution':
      return (
        <CategoryDistributionWidget movements={movements} categories={categories} />
      )
  }
}
