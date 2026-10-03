// What the ledger's page control shows between its arrows: `1 2 3 … n`.
// A gap stands for the pages left out before the last one.
export type PageSlot = number | 'gap'

// Three consecutive pages, with the current one in the middle where it can
// be, then the last page. Four pages or fewer are all shown. Never more
// than five slots, so the control keeps to one row of the ledger rail.
export function pageWindow(page: number, totalPages: number): PageSlot[] {
  if (totalPages <= 4) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }
  const start = Math.min(Math.max(page - 1, 1), totalPages - 2)
  const end = start + 2
  const slots: PageSlot[] = [start, start + 1, end]
  if (end < totalPages - 1) slots.push('gap')
  if (end < totalPages) slots.push(totalPages)
  return slots
}
