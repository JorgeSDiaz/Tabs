import { describe, expect, it } from 'vitest'
import { amountDigits, amountScale, formatCents, groupAmount } from './money'

describe('formatCents', () => {
  it('drops the cents when they are zero', () => {
    expect(formatCents(265015000)).toBe('$2,650,150')
    expect(formatCents(0)).toBe('$0')
  })

  it('keeps the cents when present', () => {
    expect(formatCents(123450)).toBe('$1,234.50')
    expect(formatCents(5)).toBe('$0.05')
  })

  it('puts the minus before the symbol', () => {
    expect(formatCents(-18430000)).toBe('−$184,300')
    expect(formatCents(-123450)).toBe('−$1,234.50')
  })

  it('signs both directions when asked', () => {
    expect(formatCents(25000000, { sign: 'always' })).toBe('+$250,000')
    expect(formatCents(-18430000, { sign: 'always' })).toBe('−$184,300')
    expect(formatCents(0, { sign: 'always' })).toBe('$0')
  })
})

describe('amountDigits', () => {
  it.each([
    ['4324800', '4324800'],
    ['1234.567', '1234.56'],
    ['1234.', '1234.'],
    ['007', '7'],
    ['0', '0'],
    ['00', '0'],
    ['0.05', '0.05'],
    ['.5', '0.5'],
    ['$1,234.50', '1234.50'],
    ['12a-3', '123'],
    ['1.2.34', '1.23'],
    ['12.34.', '12.34'],
    ['', ''],
  ])('keeps %j as %j', (text, digits) => {
    expect(amountDigits(text)).toBe(digits)
  })
})

describe('groupAmount', () => {
  it.each([
    ['', ''],
    ['123', '123'],
    ['1234', '1,234'],
    ['4324800', '4,324,800'],
    ['1234.', '1,234.'],
    ['1234.5', '1,234.5'],
    ['0.05', '0.05'],
  ])('shows %j as %j', (digits, shown) => {
    expect(groupAmount(digits)).toBe(shown)
  })
})

describe('amountScale', () => {
  it('steps down as the text gets longer', () => {
    expect(amountScale('$2,650,150')).toBe('l')
    expect(amountScale('+$3,050,000')).toBe('l')
    expect(amountScale('−$184,300.50')).toBe('m')
    expect(amountScale('$12,333,333,333')).toBe('m')
    expect(amountScale('+$12,333,333,333')).toBe('s')
  })
})
