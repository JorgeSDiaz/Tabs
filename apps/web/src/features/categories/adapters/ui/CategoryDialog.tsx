import { useEffect, useId, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../../../../shared/lib/error'
import { CHECK, Icon } from '../../../../shared/ui/Icon'
import { GENERIC_ICON } from '../../domain/category'
import type { Category, CategoryDetails } from '../../domain/category'
import {
  colorChoices,
  colorName,
  inkFor,
  leastUsedColor,
} from '../../domain/categoryColors'
import { CategoryChip } from './CategoryChip'
import { CATEGORY_ICONS, ICON_NAMES, iconLabel } from './categoryIcons'

// What the dialog is open for: a category to edit, or a direction to
// create one in.
export type DialogTarget =
  | { category: Category }
  | { direction: Category['direction'] }

type Props = {
  target: DialogTarget
  // Every category: the colors in use decide what a new one starts with
  // and which custom colors are offered.
  categories: Category[]
  // Rejects when the save fails; the dialog then stays open.
  onSave: (details: CategoryDetails) => Promise<void>
  // Called once the dialog has closed, saved or not.
  onClose: () => void
}

// Mounted while a category is being created or edited and unmounted by
// `onClose`, so a discarded choice never survives to the next opening.
export function CategoryDialog({ target, categories, onSave, onClose }: Props) {
  const editing = 'category' in target ? target.category : null
  const direction =
    'category' in target ? target.category.direction : target.direction

  const [name, setName] = useState(editing?.name ?? '')
  // A stored icon this app does not draw is shown, and saved, as the
  // generic one.
  const [icon, setIcon] = useState(
    editing && ICON_NAMES.includes(editing.icon) ? editing.icon : GENERIC_ICON,
  )
  const [color, setColor] = useState(
    () => editing?.color ?? leastUsedColor(categories),
  )
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const nameRef = useRef<HTMLInputElement>(null)
  const id = useId()
  const titleId = `${id}-title`

  // showModal() (not the open attribute) is what gives the backdrop, the
  // native Esc-to-cancel, and focus back on the opening control at close.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    nameRef.current?.focus()
  }, [])

  // A color just taken from the free picker is a choice from then on, so
  // it can be seen selected before it is saved.
  const choices = colorChoices(categories)
  if (!choices.includes(color)) choices.push(color)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await onSave({ name, color, icon })
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
      className="category-dialog"
      aria-labelledby={titleId}
      onClose={onClose}
    >
      <h3 id={titleId}>{editing ? 'Edit category' : 'New category'}</h3>
      <p className="dialog-description">
        {editing ? 'A home' : 'A new home'} for a kind of{' '}
        {direction === 'in' ? 'income' : 'expense'}.
      </p>
      <form onSubmit={handleSubmit}>
        <div className="category-preview">
          <CategoryChip icon={icon} color={color} />
          <span>{name.trim() || 'Category name'}</span>
        </div>
        <label>
          Name
          <input
            ref={nameRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <fieldset className="choice-field">
          <legend>Icon</legend>
          <div className="icon-choices">
            {ICON_NAMES.map((choice) => (
              <label key={choice}>
                <input
                  className="visually-hidden"
                  type="radio"
                  name={`${id}-icon`}
                  aria-label={iconLabel(choice)}
                  checked={choice === icon}
                  onChange={() => setIcon(choice)}
                />
                <span>
                  <Icon size={20}>{CATEGORY_ICONS[choice]}</Icon>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset className="choice-field">
          <legend>Color</legend>
          <div className="color-choices">
            {choices.map((choice) => (
              <label key={choice}>
                <input
                  className="visually-hidden"
                  type="radio"
                  name={`${id}-color`}
                  aria-label={colorName(choice)}
                  checked={choice === color}
                  onChange={() => setColor(choice)}
                />
                <span style={{ background: choice, color: inkFor(choice) }}>
                  {choice === color && <Icon>{CHECK}</Icon>}
                </span>
              </label>
            ))}
            {/* The native picker: whatever it returns becomes the selected
                color, and a choice above. */}
            <label className="color-custom">
              <input
                className="visually-hidden"
                type="color"
                aria-label="Custom color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              />
              <span>Custom…</span>
            </label>
          </div>
        </fieldset>
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
            {busy ? 'Saving…' : editing ? 'Save changes' : 'Create category'}
          </button>
        </div>
      </form>
    </dialog>
  )
}
