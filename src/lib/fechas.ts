import { DIAS, type Dia } from './tipos'

/**
 * Día de la semana en Argentina (America/Argentina/Buenos_Aires).
 * Se calcula con Intl para no depender de la zona horaria del servidor
 * que hace el build ni del navegador del visitante.
 */
export function diaDeHoy(fecha: Date = new Date()): Dia {
  const nombre = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    timeZone: 'America/Argentina/Buenos_Aires',
  }).format(fecha)
  const mapa: Record<string, Dia> = {
    Monday: 'lunes',
    Tuesday: 'martes',
    Wednesday: 'miercoles',
    Thursday: 'jueves',
    Friday: 'viernes',
    Saturday: 'sabado',
    Sunday: 'domingo',
  }
  return mapa[nombre] ?? DIAS[0]
}

export function formatearFecha(iso: string): string {
  const [a, m, d] = iso.split('-').map(Number)
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(a, m - 1, d)),
  )
}

/** Días transcurridos desde una fecha ISO hasta hoy. */
export function diasDesde(iso: string, hoy: Date = new Date()): number {
  const [a, m, d] = iso.split('-').map(Number)
  const ms = hoy.getTime() - Date.UTC(a, m - 1, d)
  return Math.floor(ms / 86_400_000)
}

/** true si la promo ya venció respecto de la fecha dada. */
export function estaVencida(hasta: string | undefined, hoy: Date = new Date()): boolean {
  if (!hasta) return false
  return diasDesde(hasta, hoy) > 0
}
