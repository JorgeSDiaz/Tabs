import { formatCents } from '../../../../../shared/lib/money'
import type { Category } from '../../../../categories/domain/category'
import { INCOME_COLOR } from '../../../../categories/domain/categoryColors'
import type { Movement } from '../../../../movements/domain/movement'
import { expenseSlices } from '../../../domain/waffle'
import { sumByCategory } from '../../../domain/widgets'

type Props = {
  movements: Movement[]
  categories: Category[]
  colors: Map<number, string>
}

const percent = (value: number) => `${value.toFixed(1)}%`

export function CategoryDistributionWidget({
  movements,
  categories,
  colors,
}: Props) {
  const totals = sumByCategory(movements, categories)
  const slices = expenseSlices(totals, colors)
  const income = totals.filter((total) => total.direction === 'in')

  // Filled column by column so each category is one contiguous block.
  const squares = slices.flatMap((slice) =>
    Array.from({ length: slice.squares }, () => slice.color),
  )
  const label = `Expense distribution: ${slices
    .map((slice) => `${slice.name} ${percent(slice.percent)}`)
    .join(', ')}`

  return (
    <section className="widget distribution-widget">
      <div className="distribution-heading">
        <h2>Category distribution</h2>
        <span className="meta-label">
          {totals.length} active{' '}
          {totals.length === 1 ? 'category' : 'categories'}
        </span>
      </div>
      {totals.length === 0 ? (
        <div className="empty">
          <h3>A fresh start.</h3>
          <p>Record your first movement above to see your categories here.</p>
        </div>
      ) : (
        <>
          {slices.length === 0 ? (
            <p className="distribution-none">
              No expenses this cycle yet, so there is nothing to divide.
            </p>
          ) : (
            <div className="waffle-layout">
              <div className="waffle" role="img" aria-label={label}>
                {squares.map((color, index) => (
                  <span key={index} style={{ background: color }} />
                ))}
              </div>
              <ul className="legend" aria-label="Expenses by category">
                {slices.map((slice) => (
                  <li key={slice.key}>
                    <span
                      className="legend-swatch"
                      style={{ background: slice.color }}
                      aria-hidden="true"
                    />
                    <span className="legend-name">{slice.name}</span>
                    <span className="legend-percent">
                      {percent(slice.percent)}
                    </span>
                    <span className="legend-amount money">
                      {formatCents(slice.totalCents)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {income.length > 0 && (
            <div className="distribution-income">
              <h3>Money in</h3>
              <ul aria-label="Income by category">
                {income.map((total) => (
                  <li key={total.categoryId}>
                    <span
                      className="legend-swatch"
                      style={{ background: INCOME_COLOR }}
                      aria-hidden="true"
                    />
                    <span className="legend-name">{total.name}</span>
                    <span className="money">
                      {formatCents(total.totalCents, { sign: 'always' })}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  )
}
