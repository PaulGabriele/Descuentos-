import promocionesRaw from '../../data/promociones.json'
import supermercadosRaw from '../../data/supermercados.json'
import emisoresRaw from '../../data/emisores.json'
import { datasetSchema, type Dia, type Emisor, type Promocion, type Supermercado } from './tipos'

/**
 * El dataset se valida al importarlo. Si un JSON queda mal, el build falla
 * acá y no en producción.
 */
const dataset = datasetSchema.parse({
  supermercados: supermercadosRaw,
  emisores: emisoresRaw,
  promociones: promocionesRaw,
})

export const supermercados: Supermercado[] = dataset.supermercados
export const emisores: Emisor[] = dataset.emisores
export const promociones: Promocion[] = dataset.promociones

const porIdSuper = new Map(supermercados.map((s) => [s.id, s]))
const porIdEmisor = new Map(emisores.map((e) => [e.id, e]))

export function getSupermercado(id: string): Supermercado | undefined {
  return porIdSuper.get(id)
}

export function getEmisor(id?: string): Emisor | undefined {
  return id ? porIdEmisor.get(id) : undefined
}

export function promosDe(supermercadoId: string): Promocion[] {
  return promociones.filter((p) => p.supermercado === supermercadoId)
}

export function promosDeEmisor(emisorId: string): Promocion[] {
  return promociones.filter((p) => p.emisor === emisorId)
}

export function promosDelDia(dia: Dia): Promocion[] {
  return promociones.filter((p) => p.dias.includes(dia))
}

/** Emisores que efectivamente tienen alguna promo cargada. */
export function emisoresConPromos(): Emisor[] {
  const usados = new Set(promociones.map((p) => p.emisor).filter(Boolean))
  return emisores.filter((e) => usados.has(e.id))
}

/** Fecha de la verificación más reciente del dataset (YYYY-MM-DD). */
export const ultimaActualizacion: string = promociones
  .map((p) => p.fuente.verificadoEl)
  .sort()
  .at(-1)!
