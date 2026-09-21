import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { Category } from '../../../categories/domain/category'
import { forDirection } from '../../../categories/domain/category'
import { errorMessage } from '../../../../shared/lib/error'
import { today } from '../../../../shared/lib/money'
import type { Direction, MovementInput } from '../../domain/movement'

type Props = {
  categories: Category[]
  onSubmit: (input: MovementInput) => Promise<void>
  onCreateCategory: (name: string, direction: Direction) => Promise<Category>
}

export function MovementForm({ categories, onSubmit, onCreateCategory }: Props) {
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<Direction>('out')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [occurredOn, setOccurredOn] = useState(today())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
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

    const cents = Math.round(Number(amount) * 100)
    if (!Number.isFinite(cents) || cents <= 0) {
      setError('Amount must be a positive number')
      return
    }
    if (categoryId === '') {
      setError('Pick a category')
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSubmit({
        amount_cents: cents,
        direction,
        category_id: categoryId,
        occurred_on: occurredOn,
        note,
      })
      setAmount('')
      setNote('')
      amountRef.current?.focus()
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    if (event.target.value === 'create') {
      // The command never selects a category: clear any prior selection
      // (state and displayed option) so a cancel leaves the placeholder,
      // and open the modal for the current direction.
      event.target.value = ''
      setCategoryId('')
      setNewName('')
      setCreateError(null)
      setCreating(true)
      return
    }
    setCategoryId(Number(event.target.value))
  }

  async function handleCreateSubmit(event: FormEvent) {
    event.preventDefault()
    setBusyCreate(true)
    setCreateError(null)
    try {
      const created = await onCreateCategory(newName, direction)
      setCategoryId(created.id)
      dialogRef.current?.close()
    } catch (err) {
      setCreateError(errorMessage(err))
    } finally {
      setBusyCreate(false)
    }
  }

  return (
    <>
      <form className="movement-form" onSubmit={handleSubmit}>
        <h2>Record a movement</h2>
        <div className="form-row">
          <label>
            Amount
            <input
              ref={amountRef}
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </label>
          <label>
            Direction
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as Direction)
                // The filtered lists are disjoint; keep a selected category
                // across the switch and the form would submit a pairing the
                // API rejects.
                setCategoryId('')
              }}
            >
              <option value="out">Out</option>
              <option value="in">In</option>
            </select>
          </label>
          <label>
            Category
            <select value={categoryId} onChange={handleCategoryChange} required>
              <option value="" disabled>
                Choose...
              </option>
              {forDirection(categories, direction).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              <option value="create">Create new…</option>
            </select>
          </label>
          <label>
            Date
            <input
              type="date"
              value={occurredOn}
              onChange={(e) => setOccurredOn(e.target.value)}
              required
            />
          </label>
        </div>
        <div className="form-row">
          <label className="grow">
            Note
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </label>
          <button type="submit" disabled={busy}>
            {busy ? 'Saving...' : 'Save'}
          </button>
        </div>
        {error && <p className="error">{error}</p>}
      </form>
      <dialog
        ref={dialogRef}
        className="category-modal"
        onClose={() => setCreating(false)}
      >
        <h3>New category</h3>
        <form onSubmit={handleCreateSubmit}>
          <label>
            Name
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
          </label>
          {createError && <p className="error">{createError}</p>}
          <div className="form-row">
            <button type="button" onClick={() => dialogRef.current?.close()}>
              Cancel
            </button>
            <button type="submit" disabled={busyCreate}>
              {busyCreate ? 'Creating...' : 'Create and use'}
            </button>
          </div>
        </form>
      </dialog>
    </>
  )
}
