export type DayCell = {
  date: string
  day: number
  inMonth: boolean
}

// ISO dates as UTC midnights, so a DST change cannot shift a day.
export function utc(isoDate: string): number {
  const [year, month, date] = isoDate.split('-').map(Number)
  return Date.UTC(year, month - 1, date)
}

function iso(time: number): string {
  return new Date(time).toISOString().slice(0, 10)
}

// The six weeks that show a month, Monday first, padded with the days of
// the months around it. `month` is 1 to 12, as in an ISO date.
export function calendarMonth(year: number, month: number): DayCell[] {
  const lead = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7
  return Array.from({ length: 42 }, (_, i) => {
    const day = new Date(Date.UTC(year, month - 1, 1 - lead + i))
    return {
      date: iso(day.getTime()),
      day: day.getUTCDate(),
      inMonth: day.getUTCMonth() === month - 1,
    }
  })
}

export function addDays(isoDate: string, days: number): string {
  const [year, month, date] = isoDate.split('-').map(Number)
  return iso(Date.UTC(year, month - 1, date + days))
}

// The same day in another month, or that month's last day when it is
// shorter: Jan 31 plus one month is Feb 28.
export function addMonths(isoDate: string, months: number): string {
  const [year, month, date] = isoDate.split('-').map(Number)
  const lastDay = new Date(Date.UTC(year, month + months, 0)).getUTCDate()
  return iso(Date.UTC(year, month - 1 + months, Math.min(date, lastDay)))
}
