import { useEffect, useId, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'
import { CHECK, CHEVRON_DOWN, Icon, PLUS } from '../../../../shared/ui/Icon'
import type { Category } from '../../domain/category'
import { colorFor } from '../../domain/categoryColors'
import { firstStartingWith, stepRow } from '../../domain/listNavigation'
import { CategoryChip } from './CategoryChip'

// How long typed letters keep adding up to one prefix.
const TYPEAHEAD_MS = 500

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

// The category field: a select that can draw each choice's icon. Keyboard
// focus stays on the field while the list is open, so the list needs no
// focus of its own and closing it hands nothing back.
export function CategorySelect({
  categories,
  value,
  colors,
  onChange,
  onCreate,
  loading = false,
}: Props) {
  const [open, setOpen] = useState(false)
  // The row the keys act on: a category, or "Create new…" after the last.
  const [active, setActive] = useState(0)
  const fieldRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const typed = useRef({ text: '', at: 0 })
  // The entry form and the edit dialog can be on the page together.
  const id = useId()
  const labelId = `${id}-label`
  const valueId = `${id}-value`
  const listId = `${id}-list`
  const rowId = (index: number) => `${id}-row-${index}`

  const selectedIndex = categories.findIndex((c) => c.id === value)
  const selected = categories[selectedIndex]
  const rowCount = categories.length + (onCreate ? 1 : 0)

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' })
  }, [open, active])

  function show(index: number) {
    setActive(index)
    setOpen(true)
  }

  // Closing ends the prefix being typed, so a Space right after it opens
  // the list again instead of extending the prefix.
  function close() {
    typed.current = { text: '', at: 0 }
    setOpen(false)
  }

  // "Create new…" is a command: it never changes the selected category.
  function choose(index: number) {
    close()
    const category = categories[index]
    if (category) onChange(category.id)
    else onCreate?.()
  }

  // Letters typed close together add up to one prefix. A space extends a
  // prefix already being typed; on its own it is left to choose a row.
  function typeAhead(key: string): boolean {
    const now = Date.now()
    const text = now - typed.current.at < TYPEAHEAD_MS ? typed.current.text : ''
    if (key === ' ' && text === '') return false
    typed.current = { text: text + key, at: now }
    const match = firstStartingWith(
      categories.map((c) => c.name),
      typed.current.text,
    )
    if (match >= 0) show(match)
    return true
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.ctrlKey || event.metaKey || event.altKey) return
    const { key } = event
    if (key.length === 1 && typeAhead(key)) {
      event.preventDefault()
      return
    }
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(key)) {
        event.preventDefault()
        show(Math.max(selectedIndex, 0))
      }
      return
    }
    // Handled here so a dialog around the field does not take the Escape.
    if (key === 'Escape') {
      event.preventDefault()
      close()
      return
    }
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      choose(active)
      return
    }
    const next = stepRow(key, active, rowCount)
    if (next !== null) {
      event.preventDefault()
      setActive(next)
    }
  }

  // Some browsers click a button on the Space key's release.
  function handleKeyUp(event: KeyboardEvent) {
    if (event.key === ' ') event.preventDefault()
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
        className="category-trigger"
        type="button"
        role="combobox"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? rowId(active) : undefined}
        disabled={loading}
        onClick={() => (open ? setOpen(false) : show(Math.max(selectedIndex, 0)))}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
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
        // A press on the list must not take focus from the field.
        <ul
          ref={listRef}
          id={listId}
          className="category-list"
          role="listbox"
          aria-labelledby={labelId}
          onMouseDown={(event) => event.preventDefault()}
        >
          {categories.map((category, index) => (
            <li
              key={category.id}
              id={rowId(index)}
              className={index === active ? 'active' : undefined}
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
            </li>
          ))}
          {onCreate && (
            <li
              id={rowId(categories.length)}
              className={
                active === categories.length ? 'create-row active' : 'create-row'
              }
              role="option"
              aria-selected={false}
              onPointerMove={() => setActive(categories.length)}
              onClick={() => choose(categories.length)}
            >
              <span className="category-chip small unset" aria-hidden="true">
                <Icon>{PLUS}</Icon>
              </span>
              <span className="category-name">Create new…</span>
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
