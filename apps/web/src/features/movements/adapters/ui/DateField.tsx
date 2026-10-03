import { useEffect, useId, useRef, useState } from 'react'
import type { FocusEvent, KeyboardEvent } from 'react'
import { today } from '../../../../shared/lib/money'
import {
  CALENDAR,
  CHEVRON_LEFT,
  CHEVRON_RIGHT,
  Icon,
} from '../../../../shared/ui/Icon'
import { addDays, addMonths, calendarMonth } from '../../domain/calendarMonth'
import { dayLabel, fieldLabel, monthLabel } from '../../domain/dateLabel'

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su']

const STEPS: Record<string, (date: string) => string> = {
  ArrowLeft: (date) => addDays(date, -1),
  ArrowRight: (date) => addDays(date, 1),
  ArrowUp: (date) => addDays(date, -7),
  ArrowDown: (date) => addDays(date, 7),
  PageUp: (date) => addMonths(date, -1),
  PageDown: (date) => addMonths(date, 1),
}

// The active cycle, for the tint and its key. `ends_on` is the next
// cycle's first day; `range` is the header's wording of the same span.
export type CycleSpan = {
  starts_on: string
  ends_on: string
  range: string
}

type Props = {
  value: string
  onChange: (date: string) => void
  cycle?: CycleSpan
}

export function DateField({ value, onChange, cycle }: Props) {
  const [open, setOpen] = useState(false)
  // The day holding the grid's one tab stop. Its month is the month shown.
  const [focused, setFocused] = useState(value)
  const fieldRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  // Opening and the grid's keys carry focus to the tab stop; the month
  // buttons move the tab stop and keep focus themselves.
  const moveFocus = useRef(false)
  // The entry form and the edit dialog can be on the page together.
  const id = useId()
  const labelId = `${id}-label`
  const valueId = `${id}-value`

  useEffect(() => {
    if (!open || !moveFocus.current) return
    moveFocus.current = false
    gridRef.current
      ?.querySelector<HTMLButtonElement>('[tabindex="0"]')
      ?.focus()
  }, [open, focused])

  useEffect(() => {
    if (!open) return
    function handlePointerDown(event: PointerEvent) {
      if (!fieldRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  function toggle() {
    if (open) {
      setOpen(false)
      return
    }
    setFocused(value)
    moveFocus.current = true
    setOpen(true)
  }

  // Closing from inside hands focus back to the field, so it is not lost
  // with the calendar.
  function close() {
    setOpen(false)
    triggerRef.current?.focus()
  }

  function pick(date: string) {
    onChange(date)
    close()
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
    }
  }

  // Enter and Space are the day buttons' own activation.
  function handleGridKeyDown(event: KeyboardEvent) {
    const step = STEPS[event.key]
    if (!step) return
    event.preventDefault()
    moveFocus.current = true
    setFocused(step(focused))
  }

  function handleBlur(event: FocusEvent) {
    const next = event.relatedTarget
    if (next instanceof Node && !event.currentTarget.contains(next)) {
      setOpen(false)
    }
  }

  const now = today()
  const [year, month] = focused.split('-').map(Number)

  return (
    <div
      ref={fieldRef}
      className="date-field"
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
    >
      <span id={labelId}>Date</span>
      <button
        ref={triggerRef}
        className="date-trigger"
        type="button"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
      >
        <Icon size={20}>{CALENDAR}</Icon>
        <span id={valueId}>{fieldLabel(value, now)}</span>
      </button>
      {open && (
        // Focusable, so a click on its title or gaps keeps focus inside and
        // Escape still reaches the field.
        <div
          className="calendar"
          role="dialog"
          aria-label="Choose a date"
          tabIndex={-1}
        >
          <div className="calendar-header">
            <span className="calendar-title" aria-live="polite">
              {monthLabel(focused)}
            </span>
            <button
              type="button"
              aria-label="Previous month"
              onClick={() => setFocused(addMonths(focused, -1))}
            >
              <Icon size={20}>{CHEVRON_LEFT}</Icon>
            </button>
            <button
              type="button"
              aria-label="Next month"
              onClick={() => setFocused(addMonths(focused, 1))}
            >
              <Icon size={20}>{CHEVRON_RIGHT}</Icon>
            </button>
          </div>
          <div className="calendar-weekdays" aria-hidden="true">
            {WEEKDAYS.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>
          <div
            ref={gridRef}
            className="calendar-grid"
            onKeyDown={handleGridKeyDown}
          >
            {calendarMonth(year, month).map((cell) => {
              const inCycle =
                cycle !== undefined &&
                cycle.starts_on <= cell.date &&
                cell.date < cycle.ends_on
              return (
                <button
                  key={cell.date}
                  className={[
                    'calendar-day',
                    !cell.inMonth && 'outside',
                    inCycle && 'in-cycle',
                    cell.date === now && 'today',
                    cell.date === value && 'selected',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  type="button"
                  aria-label={dayLabel(cell.date, now)}
                  aria-pressed={cell.date === value}
                  tabIndex={cell.date === focused ? 0 : -1}
                  onClick={() => pick(cell.date)}
                >
                  {cell.day}
                </button>
              )
            })}
          </div>
          <div className="calendar-footer">
            <button
              className="calendar-today"
              type="button"
              onClick={() => pick(now)}
            >
              Today
            </button>
            {cycle && (
              <span className="calendar-key">
                <span className="calendar-swatch" aria-hidden="true" />
                This cycle, {cycle.range}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
