import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { GENERIC_ICON } from '../../../categories/domain/category'
import type {
  Category,
  CategoryInput,
} from '../../../categories/domain/category'
import { leastUsedColor } from '../../../categories/domain/categoryColors'
import { errorMessage } from '../../../../shared/lib/error'
import { today } from '../../../../shared/lib/money'
import type { MovementInput } from '../../domain/movement'
import { toInput } from '../../domain/movementDraft'
import type { MovementDraft } from '../../domain/movementDraft'
import type { CycleSpan } from './DateField'
import { MovementFields } from './MovementFields'

type Props = {
  categories: Category[]
  // Every category's own color, as the ledger and the chart read it.
  colors: Map<number, string>
  onSubmit: (input: MovementInput) => Promise<void>
  onCreateCategory: (input: CategoryInput) => Promise<Category>
  categoriesLoading: boolean
  // XP the last saved movement earned, once the habit has refreshed.
  savedXp?: number
  // The active cycle, tinted in the calendar; absent until it has loaded.
  cycle?: CycleSpan
}

export function MovementForm({
  categories,
  colors,
  onSubmit,
  onCreateCategory,
  categoriesLoading,
  savedXp,
  cycle,
}: Props) {
  // Direction, category and date are kept after a save, so the next
  // movement starts on the setup just used.
  const [draft, setDraft] = useState<MovementDraft>(() => ({
    amount: '',
    direction: 'out',
    categoryId: '',
    date: today(),
    note: '',
  }))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [saved, setSaved] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createError, setCreateError] = useState<string | null>(null)
  const [busyCreate, setBusyCreate] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    amountRef.current?.focus()
  }, [])

  // showModal() (not the open attribute) is what gives the backdrop and
  // the native Esc-to-cancel behavior.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && creating && !dialog.open) dialog.showModal()
  }, [creating])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const result = toInput(draft, categories)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setBusy(true)
    setSaved(false)
    setError(null)
    try {
      await onSubmit(result.input)
      setDraft((current) => ({ ...current, amount: '', note: '' }))
      setSaved(true)
      amountRef.current?.focus()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  async function handleCreateSubmit(event: FormEvent) {
    event.preventDefault()
    setBusyCreate(true)
    setCreateError(null)
    try {
      // The modal asks only for a name: the color is the one the fewest
      // categories have, and the icon the generic one. Both are changed
      // later on the categories screen.
      const created = await onCreateCategory({
        name: newName,
        direction: draft.direction,
        color: leastUsedColor(categories),
        icon: GENERIC_ICON,
      })
      setDraft((current) => ({ ...current, categoryId: created.id }))
      dialogRef.current?.close()
    } catch (err) {
      setCreateError(errorMessage(err))
    } finally {
      setBusyCreate(false)
    }
  }

  return (
    <>
      <form
        className="movement-form"
        aria-label="Record a movement"
        onSubmit={handleSubmit}
      >
        <span className="form-status" role="status">
          {busy
            ? 'Saving…'
            : saved
              ? savedXp === undefined
                ? 'Movement saved'
                : `Movement saved · +${savedXp} XP`
              : ''}
        </span>
        <div className="entry-fields">
          <MovementFields
            draft={draft}
            onChange={(next) => {
              setDraft(next)
              setSaved(false)
            }}
            categories={categories}
            colors={colors}
            categoriesLoading={categoriesLoading}
            cycle={cycle}
            amountRef={amountRef}
            onCreateCategory={() => {
              // Opens the modal for the current direction.
              setNewName('')
              setCreateError(null)
              setCreating(true)
            }}
          />
          <button
            className="primary-button log-button"
            type="submit"
            disabled={busy || categoriesLoading}
          >
            {busy ? 'Saving…' : 'Log it'}
          </button>
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </form>
      <dialog
        ref={dialogRef}
        className="category-modal"
        aria-labelledby="category-dialog-title"
        onCancel={() => setCreating(false)}
        onClose={() => setCreating(false)}
      >
        <h3 id="category-dialog-title">New category</h3>
        <p className="dialog-description">
          A home for this kind of{' '}
          {draft.direction === 'in' ? 'income' : 'expense'}.
        </p>
        <form onSubmit={handleCreateSubmit}>
          <label>
            Name
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          {createError && (
            <p className="error" role="alert">
              {createError}
            </p>
          )}
          <div className="form-row">
            <button type="button" onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <button
              className="primary-button"
              type="submit"
              disabled={busyCreate}
            >
              {busyCreate ? 'Creating...' : 'Create and use'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
