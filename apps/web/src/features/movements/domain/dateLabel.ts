import { utc } from './calendarMonth'

function format(isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(utc(isoDate)).toLocaleDateString('en-US', {
    ...options,
    timeZone: 'UTC',
  })
}

// What the date field reads: "Today", or "Mon, Sep 14" for any other day.
export function fieldLabel(isoDate: string, today: string): string {
  if (isoDate === today) return 'Today'
  return format(isoDate, { weekday: 'short', month: 'short', day: 'numeric' })
}

// What a calendar day announces: "Monday, September 14, 2026", and today
// says that it is today.
export function dayLabel(isoDate: string, today: string): string {
  const full = format(isoDate, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return isoDate === today ? `${full}, today` : full
}

// The calendar's title: "September 2026".
export function monthLabel(isoDate: string): string {
  return format(isoDate, { month: 'long', year: 'numeric' })
}
