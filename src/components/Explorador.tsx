'use client'

import { useEffect, useMemo, useState } from 'react'
import { PromoCard } from './PromoCard'
import { ordenarPorAhorro, TASA_MENSUAL_POR_DEFECTO, calcularAhorro, formatearPesos } from '@/lib/ahorro'
import { DIAS, ETIQUETA_DIA, type Dia, type Emisor, type Promocion, type Supermercado } from '@/lib/tipos'
import { diaDeHoy } from '@/lib/fechas'

type TipoBeneficio = 'descuento' | 'cuotas' | 'producto'
type Segmento = 'todos' | 'general' | 'jubilados'

const TIPOS: { id: TipoBeneficio; etiqueta: string }[] = [
  { id: 'descuento', etiqueta: 'Descuentos y reintegros' },
  { id: 'cuotas', etiqueta: 'Cuotas sin interés' },
  { id: 'producto', etiqueta: '2x1, 3x2 y 2da unidad' },
]

function tipoDe(p: Promocion): TipoBeneficio {
  if (p.beneficio.tipo === 'descuento' || p.beneficio.tipo === 'reintegro') return 'descuento'
  if (p.beneficio.tipo === 'cuotas') return 'cuotas'
  return 'producto'
}

function alternar<T>(conjunto: Set<T>, valor: T): Set<T> {
  const nuevo = new Set(conjunto)
  if (!nuevo.delete(valor)) nuevo.add(valor)
  return nuevo
}

