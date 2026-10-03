import { useId } from 'react'
import type { ChangeEvent, Ref } from 'react'
import { CategoryChip } from '../../../categories/adapters/ui/CategoryChip'
import type { Category } from '../../../categories/domain/category'
import { forDirection } from '../../../categories/domain/category'
import { colorFor } from '../../../categories/domain/categoryColors'
import { CHEVRON_DOWN, Icon } from '../../../../shared/ui/Icon'
import type { Direction } from '../../domain/movement'
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
  const categoryLabelId = `${id}-category-label`

  function handleCategoryChange(event: ChangeEvent<HTMLSelectElement>) {
    if (event.target.value === 'create') {
      // The command never selects a category: clear any prior selection
      // (state and displayed option) so a cancel leaves the placeholder.
      event.target.value = ''
      onChange({ ...draft, categoryId: '' })
      onCreateCategory?.()
      return
    }
    onChange({ ...draft, categoryId: Number(event.target.value) })
  }

  const selected = categories.find((c) => c.id === draft.categoryId)

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
                  // The filtered lists are disjoint; keep a selected
                  // category across the switch and the form would submit
                  // a pairing the API rejects.
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
            type="number"
            inputMode="decimal"
            min="0.01"
            step="0.01"
            value={draft.amount}
            onChange={(e) => onChange({ ...draft, amount: e.target.value })}
            required
            placeholder="0"
          />
        </span>
      </label>
      <label>
        <span id={categoryLabelId}>Category</span>
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
            aria-labelledby={categoryLabelId}
            value={draft.categoryId}
            onChange={handleCategoryChange}
            required
            disabled={categoriesLoading}
          >
            <option value="" disabled>
              {categoriesLoading ? 'Loading categories…' : 'Choose a category'}
            </option>
            {forDirection(categories, draft.direction).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
            {onCreateCategory && <option value="create">Create new…</option>}
          </select>
          <span className="select-chevron">
            <Icon size={20}>{CHEVRON_DOWN}</Icon>
          </span>
        </span>
      </label>
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
