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
import type { Category } from '../../../../categories/domain/category'
import type { Movement } from '../../../../movements/domain/movement'
import { sumByCategory } from '../../../domain/widgets'

const COLORS = { in: '#22c55e', out: '#ef4444' }
const AXIS = '#9ca3af'
const GRID = 'rgba(128, 128, 128, 0.25)'

type Props = {
  movements: Movement[]
  categories: Category[]
}

export function CategoryDistributionWidget({ movements, categories }: Props) {
  const totals = sumByCategory(movements, categories)
  if (totals.length === 0) {
    return (
      <section className="widget">
        <h2>Category distribution</h2>
        <p className="empty">No movements in this cycle yet.</p>
      </section>
    )
  }

  const height = Math.max(160, totals.length * 36)
  return (
    <section className="widget">
      <h2>Category distribution</h2>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={totals}
          layout="vertical"
          margin={{ right: 12 }}
        >
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: AXIS }}
            stroke={GRID}
            tickFormatter={(value: number) => formatCents(value)}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={110}
            tick={{ fill: AXIS }}
            stroke={GRID}
          />
          <Tooltip formatter={(value) => formatCents(Number(value))} />
          <Bar dataKey="totalCents" radius={[0, 4, 4, 0]}>
            {totals.map((total) => (
              <Cell key={total.categoryId} fill={COLORS[total.direction]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </section>
  )
}
