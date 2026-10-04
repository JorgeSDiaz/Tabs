import { useId } from 'react'
import type { ChangeEvent, Ref } from 'react'
import { CategorySelect } from '../../../categories/adapters/ui/CategorySelect'
import type { Category } from '../../../categories/domain/category'
import { forDirection } from '../../../categories/domain/category'
import { amountDigits, groupAmount } from '../../../../shared/lib/money'
import type { Direction } from '../../domain/movement'
import { resolveCategoryId } from '../../domain/movementDraft'
import type { MovementDraft } from '../../domain/movementDraft'
import { DateField } from './DateField'
import type { CycleSpan } from './DateField'

const TYPES: { value: Direction; label: string }[] = [
  { value: 'out', label: 'Spent' },
  { value: 'in', label: 'Received' },
]

type Props = {
  draft: MovementDraft
  onChange: (draft: MovementDraft) => void
  categories: Category[]
  // The chart's category colors, so the chip here matches the chart.
  colors: Map<number, string>
  categoriesLoading?: boolean
  // The active cycle, tinted in the calendar; absent until it has loaded.
  cycle?: CycleSpan
  amountRef: Ref<HTMLInputElement>
  // When given, the category choices end with "Create new…", which calls it.
  onCreateCategory?: () => void
}

// The fields of a movement, shared by the entry form and the edit dialog.
// They render as siblings, so the container decides the layout.
export function MovementFields({
  draft,
  onChange,
  categories,
  colors,
  categoriesLoading = false,
  cycle,
  amountRef,
  onCreateCategory,
}: Props) {
  // The entry form and the edit dialog can be on the page together.
  const id = useId()

  function handleAmountChange(event: ChangeEvent<HTMLInputElement>) {
    const input = event.target
    const amount = amountDigits(input.value)
    const shown = groupAmount(amount)
    // Regrouping shifts the text under the caret, so it is put back after
    // the same digits. Written to the input before the draft changes, so
    // the next render finds the value already there and leaves the caret.
    const caretAt = input.selectionStart ?? input.value.length
    const kept = amountDigits(input.value.slice(0, caretAt)).length
    let caret = 0
    for (let seen = 0; seen < kept && caret < shown.length; caret++) {
      if (shown[caret] !== ',') seen++
    }
    // A deleted comma comes straight back. A forward delete must land past
    // it, or the key would remove the same comma forever.
    const { inputType } = event.nativeEvent as InputEvent
    if (inputType === 'deleteContentForward' && shown[caret] === ',') caret++
    input.value = shown
    input.setSelectionRange(caret, caret)
    onChange({ ...draft, amount })
  }

  return (
    <>
      <fieldset className="type-field">
        <legend>Type</legend>
        <div className="type-toggle">
          {TYPES.map((type) => (
            <label key={type.value}>
              <input
                className="visually-hidden"
                type="radio"
                name={`${id}-direction`}
                value={type.value}
                checked={draft.direction === type.value}
                onChange={() =>
                  // An empty category is the first one of the new
                  // direction, whatever was selected under the other.
                  onChange({ ...draft, direction: type.value, categoryId: '' })
                }
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
            type="text"
            inputMode="decimal"
            value={groupAmount(draft.amount)}
            onChange={handleAmountChange}
            required
            placeholder="0"
          />
        </span>
      </label>
      <CategorySelect
        categories={forDirection(categories, draft.direction)}
        value={resolveCategoryId(draft, categories)}
        colors={colors}
        onChange={(categoryId) => onChange({ ...draft, categoryId })}
        onCreate={onCreateCategory}
        loading={categoriesLoading}
      />
      <DateField
        value={draft.date}
        onChange={(date) => onChange({ ...draft, date })}
        cycle={cycle}
      />
      <label className="note-field">
        <span>
          Note <span className="optional">(optional)</span>
        </span>
        <input
          type="text"
          value={draft.note}
          onChange={(e) => onChange({ ...draft, note: e.target.value })}
          placeholder="What was it for?"
        />
      </label>
    </>
  )
}