export function Explorador({
  promociones,
  supermercados,
  emisores,
  diaInicial,
  autoDiaHoy = false,
  fijarSupermercado,
}: {
  promociones: Promocion[]
  supermercados: Supermercado[]
  emisores: Emisor[]
  diaInicial: Dia | 'todos'
  /**
   * El sitio se genera estático, así que "hoy" se resuelve en el navegador:
   * si no viene un día en la URL, se arranca con el día real del visitante.
   */
  autoDiaHoy?: boolean
  /** Cuando la página ya es de una cadena, el filtro de supermercado se oculta. */
  fijarSupermercado?: string
}) {
  const [dia, setDia] = useState<Dia | 'todos'>(diaInicial)
  const [supers, setSupers] = useState<Set<string>>(new Set())
  const [emis, setEmis] = useState<Set<string>>(new Set())
  const [tipos, setTipos] = useState<Set<TipoBeneficio>>(new Set())
  const [segmento, setSegmento] = useState<Segmento>('todos')
  const [ticket, setTicket] = useState(60000)
  const [tasa, setTasa] = useState(TASA_MENSUAL_POR_DEFECTO * 100)

  // El estado del filtro vive en la URL para que un resultado se pueda compartir.
  useEffect(() => {
    const q = new URLSearchParams()
    if (dia !== 'todos') q.set('dia', dia)
    if (supers.size) q.set('super', [...supers].join(','))
    if (emis.size) q.set('emisor', [...emis].join(','))
    if (tipos.size) q.set('tipo', [...tipos].join(','))
    if (segmento !== 'todos') q.set('segmento', segmento)
    if (ticket !== 60000) q.set('ticket', String(ticket))
    const query = q.toString()
    window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname)
  }, [dia, supers, emis, tipos, segmento, ticket])

  useEffect(() => {
    const q = new URLSearchParams(window.location.search)
    const d = q.get('dia') as Dia | null
    if (d && (DIAS as readonly string[]).includes(d)) setDia(d)
    else if (autoDiaHoy) setDia(diaDeHoy())
    if (q.get('super')) setSupers(new Set(q.get('super')!.split(',')))
    if (q.get('emisor')) setEmis(new Set(q.get('emisor')!.split(',')))
    if (q.get('tipo')) setTipos(new Set(q.get('tipo')!.split(',') as TipoBeneficio[]))
    const s = q.get('segmento')
    if (s === 'general' || s === 'jubilados') setSegmento(s)
    const t = Number(q.get('ticket'))
    if (Number.isFinite(t) && t > 0) setTicket(t)
    // Solo al montar: la URL inicial manda.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const filtradas = useMemo(() => {
    const resultado = promociones.filter((p) => {
      if (dia !== 'todos' && !p.dias.includes(dia)) return false
      if (supers.size && !supers.has(p.supermercado)) return false
      if (emis.size && (!p.emisor || !emis.has(p.emisor))) return false
      if (tipos.size && !tipos.has(tipoDe(p))) return false
      if (segmento === 'general' && p.segmento !== 'general') return false
      if (segmento === 'jubilados' && p.segmento !== 'jubilados') return false
      return true
    })
    return ordenarPorAhorro(resultado, ticket, tasa / 100)
  }, [promociones, dia, supers, emis, tipos, segmento, ticket, tasa])

  const mejor = filtradas.find((p) => {
    const r = calcularAhorro(p, ticket, tasa / 100)
    return r.aplica && r.ahorro !== null && r.ahorro > 0
  })
  const ahorroMejor = mejor ? calcularAhorro(mejor, ticket, tasa / 100) : null

  const superPorId = new Map(supermercados.map((s) => [s.id, s]))
  const emisorPorId = new Map(emisores.map((e) => [e.id, e]))
  const hayFiltros = supers.size > 0 || emis.size > 0 || tipos.size > 0 || segmento !== 'todos' || dia !== 'todos'

  return (
    <div>
      <section className="tarjeta mb-5 p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div>
            <label className="suave text-xs" htmlFor="ticket">
              ¿Cuánto pensás gastar?
            </label>
            <div className="mt-1 flex items-center gap-3">
              <input
                id="ticket"
                type="range"
                min={10000}
                max={400000}
                step={5000}
                value={ticket}
                onChange={(e) => setTicket(Number(e.target.value))}
                className="w-full"
              />
              <span className="whitespace-nowrap font-semibold tabular-nums">{formatearPesos(ticket)}</span>
            </div>
          </div>
          <div className="sm:w-44">
            <label className="suave text-xs" htmlFor="tasa">
              Tasa mensual para valuar cuotas
            </label>
            <div className="mt-1 flex items-center gap-2">
              <input
                id="tasa"
                type="number"
                min={0}
                max={20}
                step={0.5}
                value={tasa}
                onChange={(e) => setTasa(Number(e.target.value))}
                className="campo tabular-nums"
              />
              <span className="suave text-sm">%</span>
            </div>
          </div>
        </div>

        {mejor && ahorroMejor?.ahorro != null && (
          <p className="mt-3 text-sm">
            Con {formatearPesos(ticket)} la mejor opción es{' '}
            <strong>{superPorId.get(mejor.supermercado)?.nombre}</strong>
            {mejor.emisor && <> con {emisorPorId.get(mejor.emisor)?.nombre}</>}:{' '}
            <strong style={{ color: 'var(--acento)' }}>ahorrás {formatearPesos(Math.round(ahorroMejor.ahorro))}</strong>.
          </p>
        )}
      </section>

      <section className="mb-5 space-y-3">
        <Grupo titulo="Día">
          <Chip activo={dia === 'todos'} onClick={() => setDia('todos')}>
            Cualquier día
          </Chip>
          {DIAS.map((d) => (
            <Chip key={d} activo={dia === d} onClick={() => setDia(d)}>
              {ETIQUETA_DIA[d]}
            </Chip>
          ))}
        </Grupo>

        {!fijarSupermercado && (
          <Grupo titulo="Supermercado">
            {supermercados.map((s) => (
              <Chip key={s.id} activo={supers.has(s.id)} onClick={() => setSupers(alternar(supers, s.id))}>
                {s.nombre}
              </Chip>
            ))}
          </Grupo>
        )}

        <Grupo titulo="Banco o billetera">
          {emisores.map((e) => (
            <Chip key={e.id} activo={emis.has(e.id)} onClick={() => setEmis(alternar(emis, e.id))}>
              {e.nombre}
            </Chip>
          ))}
        </Grupo>

        <Grupo titulo="Tipo de promo">
          {TIPOS.map((t) => (
            <Chip key={t.id} activo={tipos.has(t.id)} onClick={() => setTipos(alternar(tipos, t.id))}>
              {t.etiqueta}
            </Chip>
          ))}
          <Chip activo={segmento === 'jubilados'} onClick={() => setSegmento(segmento === 'jubilados' ? 'todos' : 'jubilados')}>
            Jubilados
          </Chip>
        </Grupo>
      </section>

      <div className="mb-3 flex items-center justify-between text-sm suave">
        <span>
          {filtradas.length} {filtradas.length === 1 ? 'promoción' : 'promociones'}
          {dia !== 'todos' && ` para el ${ETIQUETA_DIA[dia as Dia].toLowerCase()}`}
        </span>
        {hayFiltros && (
          <button
            className="chip"
            onClick={() => {
              setDia('todos')
              setSupers(new Set())
              setEmis(new Set())
              setTipos(new Set())
              setSegmento('todos')
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {filtradas.length === 0 ? (
        <p className="tarjeta p-6 text-center suave">
          No hay promociones cargadas con esos filtros. Probá quitando alguno.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtradas.map((p) => (
            <PromoCard
              key={p.id}
              promo={p}
              supermercado={superPorId.get(p.supermercado)}
              emisor={emisorPorId.get(p.emisor ?? '')}
              ticket={ticket}
              tasaMensual={tasa / 100}
              mostrarSuper={!fijarSupermercado}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="suave mb-1.5 text-xs uppercase tracking-wide">{titulo}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  )
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" className="chip" data-activo={activo} aria-pressed={activo} onClick={onClick}>
      {children}
    </button>
  )
}
