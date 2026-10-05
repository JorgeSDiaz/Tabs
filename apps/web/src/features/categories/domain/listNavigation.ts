// Where a key moves the active row of an open list. The ends do not wrap.
// Null when the key does not move the row.
export function stepRow(
  key: string,
  active: number,
  count: number,
): number | null {
  if (count <= 0) return null
  switch (key) {
    case 'ArrowDown':
      return Math.min(active + 1, count - 1)
    case 'ArrowUp':
      return Math.max(active - 1, 0)
    case 'Home':
      return 0
    case 'End':
      return count - 1
    default:
      return null
  }
}

// A name as the search compares it: lowercased, with its accents removed.
function fold(name: string): string {
  return name.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()
}

// The entries whose name contains the typed text, whatever its case or
// accents, in the order given. An empty text keeps them all.
export function matching<T extends { name: string }>(
  entries: T[],
  typed: string,
): T[] {
  const sought = fold(typed)
  return entries.filter((entry) => fold(entry.name).includes(sought))
}

// The first name that starts with the typed text, compared the same way.
// -1 when none does.
export function firstStartingWith(names: string[], typed: string): number {
  const prefix = fold(typed)
  if (prefix === '') return -1
  return names.findIndex((name) => fold(name).startsWith(prefix))
}
