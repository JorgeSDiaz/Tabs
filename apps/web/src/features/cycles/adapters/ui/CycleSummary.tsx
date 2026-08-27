import { formatCents } from '../../../../shared/lib/money'
import type { CurrentCycle } from '../../domain/cycle'

export function CycleSummary({ cycle }: { cycle: CurrentCycle }) {
  const { balance } = cycle
  return (
    <section className="cycle-summary">
      <h2>
        {cycle.starts_on} &rarr; {cycle.ends_on}
      </h2>
      <dl>
        <div>
          <dt>In</dt>
          <dd>{formatCents(balance.total_in)}</dd>
        </div>
        <div>
          <dt>Out</dt>
          <dd>{formatCents(balance.total_out)}</dd>
        </div>
        <div>
          <dt>Net</dt>
          <dd className={balance.net >= 0 ? 'positive' : 'negative'}>
            {formatCents(balance.net)}
          </dd>
        </div>
      </dl>
    </section>
  )
}
