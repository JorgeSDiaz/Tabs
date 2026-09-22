import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { formatCents } from '../../../../../shared/lib/money'
import type { Balance } from '../../../../cycles/domain/cycle'

// Fixed hex colors rather than theme variables: recharts paints SVG
// presentation attributes, and these read fine on both themes.
const COLORS = { in: '#22c55e', out: '#ef4444', net: '#a78bfa' }
const AXIS = '#9ca3af'
const GRID = 'rgba(128, 128, 128, 0.25)'

export function NetBalanceWidget({ balance }: { balance: Balance }) {
  const rows = [
    { label: 'In', value: balance.total_in, color: COLORS.in },
    { label: 'Out', value: balance.total_out, color: COLORS.out },
    { label: 'Net', value: balance.net, color: COLORS.net },
  ]
  return (
    <section className="widget">
      <h2>Net balance</h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={rows}>
          <CartesianGrid stroke={GRID} vertical={false} />
          <XAxis dataKey="label" tick={{ fill: AXIS }} stroke={GRID} />
          <YAxis
            width={72}
            tick={{ fill: AXIS }}
            stroke={GRID}
            tickFormatter={(value: number) => formatCents(value)}
          />
          <Tooltip formatter={(value) => formatCents(Number(value))} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]}>
            {rows.map((row) => (
              <Cell key={row.label} fill={row.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
