import type { ReactNode } from 'react'
import { Icon } from '../../../../shared/ui/Icon'

// Presentation-only icons for the seeded categories, keyed by name.
// A renamed or user-created category falls back to the tag icon.
const ICONS: Record<string, ReactNode> = {
  Salary: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  Gift: (
    <>
      <path d="M4 11h16v9H4zM3 8h18v3H3zM12 8v12" />
      <path d="M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0" />
    </>
  ),
  Housing: <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />,
  Groceries: (
    <>
      <path d="M3 4h2l2.4 11h10.2L20 7H6.2" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </>
  ),
  'Eating out': (
    <path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7a2 2 0 0 1-2 2M17 21V3c-2.5 1.5-3 5-3 8h3" />
  ),
  Transport: (
    <>
      <path d="M5 16V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9zM5 11h14" />
      <path d="M8 16v3M16 16v3" />
    </>
  ),
  Utilities: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  Health: (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  ),
  Entertainment: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </>
  ),
}

const FALLBACK = (
  <>
    <path d="M3 12V4h8l10 10-8 8z" />
    <circle cx="7.5" cy="8.5" r="1" />
  </>
)

type Props = {
  name: string
  color: string
  small?: boolean
}

// The icon chip a category carries in the ledger and the entry form,
// filled with that category's chart color so they read as one system.
export function CategoryChip({ name, color, small }: Props) {
  return (
    <span
      className={small ? 'category-chip small' : 'category-chip'}
      style={{ background: color }}
      aria-hidden="true"
    >
      <Icon size={small ? 16 : 20}>{ICONS[name] ?? FALLBACK}</Icon>
    </span>
  )
}
