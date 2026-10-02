import { describe, expect, it } from 'vitest'
import { amountScale, formatCents } from './money'

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

describe('amountScale', () => {
  it('steps down as the text gets longer', () => {
    expect(amountScale('$2,650,150')).toBe('l')
    expect(amountScale('+$3,050,000')).toBe('l')
    expect(amountScale('−$184,300.50')).toBe('m')
    expect(amountScale('$12,333,333,333')).toBe('m')
    expect(amountScale('+$12,333,333,333')).toBe('s')
  })
})
