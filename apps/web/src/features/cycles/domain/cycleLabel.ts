import type { CurrentCycle } from './cycle'

const DAY_MS = 86_400_000

// ISO dates as UTC midnights, so a DST change inside the cycle cannot
// shift a day count.
function utc(isoDate: string): number {
  const [year, month, date] = isoDate.split('-').map(Number)
  return Date.UTC(year, month - 1, date)
}

function short(time: number): string {
  return new Date(time).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  })
}

export type CycleLabel = {
  day: number
  length: number
  range: string
}

// How the header states the cycle: "Day 1 of 30" and "Sep 30 - Oct 29".
// `ends_on` is the next cycle's first day, so the range stops a day before.
export function cycleLabel(
  cycle: Pick<CurrentCycle, 'starts_on' | 'ends_on'>,
  today: string,
): CycleLabel {
  const start = utc(cycle.starts_on)
  const end = utc(cycle.ends_on)
  return {
    day: Math.round((utc(today) - start) / DAY_MS) + 1,
    length: Math.round((end - start) / DAY_MS),
    range: `${short(start)} - ${short(end - DAY_MS)}`,
  }
}
