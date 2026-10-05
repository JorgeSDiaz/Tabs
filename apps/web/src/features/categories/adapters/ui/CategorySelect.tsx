import { useEffect, useId, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent, MouseEvent } from 'react'
import {
  CHECK,
  CHEVRON_DOWN,
  Icon,
  PLUS,
  SEARCH,
} from '../../../../shared/ui/Icon'
import type { Category } from '../../domain/category'
import { colorFor } from '../../domain/categoryColors'
import {
  firstStartingWith,
  matching,
  stepRow,
} from '../../domain/listNavigation'
import { CategoryChip } from './CategoryChip'

type Props = {
  // The choices, already narrowed to one direction, in listing order.
  categories: Category[]
  value: number | ''
  // Every category's own color, as the ledger and the chart read it.
  colors: Map<number, string>
  onChange: (categoryId: number) => void
  // When given, the list ends with "Create new…", which calls it.
  onCreate?: () => void
  loading?: boolean
}

// The category field: a select that can draw each choice's icon and be
// searched. While the list is open, keyboard focus is in its search box;
// closing it with the keyboard or by choosing hands focus back to the field.
export function CategorySelect({
  categories,
  value,
  colors,
  onChange,
  onCreate,
  loading = false,
}: Props) {
  const [open, setOpen] = useState(false)
  // What the search box holds. It narrows the choices by name.
  const [search, setSearch] = useState('')
  // The row the keys act on: one of the choices the search has left, or
  // "Create new…" after the last. -1 when there is no row at all.
  const [active, setActive] = useState(0)
  const fieldRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  // The entry form and the edit dialog can be on the page together.
  const id = useId()
  const labelId = `${id}-label`
  const valueId = `${id}-value`
  const listId = `${id}-list`
  const activeId = active >= 0 ? `${id}-row-${active}` : undefined

  const selectedIndex = categories.findIndex((c) => c.id === value)
  const selected = categories[selectedIndex]
  const shown = matching(categories, search)
  const rowCount = shown.length + (onCreate ? 1 : 0)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  // The list keeps the width it opens with, so it does not narrow as the
  // search takes its longest names away. All of it comes into view, so
  // "Create new…" at its foot is on screen even where the field sits low
  // on the page.
  useEffect(() => {
    const popover = popoverRef.current
    if (!open || !popover) return
    popover.style.minWidth = `${popover.offsetWidth}px`
    searchRef.current?.focus()
    popover.scrollIntoView({ block: 'nearest' })
  }, [open])

  useEffect(() => {
    if (!open || !activeId) return
    document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' })
  }, [open, activeId, search])

  // Where the list starts for a search: on the selected category while
  // the box is empty, otherwise on the first name that starts with the
  // text, or on the first one left when none does.
  function startingRow(text: string): number {
    const left = matching(categories, text)
    if (left.length === 0) return onCreate ? 0 : -1
    if (text === '') return Math.max(selectedIndex, 0)
    return Math.max(
      firstStartingWith(
        left.map((c) => c.name),
        text,
      ),
      0,
    )
  }

  function searchFor(text: string) {
    setSearch(text)
    setActive(startingRow(text))
  }

  function show(text = '') {
    searchFor(text)
    setOpen(true)
  }

  // Focus moves before the search box goes, so it is never dropped on the
  // page in between.
  function dismiss() {
    triggerRef.current?.focus()
    setOpen(false)
  }

  // "Create new…" is a command: it never changes the selected category.
  // Its modal opens after focus is back on the field, which is where the
  // browser returns it when the modal closes.
  function choose(index: number) {
    if (index < 0) return
    dismiss()
    const category = shown[index]
    if (category) onChange(category.id)
    else onCreate?.()
  }

  function handleTriggerKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const { key } = event
    if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
      event.preventDefault()
      show()
    } else if (key.length === 1) {
      // A letter opens the list already searching for it.
      event.preventDefault()
      show(key)
    }
  }

  function handleSearchKeyDown(event: KeyboardEvent) {
    const { key } = event
    // Handled here so a dialog around the field does not take the Escape.
    if (key === 'Escape') {
      event.preventDefault()
      dismiss()
      return
    }
    // Never left to the browser, which would submit the form around it.
    // An input method confirms its own text with Enter.
    if (key === 'Enter') {
      event.preventDefault()
      if (!event.nativeEvent.isComposing) choose(active)
      return
    }
    // Tab goes on from the field, not from a box that is about to go;
    // Shift+Tab stops on the field itself.
    if (key === 'Tab') {
      if (event.shiftKey) event.preventDefault()
      dismiss()
      return
    }
    const next = stepRow(key, active, rowCount)
    if (next !== null) {
      event.preventDefault()
      setActive(next)
    }
  }

  // A press on the list must not take focus from the search box; a press
  // on the box itself has to place the caret.
  function handlePopoverMouseDown(event: MouseEvent) {
    if (event.target !== searchRef.current) event.preventDefault()
  }

  function handleBlur(event: FocusEvent) {
    const next = event.relatedTarget
    if (next instanceof Node && !event.currentTarget.contains(next)) {
      setOpen(false)
    }
  }

  return (
    <div ref={fieldRef} className="category-field" onBlur={handleBlur}>
      <span id={labelId}>Category</span>
      <button
        ref={triggerRef}
        className="category-trigger"
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={loading}
        onClick={() => (open ? setOpen(false) : show())}
        onKeyDown={handleTriggerKeyDown}
      >
        {selected ? (
          <CategoryChip
            small
            icon={selected.icon}
            color={colorFor(colors, selected.id)}
          />
        ) : (
          <span className="category-chip small unset" aria-hidden="true" />
        )}
        <span id={valueId} className="category-name">
          {selected ? selected.name : loading ? 'Loading categories…' : ''}
        </span>
        <Icon size={20}>{CHEVRON_DOWN}</Icon>
      </button>
      {open && (
        <div
          ref={popoverRef}
          className="category-popover"
          onMouseDown={handlePopoverMouseDown}
        >
          <div className="category-search">
            <Icon>{SEARCH}</Icon>
            <input
              ref={searchRef}
              type="text"
              role="combobox"
              aria-label="Search categories"
              aria-autocomplete="list"
              aria-expanded={rowCount > 0}
              aria-controls={rowCount > 0 ? listId : undefined}
              aria-activedescendant={activeId}
              autoComplete="off"
              spellCheck={false}
              placeholder="Search"
              value={search}
              onChange={(event) => searchFor(event.target.value)}
              onKeyDown={handleSearchKeyDown}
            />
          </div>
          {/* Always there while the list is open, so that the text is
              announced when it appears. */}
          <p className="category-empty" role="status">
            {shown.length === 0 ? 'No categories match' : ''}
          </p>
          {rowCount > 0 && (
            <div
              id={listId}
              className="category-list"
              role="listbox"
              aria-labelledby={labelId}
            >
              <div className="category-choices">
                {shown.map((category, index) => (
                  <div
                    key={category.id}
                    id={`${id}-row-${index}`}
                    className={
                      index === active ? 'category-row active' : 'category-row'
                    }
                    role="option"
                    aria-selected={category.id === value}
                    onPointerMove={() => setActive(index)}
                    onClick={() => choose(index)}
                  >
                    <CategoryChip
                      small
                      icon={category.icon}
                      color={colorFor(colors, category.id)}
                    />
                    <span className="category-name">{category.name}</span>
                    {category.id === value && <Icon size={16}>{CHECK}</Icon>}
                  </div>
                ))}
              </div>
              {onCreate && (
                <div
                  id={`${id}-row-${shown.length}`}
                  className={
                    active === shown.length
                      ? 'category-row create-row active'
                      : 'category-row create-row'
                  }
                  role="option"
                  aria-selected={false}
                  onPointerMove={() => setActive(shown.length)}
                  onClick={() => choose(shown.length)}
                >
                  <span className="category-chip small unset" aria-hidden="true">
                    <Icon>{PLUS}</Icon>
                  </span>
                  <span className="category-name">Create new…</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
