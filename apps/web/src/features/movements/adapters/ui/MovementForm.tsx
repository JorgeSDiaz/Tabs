import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { CategoryChip } from '../../../categories/adapters/ui/CategoryChip'
import type { Category } from '../../../categories/domain/category'
import { forDirection } from '../../../categories/domain/category'
import { colorFor } from '../../../categories/domain/categoryColors'
import { errorMessage } from '../../../../shared/lib/error'
import { today } from '../../../../shared/lib/money'
import { CHEVRON_DOWN, Icon } from '../../../../shared/ui/Icon'
import type { Direction, MovementInput } from '../../domain/movement'
import { DateField } from './DateField'
import type { CycleSpan } from './DateField'

const TYPES: { value: Direction; label: string }[] = [
  { value: 'out', label: 'Spent' },
  { value: 'in', label: 'Received' },
]

type Props = {
  categories: Category[]
  // The chart's category colors, so the chip here matches the chart.
  colors: Map<number, string>
  onSubmit: (input: MovementInput) => Promise<void>
  onCreateCategory: (name: string, direction: Direction) => Promise<Category>
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
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<Direction>('out')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  // Kept after a save, so the next movement starts on the date just used.
  const [date, setDate] = useState(today())
  const [note, setNote] = useState('')
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
    setSaved(false)
    setError(null)
    try {
      await onSubmit({
        amount_cents: cents,
        direction,
        category_id: categoryId,
        occurred_on: date,
        note,
      })
      setAmount('')
      setNote('')
      setSaved(true)
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

  const selected = categories.find((c) => c.id === categoryId)

  return (
    <>
      <form
        className="movement-form"
        aria-label="Record a movement"
        onSubmit={handleSubmit}
        onChange={() => setSaved(false)}
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
          <fieldset className="type-field">
            <legend>Type</legend>
            <div className="type-toggle">
              {TYPES.map((type) => (
                <label key={type.value}>
                  <input
                    className="visually-hidden"
                    type="radio"
                    name="direction"
                    value={type.value}
                    checked={direction === type.value}
                    onChange={() => {
                      setDirection(type.value)
                      // The filtered lists are disjoint; keep a selected
                      // category across the switch and the form would submit
                      // a pairing the API rejects.
                      setCategoryId('')
                    }}
                  />
                  <span>{type.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <label className="amount-field">
            Amount
            <span className="amount-input">
              <span aria-hidden="true">$</span>
              <input
                ref={amountRef}
                type="number"
                inputMode="decimal"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="0"
              />
            </span>
          </label>
          <label>
            <span id="movement-category-label">Category</span>
            <span className="category-select">
              {selected ? (
                <CategoryChip
                  small
                  name={selected.name}
                  color={colorFor(colors, selected.id)}
                />
              ) : (
                <span className="category-chip small unset" aria-hidden="true" />
              )}
              <select
                aria-labelledby="movement-category-label"
                value={categoryId}
                onChange={handleCategoryChange}
                required
                disabled={categoriesLoading}
              >
                <option value="" disabled>
                  {categoriesLoading
                    ? 'Loading categories…'
                    : 'Choose a category'}
                </option>
                {forDirection(categories, direction).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
                <option value="create">Create new…</option>
              </select>
              <span className="select-chevron">
                <Icon size={20}>{CHEVRON_DOWN}</Icon>
              </span>
            </span>
          </label>
          <DateField
            value={date}
            onChange={(picked) => {
              setDate(picked)
              // The calendar's buttons fire no form change event.
              setSaved(false)
            }}
            cycle={cycle}
          />
          <label className="note-field">
            <span>
              Note <span className="optional">(optional)</span>
            </span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was it for?"
            />
          </label>
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
          A home for this kind of {direction === 'in' ? 'income' : 'expense'}.
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
