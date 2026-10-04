import type { Direction, Movement, MovementInput } from './movement'

// A movement while it is being typed: the amount is still text, and the
// category may not be chosen yet.
export type MovementDraft = {
  amount: string
  direction: Direction
  categoryId: number | ''
  date: string
  note: string
}

export type DraftResult =
  | { ok: true; input: MovementInput }
  | { ok: false; message: string }

// The one place the entry form and the edit dialog decide what may be sent.
export function toInput(draft: MovementDraft): DraftResult {
  const cents = Math.round(Number(draft.amount) * 100)
  if (!Number.isFinite(cents) || cents <= 0) {
    return { ok: false, message: 'Amount must be a positive number' }
  }
  if (draft.categoryId === '') {
    return { ok: false, message: 'Pick a category' }
  }
  return {
    ok: true,
    input: {
      amount_cents: cents,
      direction: draft.direction,
      category_id: draft.categoryId,
      occurred_on: draft.date,
      note: draft.note,
    },
  }
}

export function toDraft(movement: Movement): MovementDraft {
  const cents = movement.amount_cents
  return {
    // Cents only when they are not zero, as the ledger shows the amount.
    amount: (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2),
    direction: movement.direction,
    categoryId: movement.category_id,
    date: movement.occurred_on,
    note: movement.note,
  }
}
