import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Category } from '../../../categories/domain/category'
import { errorMessage } from '../../../../shared/lib/error'
import { today } from '../../../../shared/lib/money'
import type { Direction, MovementInput } from '../../domain/movement'

type Props = {
  categories: Category[]
  onSubmit: (input: MovementInput) => Promise<void>
}

export function MovementForm({ categories, onSubmit }: Props) {
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<Direction>('out')
  const [categoryId, setCategoryId] = useState<number | ''>('')
  const [occurredOn, setOccurredOn] = useState(today())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

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
    } catch (err) {
      setError(errorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="movement-form" onSubmit={handleSubmit}>
      <h2>Record a movement</h2>
      <div className="form-row">
        <label>
          Amount
          <input
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
            onChange={(e) => setDirection(e.target.value as Direction)}
          >
            <option value="out">Out</option>
            <option value="in">In</option>
          </select>
        </label>
        <label>
          Category
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(Number(e.target.value))}
            required
          >
            <option value="" disabled>
              Choose...
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
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
  )
}
