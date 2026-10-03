import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { Category } from '../../../categories/domain/category'
import { errorMessage } from '../../../../shared/lib/error'
import type { Movement, MovementInput } from '../../domain/movement'
import { toDraft, toInput } from '../../domain/movementDraft'
import type { CycleSpan } from './DateField'
import { MovementFields } from './MovementFields'

type Props = {
  // The movement as the ledger holds it. The dialog starts from these
  // values every time it is mounted.
  movement: Movement
  categories: Category[]
  colors: Map<number, string>
  cycle?: CycleSpan
  // Rejects when the save fails; the dialog then stays open.
  onSave: (input: MovementInput) => Promise<void>
  // Called once the dialog has closed, saved or not.
  onClose: () => void
}

// Mounted while a movement is being edited and unmounted by `onClose`, so
// a discarded draft never survives to the next opening.
export function MovementEditDialog({
  movement,
  categories,
  colors,
  cycle,
  onSave,
  onClose,
}: Props) {
  const [draft, setDraft] = useState(() => toDraft(movement))
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const amountRef = useRef<HTMLInputElement>(null)
  const titleId = useId()

  // showModal() (not the open attribute) is what gives the backdrop, the
  // native Esc-to-cancel, and focus back on the opening control at close.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    amountRef.current?.focus()
  }, [])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const result = toInput(draft)
    if (!result.ok) {
      setError(result.message)
      return
    }

    setBusy(true)
    setError(null)
    try {
      await onSave(result.input)
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
      className="movement-edit-modal"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <h3 id={titleId}>Edit movement</h3>
      <form onSubmit={handleSubmit}>
        <div className="entry-fields">
          <MovementFields
            draft={draft}
            onChange={setDraft}
            categories={categories}
            colors={colors}
            cycle={cycle}
            amountRef={amountRef}
          />
        </div>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <div className="form-row">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Cancel
          </button>
          <button className="primary-button" type="submit" disabled={busy}>
            {busy ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
