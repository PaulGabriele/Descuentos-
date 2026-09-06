import { describe, expect, it } from 'vitest'
import {
  calcularAhorro,
  etiquetaBeneficio,
  ordenarPorAhorro,
  ticketOptimo,
  valorPresenteCuotas,
} from '../src/lib/ahorro'
import type { Promocion } from '../src/lib/tipos'

const base: Promocion = {
  id: 'test',
  supermercado: 'coto',
  emisor: 'banco-nacion',
  beneficio: { tipo: 'descuento', porcentaje: 20 },
  dias: ['martes'],
  mediosDePago: ['QR MODO'],
  canales: ['sucursal'],
  segmento: 'general',
  vigencia: { desde: '2026-09-01', hasta: '2026-09-30' },
  requisitos: [],
  exclusiones: [],
  fuente: { url: 'https://ejemplo.com', medio: 'Test', tipo: 'prensa', verificadoEl: '2026-09-06' },
  confianza: 'alta',
}

const con = (cambios: Partial<Promocion>): Promocion => ({ ...base, ...cambios })

describe('calcularAhorro', () => {
  it('aplica el porcentaje cuando no hay tope', () => {
    expect(calcularAhorro(base, 100_000).ahorro).toBe(20_000)
  })

  it('recorta el ahorro al tope', () => {
    const promo = con({ tope: { monto: 15_000, periodo: 'semanal' } })
    const r = calcularAhorro(promo, 200_000)
    expect(r.ahorro).toBe(15_000)
    expect(r.motivo).toContain('tope')
  })

  it('no aplica por debajo de la compra mínima', () => {
    const promo = con({ minimoCompra: 75_000 })
    const r = calcularAhorro(promo, 50_000)
    expect(r.aplica).toBe(false)
    expect(r.ahorro).toBe(0)
  })

  it('aplica justo en la compra mínima', () => {
    const promo = con({ minimoCompra: 75_000 })
    expect(calcularAhorro(promo, 75_000).aplica).toBe(true)
  })

  it('valúa las cuotas sin interés por costo de oportunidad', () => {
    const promo = con({ beneficio: { tipo: 'cuotas', cuotas: 6, sinInteres: true } })
    const r = calcularAhorro(promo, 120_000, 0.03)
    expect(r.ahorro).toBeGreaterThan(0)
    // Nunca puede superar el ticket ni acercarse al descuento nominal de un 20%.
    expect(r.ahorro!).toBeLessThan(120_000 * 0.2)
  })

  it('con tasa cero las cuotas no generan ahorro', () => {
    const promo = con({ beneficio: { tipo: 'cuotas', cuotas: 12, sinInteres: true } })
    expect(calcularAhorro(promo, 100_000, 0).ahorro).toBeCloseTo(0, 6)
  })

  it('no estima ahorro en promos de producto', () => {
    const promo = con({ beneficio: { tipo: '2x1' } })
    const r = calcularAhorro(promo, 100_000)
    expect(r.aplica).toBe(true)
    expect(r.ahorro).toBeNull()
  })

  it('rechaza tickets no positivos', () => {
    expect(calcularAhorro(base, 0).aplica).toBe(false)
  })
})

describe('valorPresenteCuotas', () => {
  it('con tasa cero el valor presente es el total', () => {
    expect(valorPresenteCuotas(60_000, 6, 0)).toBeCloseTo(60_000, 6)
  })

  it('más cuotas valen menos hoy', () => {
    expect(valorPresenteCuotas(60_000, 12, 0.03)).toBeLessThan(valorPresenteCuotas(60_000, 3, 0.03))
  })
})

describe('ticketOptimo', () => {
  it('devuelve el monto que agota el tope', () => {
    const promo = con({ tope: { monto: 20_000, periodo: 'mensual' } })
    expect(ticketOptimo(promo)).toBe(100_000)
  })

  it('es null sin tope', () => {
    expect(ticketOptimo(base)).toBeNull()
  })
})

describe('ordenarPorAhorro', () => {
  it('pone primero la promo que más ahorra para ese ticket', () => {
    const chica = con({ id: 'chica', beneficio: { tipo: 'descuento', porcentaje: 35 }, tope: { monto: 5_000, periodo: 'mensual' } })
    const grande = con({ id: 'grande', beneficio: { tipo: 'descuento', porcentaje: 20 } })
    const [primera] = ordenarPorAhorro([chica, grande], 100_000)
    expect(primera.id).toBe('grande')
  })

  it('deja al final las que no aplican', () => {
    const noAplica = con({ id: 'no-aplica', minimoCompra: 500_000 })
    const orden = ordenarPorAhorro([noAplica, base], 100_000)
    expect(orden.at(-1)!.id).toBe('no-aplica')
  })
})

describe('etiquetaBeneficio', () => {
  it('describe cada tipo de beneficio', () => {
    expect(etiquetaBeneficio({ tipo: 'descuento', porcentaje: 20 })).toBe('20% de descuento')
    expect(etiquetaBeneficio({ tipo: 'cuotas', cuotas: 6, sinInteres: true })).toBe('6 cuotas sin interés')
    expect(etiquetaBeneficio({ tipo: 'segunda-unidad', porcentaje: 70 })).toBe('2da unidad al 70%')
  })
})
