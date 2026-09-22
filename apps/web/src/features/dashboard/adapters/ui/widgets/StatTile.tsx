import { formatCents } from '../../../../../shared/lib/money'

type Props = {
  label: string
  cents: number
  tone: 'in' | 'out'
}

export function StatTile({ label, cents, tone }: Props) {
  return (
    <section className="widget stat-tile">
      <h2>{label}</h2>
      <p className={`stat-value ${tone}`}>{formatCents(cents)}</p>
    </section>
  )
}
