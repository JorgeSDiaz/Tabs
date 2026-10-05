import { useState } from 'react'
import { formatCents } from '../../../../../shared/lib/money'
import type { Category } from '../../../../categories/domain/category'
import { colorFor } from '../../../../categories/domain/categoryColors'
import type { CategoryTotal } from '../../../../cycles/domain/cycle'
import { expenseSlices } from '../../../domain/waffle'
import type { Slice } from '../../../domain/waffle'
import { nameTotals } from '../../../domain/widgets'

type Props = {
  // The active cycle's totals, one per category with a movement.
  totals: CategoryTotal[]
  categories: Category[]
  colors: Map<number, string>
}

const percent = (value: number) => `${value.toFixed(1)}%`

// The categories behind the neutral block, as one line of text.
const memberList = (slice: Slice) =>
  slice.members?.map((m) => `${m.name} ${percent(m.percent)}`).join(', ')

// A block's whole detail in words: what its focus stop is called.
function describe(slice: Slice): string {
  const detail = `${slice.name}: ${percent(slice.percent)}, ${formatCents(slice.totalCents)}`
  return slice.members ? `${detail}. ${memberList(slice)}` : detail
}

// The key of the block a pointer or click event landed on; null in the
// gap between two squares.
const blockAt = (target: EventTarget): string | null =>
  target instanceof HTMLElement ? (target.dataset.slice ?? null) : null

export function CategoryDistributionWidget({
  totals: cycleTotals,
  categories,
  colors,
}: Props) {
  // Three ways to point at a block, kept apart because one tap fires
  // several of them. Each holds a slice key, which survives the slices
  // being rebuilt in a new order.
  const [hovered, setHovered] = useState<string | null>(null)
  const [focused, setFocused] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)

  const totals = nameTotals(cycleTotals, categories)
  const slices = expenseSlices(totals, colors)
  const income = totals.filter((total) => total.direction === 'in')

  const shownKey = hovered ?? focused ?? selected
  const shown = slices.find((slice) => slice.key === shownKey)

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
              {/* Filled column by column so each category is one contiguous
                  block. The first square of a block is its focus stop; the
                  grid handles pointer and click for every square. */}
              <div
                className="waffle"
                role="group"
                aria-label="Expense distribution"
                onPointerOver={(event) => {
                  const key = blockAt(event.target)
                  if (event.pointerType === 'mouse' && key !== null) {
                    setHovered(key)
                  }
                }}
                onPointerLeave={() => setHovered(null)}
                onFocus={(event) => {
                  if (event.target.matches(':focus-visible')) {
                    setFocused(blockAt(event.target))
                  }
                }}
                onBlur={() => setFocused(null)}
                onClick={(event) => {
                  const key = blockAt(event.target)
                  if (key !== null) {
                    setSelected((current) => (current === key ? null : key))
                  }
                }}
              >
                {slices.flatMap((slice) => {
                  const square = {
                    'data-slice': slice.key,
                    className: shown && shown !== slice ? 'dim' : undefined,
                    style: { background: slice.color },
                  }
                  return Array.from({ length: slice.squares }, (_, index) =>
                    index === 0 ? (
                      <button
                        key={`${slice.key}-${index}`}
                        type="button"
                        aria-label={describe(slice)}
                        aria-pressed={selected === slice.key}
                        {...square}
                      />
                    ) : (
                      <span
                        key={`${slice.key}-${index}`}
                        aria-hidden="true"
                        {...square}
                      />
                    ),
                  )
                })}
              </div>
              <div className="distribution-detail">
                {shown ? (
                  <>
                    <p className="distribution-shown">
                      <span className="distribution-label">
                        <span
                          className="distribution-swatch"
                          style={{ background: shown.color }}
                          aria-hidden="true"
                        />
                        <span className="distribution-name">{shown.name}</span>
                      </span>
                      <span className="distribution-percent">
                        {percent(shown.percent)}
                      </span>
                      <span className="money">
                        {formatCents(shown.totalCents)}
                      </span>
                    </p>
                    {shown.members && <p>{memberList(shown)}</p>}
                  </>
                ) : (
                  <p>Hover, tap or tab to a block to see its category</p>
                )}
              </div>
            </div>
          )}
          {income.length > 0 && (
            <div className="distribution-income">
              <h3>Money in</h3>
              <ul aria-label="Income by category">
                {income.map((total) => (
                  <li key={total.category_id}>
                    <span
                      className="distribution-swatch"
                      style={{
                        background: colorFor(colors, total.category_id),
                      }}
                      aria-hidden="true"
                    />
                    <span className="distribution-name">{total.name}</span>
                    <span className="money">
                      {formatCents(total.total_cents, { sign: 'always' })}
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
