import type { Metadata } from 'next'
import Link from 'next/link'
import { promociones, supermercados } from '@/lib/datos'
import { DIAS, ETIQUETA_DIA, type Dia, type Promocion } from '@/lib/tipos'

export const metadata: Metadata = {
  title: 'Calendario semanal de descuentos',
  description:
    'Grilla de descuentos de supermercados por día de la semana: qué conviene comprar el lunes, martes, miércoles, jueves, viernes, sábado y domingo en cada cadena.',
}

/** Mejor descuento porcentual de la lista; las cuotas no compiten acá. */
function mejorDescuento(promos: Promocion[]): number {
  return promos.reduce((max, p) => {
    if (p.beneficio.tipo !== 'descuento' && p.beneficio.tipo !== 'reintegro') return max
    if (p.segmento !== 'general') return max
    return Math.max(max, p.beneficio.porcentaje)
  }, 0)
}

export default function Calendario() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Calendario semanal</h1>
      <p className="mt-2 max-w-2xl suave">
        Mejor descuento del público general en cada cadena, día por día. Las cuotas sin interés y los beneficios para
        jubilados no entran en esta grilla: mirá el detalle de cada día.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr>
              <th className="p-2 text-left suave font-medium">Supermercado</th>
              {DIAS.map((d) => (
                <th key={d} className="p-2 text-center suave font-medium">
                  <Link href={`/dia/${d}/`} className="hover:underline">
                    {ETIQUETA_DIA[d].slice(0, 3)}
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {supermercados.map((s) => (
              <tr key={s.id} className="border-t" style={{ borderColor: 'var(--borde)' }}>
                <th className="p-2 text-left font-semibold">
                  <Link href={`/supermercados/${s.id}/`} className="hover:underline">
                    <span
                      aria-hidden
                      className="mr-2 inline-block size-2.5 rounded-full align-middle"
                      style={{ background: s.color }}
                    />
                    {s.nombre}
                  </Link>
                </th>
                {DIAS.map((d) => {
                  const promos = promociones.filter((p) => p.supermercado === s.id && p.dias.includes(d as Dia))
                  const max = mejorDescuento(promos)
                  return (
                    <td key={d} className="p-1 text-center">
                      <div
                        className="rounded-md py-2 tabular-nums"
                        style={{
                          // Fondo tenue + borde saturado: legible en tema claro y oscuro,
                          // y la intensidad sigue indicando cuán grande es el descuento.
                          background: max ? `color-mix(in srgb, ${s.color} ${Math.min(max, 30)}%, transparent)` : 'transparent',
                          boxShadow: max >= 20 ? `inset 0 0 0 1.5px ${s.color}` : undefined,
                          fontWeight: max ? 700 : 400,
                        }}
                        title={`${promos.length} promociones`}
                      >
                        {max ? `${max}%` : '—'}
                      </div>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {DIAS.map((d) => (
          <Link key={d} href={`/dia/${d}/`} className="chip">
            Promos del {ETIQUETA_DIA[d].toLowerCase()}
          </Link>
        ))}
      </div>
    </>
  )
}
