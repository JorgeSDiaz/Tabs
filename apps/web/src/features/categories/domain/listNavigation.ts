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

// The first name that starts with the typed letters, whatever their case.
// -1 when none does.
export function firstStartingWith(names: string[], typed: string): number {
  const prefix = typed.toLowerCase()
  if (prefix === '') return -1
  return names.findIndex((name) => name.toLowerCase().startsWith(prefix))
}
