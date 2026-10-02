import { useState } from 'react'
import type { ReactNode } from 'react'
import { CategoryChip } from '../../../categories/adapters/ui/CategoryChip'
import type { Category } from '../../../categories/domain/category'
import { colorFor } from '../../../categories/domain/categoryColors'
import { formatCents } from '../../../../shared/lib/money'
import { errorMessage } from '../../../../shared/lib/error'
import { Icon, TRASH } from '../../../../shared/ui/Icon'
import type { Movement } from '../../domain/movement'

type Props = {
  movements: Movement[]
  categories: Category[]
  colors: Map<number, string>
  onDelete: (id: number) => Promise<void>
  loading: boolean
  ready: boolean
  error: string | null
  xpById: Map<number, number>
  // Pinned under the rows, outside the scrolling list.
  footer?: ReactNode
}

// "2026-09-28" as a short local day, without a timezone shift.
function day(isoDate: string): string {
  const [year, month, date] = isoDate.split('-').map(Number)
  return new Date(year, month - 1, date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

export function MovementList({
  movements,
  categories,
  colors,
  onDelete,
  loading,
  ready,
  error,
  xpById,
  footer,
}: Props) {
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const names = new Map(categories.map((c) => [c.id, c.name]))

  async function remove(id: number) {
    setDeleting(id)
    setDeleteError(null)
    setNotice('')
    try {
      await onDelete(id)
      setNotice('Movement deleted')
    } catch (err) {
      setDeleteError(errorMessage(err))
    } finally {
      setDeleting(null)
    }
  }

  return (
    <section
      className="ledger"
      aria-labelledby="ledger-title"
      aria-busy={loading}
    >
      <div className="section-heading">
        <h2 id="ledger-title">
          Movements{' '}
          <span className="count">
            {ready && !error ? movements.length : '—'}
          </span>
        </h2>
        <span className="ledger-status" role="status">
          {loading ? 'Updating…' : notice}
        </span>
      </div>
      {deleteError && (
        <p className="error" role="alert">
          {deleteError}
        </p>
      )}
      {!ready ? (
        <div className="loading-state" role="status">
          Loading movements…
        </div>
      ) : error && movements.length === 0 ? (
        <p className="empty">
          Movements could not be loaded. Reload to try again.
        </p>
      ) : movements.length === 0 ? (
        <div className="empty ledger-empty">
          <h3>Your cycle starts here.</h3>
          <p>
            Add a movement above. Every little entry brings a clearer picture.
          </p>
        </div>
      ) : (
        <ul className="movement-list">
          {movements.map((m) => {
            const name = names.get(m.category_id) ?? 'Uncategorized'
            return (
              <li key={m.id}>
                <CategoryChip
                  name={name}
                  color={colorFor(colors, m.category_id)}
                />
                <div className="movement-detail">
                  <span className={m.note ? 'note' : 'note muted'}>
                    {m.note || 'No note'}
                  </span>
                  <span className="category">
                    {name} ·{' '}
                    <time dateTime={m.occurred_on}>{day(m.occurred_on)}</time>
                  </span>
                </div>
                <div className="movement-figures">
                  <span className={`amount ${m.direction}`}>
                    {formatCents(
                      m.direction === 'in' ? m.amount_cents : -m.amount_cents,
                      { sign: 'always' },
                    )}
                  </span>
                  {xpById.has(m.id) && (
                    <span className="xp">+{xpById.get(m.id)} XP</span>
                  )}
                </div>
                <button
                  className="delete-button"
                  type="button"
                  disabled={deleting !== null || loading}
                  aria-busy={deleting === m.id}
                  aria-label={`Delete ${m.note || name}`}
                  onClick={() => void remove(m.id)}
                >
                  <Icon>{TRASH}</Icon>
                </button>
              </li>
            )
          })}
        </ul>
      )}
      {footer}
    </section>
  )
}
