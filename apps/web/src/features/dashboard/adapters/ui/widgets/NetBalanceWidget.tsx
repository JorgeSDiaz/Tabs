import { amountScale, formatCents } from '../../../../../shared/lib/money'
import type { Balance } from '../../../../cycles/domain/cycle'

export function NetBalanceWidget({ balance }: { balance: Balance }) {
  const { total_in, total_out, net } = balance
  // Out as a share of what came in; kept is the rest, never below zero.
  const hasIncome = total_in > 0
  const outPercent = hasIncome ? Math.round((total_out / total_in) * 100) : 0
  const keptPercent = hasIncome ? Math.max(0, 100 - outPercent) : 0
  const outWidth = Math.min(outPercent, 100)
  const figure = formatCents(net)

  return (
    <section className="widget net-widget">
      <h2>Net balance</h2>
      <p
        className={`net-figure amount-${amountScale(figure)} ${net < 0 ? 'negative' : ''}`}
      >
        {figure}
      </p>
      {hasIncome ? (
        <>
          <div className="split-bar" aria-hidden="true">
            <span className="split-out" style={{ width: `${outWidth}%` }} />
            <span
              className="split-kept"
              style={{ width: `${100 - outWidth}%` }}
            />
          </div>
          <p className="split-labels">
            <span className="out">{outPercent}% went out</span>
            <span className="in">{keptPercent}% kept</span>
          </p>
        </>
      ) : (
        <p className="split-labels">
          <span>
            {total_out > 0
              ? 'Nothing came in yet this cycle.'
              : 'Nothing recorded yet this cycle.'}
          </span>
        </p>
      )}
      <p className="net-line">
        In <span className="money">{formatCents(total_in)}</span>, out{' '}
        <span className="money">{formatCents(total_out)}</span>
      </p>
    </section>
  )
}
