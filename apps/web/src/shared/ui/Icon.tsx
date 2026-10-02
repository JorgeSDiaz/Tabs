import type { ReactNode } from 'react'

type Props = {
  size?: 16 | 20 | 24
  children: ReactNode
}

// Every drawn icon goes through this wrapper, so they all share one stroke
// weight and one set of line caps.
export function Icon({ size = 16, children }: Props) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const ARROW_IN = <path d="M7 17 17 7M8 7h9v9" />
export const ARROW_OUT = <path d="M17 7 7 17M16 17H7V8" />
export const CALENDAR = (
  <>
    <rect x="3" y="5" width="18" height="16" rx="3" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </>
)
export const CHEVRON_DOWN = <path d="M6 9l6 6 6-6" />
export const CHEVRON_LEFT = <path d="M15 18l-6-6 6-6" />
export const CHEVRON_RIGHT = <path d="M9 6l6 6-6 6" />
export const SLIDERS = (
  <>
    <path d="M4 7h10M18 7h2M4 17h4M12 17h8" />
    <circle cx="16" cy="7" r="2" />
    <circle cx="10" cy="17" r="2" />
  </>
)
export const TRASH = (
  <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
)

const FLAME =
  'M12 22c4.4 0 7-2.9 7-6.8 0-3.9-2.6-6.1-4.2-9.2-.5 2.1-1.6 3.4-3 4C12 7 11 4.4 8.6 2 8.9 6 5 8.9 5 14.6 5 18.8 7.9 22 12 22z'
const FLAME_CORE =
  'M12 22c2.2 0 3.6-1.5 3.6-3.5 0-2-1.4-3.2-2.3-4.8-.3 1-1 1.8-1.7 2.1-.1-1.4-.7-2.8-2-4 .2 2-1.8 3.6-1.8 6.5 0 2.2 1.8 3.7 4.2 3.7z'

// The streak's flame is a filled shape, not a stroke; `core` adds the
// inner flame for the large one in the panel.
export function Flame({ size, core }: { size: number; core?: boolean }) {
  return (
    <svg
      className="flame"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
    >
      <path className="flame-body" d={FLAME} />
      {core && <path className="flame-core" d={FLAME_CORE} />}
    </svg>
  )
}
