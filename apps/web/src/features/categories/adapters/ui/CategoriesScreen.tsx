import { useEffect, useId, useRef, useState } from 'react'
import type { Ref } from 'react'
import { errorMessage } from '../../../../shared/lib/error'
import {
  CHEVRON_LEFT,
  Icon,
  PENCIL,
  PLUS,
  TRASH,
} from '../../../../shared/ui/Icon'
import { forDirection } from '../../domain/category'
import type {
  Category,
  CategoryDetails,
  CategoryInput,
} from '../../domain/category'
import { CategoryChip } from './CategoryChip'
import { CategoryDialog } from './CategoryDialog'
import type { DialogTarget } from './CategoryDialog'

const GROUPS: { direction: Category['direction']; title: string }[] = [
  { direction: 'out', title: 'Expenses' },
  { direction: 'in', title: 'Income' },
]

type Props = {
  ref?: Ref<HTMLElement>
  // Both views stay mounted; the one not shown is hidden.
  hidden: boolean
  dashboardHref: string
  categories: Category[]
  loading: boolean
  error: string | null
  onCreate: (input: CategoryInput) => Promise<Category>
  onUpdate: (id: number, details: CategoryDetails) => Promise<void>
  onRemove: (id: number) => Promise<void>
}

// The one place categories are seen whole and changed: created, renamed,
// restyled, deleted. It decides none of the rules; a refused change shows
// the reason the server gives.
export function CategoriesScreen({
  ref,
  hidden,
  dashboardHref,
  categories,
  loading,
  error,
  onCreate,
  onUpdate,
  onRemove,
}: Props) {
  const [dialog, setDialog] = useState<DialogTarget | null>(null)
  const [deleting, setDeleting] = useState<Category | null>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  // Set by a deletion that went through: its row, and the control the
  // dialog would hand focus back to, are gone.
  const deleted = useRef(false)
  const id = useId()

  function save(details: CategoryDetails) {
    if (!dialog) return Promise.resolve()
    if ('category' in dialog) return onUpdate(dialog.category.id, details)
    return onCreate({ ...details, direction: dialog.direction }).then(() => {})
  }

  return (
    <main
      ref={ref}
      className="screen categories-screen"
      hidden={hidden}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
    >
      <header className="page-header">
        <span className="brand" aria-hidden="true">
          tabs
        </span>
        <h1 id={`${id}-title`} className="screen-title" ref={titleRef} tabIndex={-1}>
          Categories
        </h1>
        <div className="header-tools">
          <a className="header-link" href={dashboardHref}>
            <Icon>{CHEVRON_LEFT}</Icon>
            Dashboard
          </a>
        </div>
      </header>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      {loading ? (
        <div className="loading-state" role="status">
          Loading categories…
        </div>
      ) : (
        // With nothing loaded there is nothing to list, and nothing a new
        // category could be told apart from.
        !(error && categories.length === 0) && (
          <div className="category-groups">
            {GROUPS.map((group) => {
              const rows = forDirection(categories, group.direction)
              const groupId = `${id}-${group.direction}`
              return (
                <section
                  key={group.direction}
                  className="category-group"
                  aria-labelledby={`${groupId}-title`}
                >
                  <div className="section-heading">
                    <h2>
                      <span id={`${groupId}-title`}>{group.title}</span>{' '}
                      <span className="count">{rows.length}</span>
                    </h2>
                    {/* Named with its group, so the two are told apart. */}
                    <button
                      id={`${groupId}-new`}
                      className="new-category-button"
                      type="button"
                      aria-labelledby={`${groupId}-new ${groupId}-title`}
                      onClick={() => setDialog({ direction: group.direction })}
                    >
                      <Icon>{PLUS}</Icon>
                      New category
                    </button>
                  </div>
                  <ul className="category-rows">
                    {rows.map((category) => (
                      <li key={category.id}>
                        <CategoryChip
                          icon={category.icon}
                          color={category.color}
                        />
                        <span className="category-row-name">
                          {category.name}
                        </span>
                        <div className="row-actions">
                          <button
                            className="row-button"
                            type="button"
                            aria-label={`Edit ${category.name}`}
                            onClick={() => setDialog({ category })}
                          >
                            <Icon>{PENCIL}</Icon>
                          </button>
                          <button
                            className="row-button delete-button"
                            type="button"
                            aria-label={`Delete ${category.name}`}
                            onClick={() => setDeleting(category)}
                          >
                            <Icon>{TRASH}</Icon>
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )
            })}
          </div>
        )
      )}
      {dialog && (
        <CategoryDialog
          target={dialog}
          categories={categories}
          onSave={save}
          onClose={() => setDialog(null)}
        />
      )}
      {deleting && (
        <DeleteDialog
          category={deleting}
          onDelete={async () => {
            await onRemove(deleting.id)
            deleted.current = true
          }}
          onClose={() => {
            setDeleting(null)
            if (deleted.current) {
              deleted.current = false
              titleRef.current?.focus()
            }
          }}
        />
      )}
    </main>
  )
}

type DeleteProps = {
  category: Category
  // Rejects with the reason when the deletion is refused.
  onDelete: () => Promise<void>
  onClose: () => void
}

// Asks before deleting, and is where a refusal is read: the row is still
// there behind it.
function DeleteDialog({ category, onDelete, onClose }: DeleteProps) {
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
  }, [])

  async function confirm() {
    setBusy(true)
    setError(null)
    try {
      await onDelete()
      dialogRef.current?.close()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className="category-delete-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <h3 id={titleId}>Delete {category.name}?</h3>
      <p className="dialog-description">
        A category can be deleted only while no movement uses it.
      </p>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <div className="form-row">
        <button type="button" onClick={() => dialogRef.current?.close()}>
          {error ? 'Close' : 'Cancel'}
        </button>
        <button
          className="danger-button"
          type="button"
          disabled={busy}
          onClick={() => void confirm()}
        >
          {busy ? 'Deleting…' : 'Delete'}
        </button>
      </div>
    </dialog>
  )
}
