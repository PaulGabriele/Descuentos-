import { z } from 'zod'

export const DIAS = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'] as const
export type Dia = (typeof DIAS)[number]

export const ETIQUETA_DIA: Record<Dia, string> = {
  lunes: 'Lunes',
  martes: 'Martes',
  miercoles: 'Miércoles',
  jueves: 'Jueves',
  viernes: 'Viernes',
  sabado: 'Sábado',
  domingo: 'Domingo',
}

const slug = z.string().regex(/^[a-z0-9-]+$/, 'debe ser un slug en minúsculas')
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'debe ser una fecha YYYY-MM-DD')

export const supermercadoSchema = z.object({
  id: slug,
  nombre: z.string(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sitio: z.url(),
  /** Página oficial donde la cadena publica sus promociones bancarias. */
  paginaPromos: z.url(),
  /** Folleto/catálogo semanal: es donde viven los 2x1, 3x2 y segundas unidades. */
  folleto: z.url().optional(),
  grupo: z.string().optional(),
})
export type Supermercado = z.infer<typeof supermercadoSchema>

export const emisorSchema = z.object({
  id: slug,
  nombre: z.string(),
  tipo: z.enum(['banco', 'billetera', 'tarjeta', 'programa']),
  sitio: z.url().optional(),
  /** Otras formas de nombrarlo que aparecen en la comunicación de las cadenas. */
  alias: z.array(z.string()).default([]),
})
export type Emisor = z.infer<typeof emisorSchema>

/** Qué te dan. Discriminado por `tipo` para que el cálculo de ahorro sea exhaustivo. */
export const beneficioSchema = z.discriminatedUnion('tipo', [
  z.object({ tipo: z.literal('descuento'), porcentaje: z.number().min(1).max(100) }),
  z.object({ tipo: z.literal('reintegro'), porcentaje: z.number().min(1).max(100) }),
  z.object({
    tipo: z.literal('cuotas'),
    cuotas: z.number().int().min(2).max(24),
    sinInteres: z.boolean().default(true),
  }),
  z.object({ tipo: z.literal('2x1') }),
  z.object({ tipo: z.literal('3x2') }),
  z.object({ tipo: z.literal('segunda-unidad'), porcentaje: z.number().min(1).max(100) }),
])
export type Beneficio = z.infer<typeof beneficioSchema>

export const topeSchema = z.object({
  monto: z.number().positive(),
  periodo: z.enum(['transaccion', 'diario', 'semanal', 'mensual']),
})
export type Tope = z.infer<typeof topeSchema>

export const promocionSchema = z.object({
  id: slug,
  supermercado: slug,
  /** Ausente en promos de la propia cadena (folleto, programa de fidelidad). */
  emisor: slug.optional(),
  beneficio: beneficioSchema,
  dias: z.array(z.enum(DIAS)).min(1),
  mediosDePago: z.array(z.string()).min(1),
  tope: topeSchema.optional(),
  minimoCompra: z.number().positive().optional(),
  canales: z.array(z.enum(['sucursal', 'online', 'app'])).min(1),
  /** A quién le aplica: público general o un segmento con requisitos propios. */
  segmento: z.enum(['general', 'jubilados', 'clientes']).default('general'),
  vigencia: z.object({ desde: fecha, hasta: fecha.optional() }),
  requisitos: z.array(z.string()).default([]),
  exclusiones: z.array(z.string()).default([]),
  notas: z.string().optional(),
  fuente: z.object({
    url: z.url(),
    medio: z.string(),
    /** 'oficial' = la propia cadena o el banco. 'prensa' = medio periodístico. */
    tipo: z.enum(['oficial', 'prensa']),
    verificadoEl: fecha,
  }),
  /** Cuánto confiamos en el dato. La UI degrada visualmente lo que no es alto. */
  confianza: z.enum(['alta', 'media', 'baja']).default('media'),
})
export type Promocion = z.infer<typeof promocionSchema>

export const datasetSchema = z.object({
  supermercados: z.array(supermercadoSchema).min(1),
  emisores: z.array(emisorSchema).min(1),
  promociones: z.array(promocionSchema).min(1),
})
export type Dataset = z.infer<typeof datasetSchema>
