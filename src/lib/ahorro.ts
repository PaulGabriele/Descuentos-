import type { Beneficio, Promocion } from './tipos'

/**
 * Costo de oportunidad mensual usado para valuar las cuotas sin interés.
 * Es el rendimiento que obtendrías con la plata que no adelantás (plazo fijo,
 * money market). Configurable desde la UI porque cambia seguido.
 */
export const TASA_MENSUAL_POR_DEFECTO = 0.025

export type ResultadoAhorro = {
  /** Ahorro estimado en pesos para el ticket dado, o null si no es estimable. */
  ahorro: number | null
  /** Ahorro sobre el ticket, en porcentaje. null si no es estimable. */
  ahorroEfectivo: number | null
  aplica: boolean
  /** Por qué no aplica o por qué el ahorro es menor al nominal. */
  motivo?: string
}

const NO_APLICA = (motivo: string): ResultadoAhorro => ({
  ahorro: 0,
  ahorroEfectivo: 0,
  aplica: false,
  motivo,
})

/**
 * Valor presente de pagar `ticket` en `n` cuotas iguales sin interés.
 * La primera cuota se paga hoy, así que solo se descuentan n-1 períodos.
 */
export function valorPresenteCuotas(ticket: number, n: number, tasaMensual: number): number {
  const cuota = ticket / n
  let vp = 0
  for (let k = 0; k < n; k++) vp += cuota / Math.pow(1 + tasaMensual, k)
  return vp
}

function ahorroNominal(beneficio: Beneficio, ticket: number, tasaMensual: number): number | null {
  switch (beneficio.tipo) {
    case 'descuento':
    case 'reintegro':
      return (ticket * beneficio.porcentaje) / 100
    case 'cuotas':
      return ticket - valorPresenteCuotas(ticket, beneficio.cuotas, tasaMensual)
    // Dependen de qué productos entren en el carrito: no se estiman sobre el ticket.
    case '2x1':
    case '3x2':
    case 'segunda-unidad':
      return null
  }
}

/**
 * Estima el ahorro de una promo para una compra de `ticket` pesos.
 *
 * Supuesto explícito sobre los topes: se asume que el cupo del período
 * (semanal/mensual) está intacto. Es el mejor caso; la UI lo aclara.
 */
export function calcularAhorro(
  promo: Promocion,
  ticket: number,
  tasaMensual: number = TASA_MENSUAL_POR_DEFECTO,
): ResultadoAhorro {
  if (ticket <= 0) return NO_APLICA('Ingresá un monto de compra')

  if (promo.minimoCompra && ticket < promo.minimoCompra) {
    return NO_APLICA(`Requiere una compra mínima de ${formatearPesos(promo.minimoCompra)}`)
  }

  const nominal = ahorroNominal(promo.beneficio, ticket, tasaMensual)
  if (nominal === null) {
    return { ahorro: null, ahorroEfectivo: null, aplica: true, motivo: 'Depende de los productos del carrito' }
  }

  let ahorro = nominal
  let motivo: string | undefined
  if (promo.tope && ahorro > promo.tope.monto) {
    ahorro = promo.tope.monto
    motivo = `Limitado por el tope de ${formatearPesos(promo.tope.monto)} ${etiquetaPeriodo(promo.tope.periodo)}`
  }

  return { ahorro, ahorroEfectivo: (ahorro / ticket) * 100, aplica: true, motivo }
}

/**
 * Monto de compra a partir del cual el tope empieza a "comerse" el beneficio.
 * Es el ticket óptimo: gastar más no suma reintegro.
 */
export function ticketOptimo(promo: Promocion): number | null {
  if (!promo.tope) return null
  const b = promo.beneficio
  if (b.tipo !== 'descuento' && b.tipo !== 'reintegro') return null
  return Math.round((promo.tope.monto * 100) / b.porcentaje)
}

export function etiquetaPeriodo(periodo: NonNullable<Promocion['tope']>['periodo']): string {
  return { transaccion: 'por transacción', diario: 'por día', semanal: 'por semana', mensual: 'por mes' }[periodo]
}

export function etiquetaBeneficio(beneficio: Beneficio): string {
  switch (beneficio.tipo) {
    case 'descuento':
      return `${beneficio.porcentaje}% de descuento`
    case 'reintegro':
      return `${beneficio.porcentaje}% de reintegro`
    case 'cuotas':
      return `${beneficio.cuotas} cuotas ${beneficio.sinInteres ? 'sin interés' : ''}`.trim()
    case '2x1':
      return '2x1'
    case '3x2':
      return '3x2'
    case 'segunda-unidad':
      return `2da unidad al ${beneficio.porcentaje}%`
  }
}

export function formatearPesos(monto: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(monto)
}

/** Ordena promos por ahorro estimado; las no estimables van al final. */
export function ordenarPorAhorro(
  promos: Promocion[],
  ticket: number,
  tasaMensual: number = TASA_MENSUAL_POR_DEFECTO,
): Promocion[] {
  return [...promos].sort((a, b) => {
    const ra = calcularAhorro(a, ticket, tasaMensual)
    const rb = calcularAhorro(b, ticket, tasaMensual)
    const va = ra.aplica ? (ra.ahorro ?? -1) : -2
    const vb = rb.aplica ? (rb.ahorro ?? -1) : -2
    return vb - va
  })
}
