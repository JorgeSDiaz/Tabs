import type { ReactNode } from 'react'
import { TAG } from '../../../../shared/ui/Icon'
import { GENERIC_ICON } from '../../domain/category'

// Every icon a category can carry, keyed by what it depicts. The key is
// what a category stores; the order is the order the picker offers them
// in, the generic one first.
export const CATEGORY_ICONS: Record<string, ReactNode> = {
  [GENERIC_ICON]: TAG,
  home: <path d="M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6" />,
  cart: (
    <>
      <path d="M3 4h2l2.4 11h10.2L20 7H6.2" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="17" cy="19" r="1" />
    </>
  ),
  cutlery: (
    <path d="M6 3v7a2 2 0 0 0 2 2v9M10 3v7a2 2 0 0 1-2 2M17 21V3c-2.5 1.5-3 5-3 8h3" />
  ),
  bus: (
    <>
      <path d="M5 16V7a3 3 0 0 1 3-3h8a3 3 0 0 1 3 3v9zM5 11h14" />
      <path d="M8 16v3M16 16v3" />
    </>
  ),
  bolt: <path d="M13 2L4 14h7l-1 8 9-12h-7z" />,
  heart: (
    <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
  ),
  play: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="M10 9l5 3-5 3z" />
    </>
  ),
  banknote: (
    <>
      <rect x="3" y="7" width="18" height="10" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
    </>
  ),
  gift: (
    <>
      <path d="M4 11h16v9H4zM3 8h18v3H3zM12 8v12" />
      <path d="M12 8c-2-4-6-3-5 0M12 8c2-4 6-3 5 0" />
    </>
  ),
  card: (
    <>
      <rect x="3" y="6" width="18" height="12" rx="2" />
      <path d="M3 10.5h18M7 15h3" />
    </>
  ),
  transfer: <path d="M4 8.5h15M15 4.5l4 4-4 4M20 15.5H5M9 11.5l-4 4 4 4" />,
  'piggy-bank': (
    <>
      <path d="M4.5 12.5c0-3.3 3.1-6 7-6 1.5 0 2.9.4 4 1l2.5-1-.4 2.6c.7.7 1.2 1.5 1.5 2.4H21v3.5h-2.2c-.5.9-1.2 1.6-2 2.2V20h-3v-1.6h-3.6V20h-3v-2.9c-1.6-1.1-2.7-2.8-2.7-4.6z" />
      <path d="M9.5 9.5h3" />
    </>
  ),
  shirt: (
    <path d="M8 4L3 7l2 4 2-1v10h10V10l2 1 2-4-5-3a4 4 0 0 1-8 0z" />
  ),
  book: (
    <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11" />
  ),
  plane: (
    <path d="M10.5 3.5a1.5 1.5 0 0 1 3 0V9l7.5 4.5v2L13.5 13v5l2.5 2v1.5L12 20.5l-4 1v-1.5l2.5-2v-5L3 15.5v-2L10.5 9z" />
  ),
  paw: (
    <>
      <circle cx="5.5" cy="11" r="1.1" />
      <circle cx="9" cy="6.5" r="1.1" />
      <circle cx="15" cy="6.5" r="1.1" />
      <circle cx="18.5" cy="11" r="1.1" />
      <path d="M12 12.5c-2.2 0-4.2 2.2-4.2 4.3 0 1.4 1 2.2 2.3 2.2.7 0 1.2-.3 1.9-.3s1.2.3 1.9.3c1.3 0 2.3-.8 2.3-2.2 0-2.1-2-4.3-4.2-4.3z" />
    </>
  ),
  phone: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" />
      <path d="M11 17.5h2" />
    </>
  ),
  wrench: (
    <path d="M15 6.5a4 4 0 0 0-5.2 5.2L4 17.5 6.5 20l5.8-5.8a4 4 0 0 0 5.2-5.2L15 11.5 12.5 9z" />
  ),
  coffee: (
    <path d="M5 9h11v5a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4zM16 10h2a2 2 0 0 1 0 4h-2M8 3v3M12 3v3" />
  ),
}

export const ICON_NAMES = Object.keys(CATEGORY_ICONS)

// What an icon is called by assistive technology: "piggy-bank" as
// "Piggy bank".
export function iconLabel(name: string): string {
  const words = name.replaceAll('-', ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}
