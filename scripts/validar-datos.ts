/**
 * Valida el dataset antes de buildear. Corre en CI y en `npm run build`.
 *
 *  - schema (zod)
 *  - integridad referencial: toda promo apunta a un supermercado y emisor existentes
 *  - ids únicos
 *  - vigencias vencidas y verificaciones viejas (avisos, no errores)
 */
import { readFileSync } from 'node:fs'
import { datasetSchema } from '../src/lib/tipos'

const leer = (archivo: string) => JSON.parse(readFileSync(new URL(`../data/${archivo}`, import.meta.url), 'utf8'))

const DIAS_PARA_AVISAR = 14

const errores: string[] = []
const avisos: string[] = []

const parseo = datasetSchema.safeParse({
  supermercados: leer('supermercados.json'),
  emisores: leer('emisores.json'),
  promociones: leer('promociones.json'),
})

if (!parseo.success) {
  for (const issue of parseo.error.issues) {
    errores.push(`${issue.path.join('.')}: ${issue.message}`)
  }
} else {
  const { supermercados, emisores, promociones } = parseo.data
  const idsSuper = new Set(supermercados.map((s) => s.id))
  const idsEmisor = new Set(emisores.map((e) => e.id))
  const vistos = new Set<string>()
  const hoy = new Date().toISOString().slice(0, 10)

  for (const p of promociones) {
    if (vistos.has(p.id)) errores.push(`promoción duplicada: ${p.id}`)
    vistos.add(p.id)

    if (!idsSuper.has(p.supermercado)) errores.push(`${p.id}: supermercado desconocido "${p.supermercado}"`)
    if (p.emisor && !idsEmisor.has(p.emisor)) errores.push(`${p.id}: emisor desconocido "${p.emisor}"`)
    if (p.vigencia.hasta && p.vigencia.hasta < p.vigencia.desde) errores.push(`${p.id}: la vigencia termina antes de empezar`)
    if (new Set(p.dias).size !== p.dias.length) errores.push(`${p.id}: días repetidos`)

    if (p.vigencia.hasta && p.vigencia.hasta < hoy) avisos.push(`${p.id}: venció el ${p.vigencia.hasta}`)

    const dias = Math.floor((Date.parse(hoy) - Date.parse(p.fuente.verificadoEl)) / 86_400_000)
    if (dias > DIAS_PARA_AVISAR) avisos.push(`${p.id}: sin verificar hace ${dias} días`)
    if (p.confianza === 'baja') avisos.push(`${p.id}: confianza baja (${p.fuente.medio})`)
  }

  const sinPromos = supermercados.filter((s) => !promociones.some((p) => p.supermercado === s.id))
  for (const s of sinPromos) avisos.push(`${s.nombre}: no tiene promociones cargadas`)

  console.log(
    `Dataset: ${supermercados.length} supermercados, ${emisores.length} emisores, ${promociones.length} promociones.`,
  )
}

for (const a of avisos) console.warn(`  aviso  ${a}`)
for (const e of errores) console.error(`  ERROR  ${e}`)

if (errores.length) {
  console.error(`\n${errores.length} error(es) en el dataset.`)
  process.exit(1)
}
console.log(`Validación OK${avisos.length ? ` (${avisos.length} aviso(s))` : ''}.`)
