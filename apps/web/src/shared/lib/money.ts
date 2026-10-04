// The one money format: "$" prefix, en-US separators, cents only when they
// are not zero. Negatives carry "−" before the symbol; `sign: 'always'` also
// marks positives with "+", for places that show both directions together.
export function formatCents(
  cents: number,
  { sign }: { sign?: 'always' } = {},
): string {
  const digits = (Math.abs(cents) / 100).toLocaleString('en-US', {
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })
  const prefix = cents < 0 ? '−' : cents > 0 && sign === 'always' ? '+' : ''
  return `${prefix}$${digits}`
}

// What an amount field keeps of typed or pasted text: the digits and the
// first period, two cents digits at most, no leading zeros. Still text, so a
// half-typed "1234." survives.
export function amountDigits(text: string): string {
  const kept = text.replace(/[^\d.]/g, '')
  const period = kept.indexOf('.')
  const whole = (period < 0 ? kept : kept.slice(0, period)).replace(
    /^0+(?=\d)/,
    '',
  )
  if (period < 0) return whole
  const cents = kept.slice(period + 1).replaceAll('.', '').slice(0, 2)
  return `${whole || '0'}.${cents}`
}

// The same separators as `formatCents`, on an amount that is still being
// typed.
export function groupAmount(digits: string): string {
  const [whole, cents] = digits.split('.')
  const grouped = whole.replace(/\B(?=(\d{3})+$)/g, ',')
  return cents === undefined ? grouped : `${grouped}.${cents}`
}

// Amounts never wrap; a long one steps down in size instead. By character
// count, because the box does not know how long the text is.
export function amountScale(text: string): 'l' | 'm' | 's' {
  if (text.length <= 11) return 'l'
  if (text.length <= 15) return 'm'
  return 's'
}

function isoDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

export function today(): string {
  return isoDate(new Date())
}
