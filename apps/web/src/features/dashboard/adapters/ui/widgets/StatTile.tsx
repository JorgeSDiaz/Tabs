import { amountScale, formatCents } from '../../../../../shared/lib/money'
import { ARROW_IN, ARROW_OUT, Icon } from '../../../../../shared/ui/Icon'
import { visibleMarks } from '../../../domain/waffle'

type Props = {
  label: string
  cents: number
  count: number
  tone: 'in' | 'out'
}

export function StatTile({ label, cents, count, tone }: Props) {
  const { shown, hidden } = visibleMarks(count)
  const amount = formatCents(tone === 'in' ? cents : -cents, { sign: 'always' })
  return (
    <section className={`widget stat-tile ${tone}`}>
      <div className="stat-label">
        <Icon>{tone === 'in' ? ARROW_IN : ARROW_OUT}</Icon>
        <h2>{label}</h2>
        <span className="stat-count">
          {count} {count === 1 ? 'movement' : 'movements'}
        </span>
      </div>
      <p className={`stat-value amount-${amountScale(amount)}`}>{amount}</p>
      {count > 0 && (
        <div className="marks" aria-hidden="true">
          {Array.from({ length: shown }, (_, i) => (
            <span key={i} />
          ))}
          {hidden > 0 && <em>+{hidden}</em>}
        </div>
      )}
    </section>
  )
}
