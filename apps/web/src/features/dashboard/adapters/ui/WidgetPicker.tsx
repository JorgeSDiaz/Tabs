import { useEffect, useRef, useState } from 'react'
import { WIDGETS, type WidgetID, type WidgetSettings } from '../../domain/widgets'

type Props = {
  settings: WidgetSettings | null
  onToggle: (id: WidgetID) => void
}

export function WidgetPicker({ settings, onToggle }: Props) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  // showModal() gives the backdrop and Esc-to-cancel, as in the category
  // dialog.
  useEffect(() => {
    const dialog = dialogRef.current
    if (dialog && open && !dialog.open) dialog.showModal()
  }, [open])

  return (
    <div className="widget-bar">
      <button type="button" disabled={!settings} onClick={() => setOpen(true)}>
        Customize
      </button>
      <dialog ref={dialogRef} onClose={() => setOpen(false)}>
        <h3>Dashboard widgets</h3>
        {settings &&
          WIDGETS.map((widget) => (
            <label key={widget.id} className="switch-row">
              <input
                type="checkbox"
                checked={settings[widget.id]}
                onChange={() => onToggle(widget.id)}
              />
              {widget.label}
            </label>
          ))}
        <div className="form-row">
          <button type="button" onClick={() => dialogRef.current?.close()}>
            Done
          </button>
        </div>
      </dialog>
    </div>
  )
}
