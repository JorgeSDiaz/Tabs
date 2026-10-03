import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CategoryChip } from '../../../categories/adapters/ui/CategoryChip'
import type { Category } from '../../../categories/domain/category'
import { colorFor } from '../../../categories/domain/categoryColors'
import { formatCents } from '../../../../shared/lib/money'
import { errorMessage } from '../../../../shared/lib/error'
import {
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  Icon,
  PENCIL,
  TRASH,
} from '../../../../shared/ui/Icon'
import type { Movement, MovementInput } from '../../domain/movement'
import { pageWindow } from '../../domain/pageWindow'
import type { CycleSpan } from './DateField'
import { MovementEditDialog } from './MovementEditDialog'

type Props = {
  // One page of the active cycle.
  movements: Movement[]
  page: number
  totalPages: number
  // Movements in the whole cycle, not on this page.
  total: number
  onPage: (page: number) => void
  categories: Category[]
  colors: Map<number, string>
  onEdit: (id: number, input: MovementInput) => Promise<void>
  onDelete: (id: number) => Promise<void>
  // The active cycle, tinted in the edit dialog's calendar.
  cycle?: CycleSpan
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
  page,
  totalPages,
  total,
  onPage,
  categories,
  colors,
  onEdit,
  onDelete,
  cycle,
  loading,
  ready,
  error,
  xpById,
  footer,
}: Props) {
  // The movement in the edit dialog, as it was when the dialog opened.
  const [editing, setEditing] = useState<Movement | null>(null)
  const [deleting, setDeleting] = useState<number | null>(null)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [notice, setNotice] = useState('')
  const names = new Map(categories.map((c) => [c.id, c.name]))
  const list = useRef<HTMLUListElement>(null)
  const shownPage = useRef(page)
  // Set when the reader picks a page, so only that brings the list into
  // view. Recording a movement also changes the page and must not pull the
  // viewport away from the entry form.
  const turned = useRef(false)

  // Runs once the new page's rows are in: start it from its first row.
  useEffect(() => {
    if (loading) return
    if (shownPage.current !== page) {
      shownPage.current = page
      if (list.current) {
        list.current.scrollTop = 0
        if (turned.current) {
          list.current.firstElementChild?.scrollIntoView({ block: 'nearest' })
        }
      }
    }
    turned.current = false
  }, [page, loading])

  // The one place a page change is refused. The end buttons are
  // aria-disabled, never disabled: a disabled button drops the keyboard focus
  // it was activated with. Nothing is dimmed while a page loads, because a
  // load is shorter than a blink and the ledger is already marked busy.
  function turnTo(next: number) {
    if (loading || next === page || next < 1 || next > totalPages) return
    turned.current = true
    onPage(next)
  }

  async function save(id: number, input: MovementInput) {
    setNotice('')
    await onEdit(id, input)
    setNotice('Movement updated')
  }

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
            {ready && !error ? total : '—'}
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
        <ul className="movement-list" ref={list}>
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
                <div className="row-actions">
                  {/* Not disabled while the list reloads: closing the dialog
                      hands focus back to this button, which a disabled
                      button could not take. */}
                  <button
                    className="row-button"
                    type="button"
                    disabled={deleting !== null}
                    aria-label={`Edit ${m.note || name}`}
                    onClick={() => setEditing(m)}
                  >
                    <Icon>{PENCIL}</Icon>
                  </button>
                  <button
                    className="row-button delete-button"
                    type="button"
                    disabled={deleting !== null || loading}
                    aria-busy={deleting === m.id}
                    aria-label={`Delete ${m.note || name}`}
                    onClick={() => void remove(m.id)}
                  >
                    <Icon>{TRASH}</Icon>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
      {totalPages > 1 && movements.length > 0 && (
        <nav className="pagination" aria-label="Movement pages">
          <button
            type="button"
            aria-disabled={page === 1}
            aria-label="Previous page"
            onClick={() => turnTo(page - 1)}
          >
            <Icon size={20}>{CHEVRON_LEFT}</Icon>
          </button>
          <ol>
            {pageWindow(page, totalPages).map((slot) =>
              slot === 'gap' ? (
                <li key="gap" className="page-gap" aria-hidden="true">
                  …
                </li>
              ) : (
                <li key={slot}>
                  <button
                    type="button"
                    aria-label={`Page ${slot}`}
                    aria-current={slot === page ? 'page' : undefined}
                    onClick={() => turnTo(slot)}
                  >
                    {slot}
                  </button>
                </li>
              ),
            )}
          </ol>
          <button
            type="button"
            aria-disabled={page === totalPages}
            aria-label="Next page"
            onClick={() => turnTo(page + 1)}
          >
            <Icon size={20}>{CHEVRON_RIGHT}</Icon>
          </button>
        </nav>
      )}
      {editing && (
        <MovementEditDialog
          key={editing.id}
          movement={editing}
          categories={categories}
          colors={colors}
          cycle={cycle}
          onSave={(input) => save(editing.id, input)}
          onClose={() => setEditing(null)}
        />
      )}
      {footer}
    </section>
  )
}
