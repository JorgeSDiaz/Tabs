import { useEffect, useRef, useState } from 'react'
import { Icon, SLIDERS } from '../../../../shared/ui/Icon'
import {
  WIDGETS,
  type WidgetID,
  type WidgetSettings,
} from '../../domain/widgets'

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
      <button
        className="customize-button"
        type="button"
        disabled={!settings}
        onClick={() => setOpen(true)}
      >
        <Icon>{SLIDERS}</Icon>
        Customize
      </button>
      <dialog
        ref={dialogRef}
        onClose={() => setOpen(false)}
        aria-labelledby="widgets-dialog-title"
      >
        <h3 id="widgets-dialog-title">Make room for what matters.</h3>
        <p className="dialog-description">
          Choose the insights you want to see. Your selection follows you across
          devices.
        </p>
        {settings &&
          WIDGETS.map((widget) => (
            <label key={widget.id} className="switch-row">
              <span>{widget.label}</span>
              <input
                type="checkbox"
                checked={settings[widget.id]}
                onChange={() => onToggle(widget.id)}
              />
            </label>
          ))}
        <div className="form-row">
          <button
            className="primary-button"
            type="button"
            onClick={() => dialogRef.current?.close()}
          >
            Done
          </button>
        </div>
      </dialog>
    </div>
  )
}
