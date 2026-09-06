import { calcularAhorro, etiquetaBeneficio, etiquetaPeriodo, formatearPesos, ticketOptimo } from '@/lib/ahorro'
import { ETIQUETA_DIA, type Emisor, type Promocion, type Supermercado } from '@/lib/tipos'
import { estaVencida } from '@/lib/fechas'

const ETIQUETA_SEGMENTO: Record<Promocion['segmento'], string | null> = {
  general: null,
  jubilados: 'Jubilados y pensionados',
  clientes: 'Solo clientes del segmento',
}

export function PromoCard({
  promo,
  supermercado,
  emisor,
  ticket = 0,
  tasaMensual,
  mostrarSuper = true,
}: {
  promo: Promocion
  supermercado?: Supermercado
  emisor?: Emisor
  ticket?: number
  tasaMensual?: number
  mostrarSuper?: boolean
}) {
  const resultado = ticket > 0 ? calcularAhorro(promo, ticket, tasaMensual) : null
  const optimo = ticketOptimo(promo)
  const vencida = estaVencida(promo.vigencia.hasta)
  const segmento = ETIQUETA_SEGMENTO[promo.segmento]

  return (
    <article
      className="tarjeta overflow-hidden"
      style={{ opacity: vencida ? 0.55 : 1 }}
      aria-label={`${etiquetaBeneficio(promo.beneficio)} en ${supermercado?.nombre ?? promo.supermercado}`}
    >
      <div className="h-1" style={{ background: supermercado?.color ?? 'var(--borde)' }} />
      <div className="p-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="text-sm font-semibold">
            {mostrarSuper && <span>{supermercado?.nombre ?? promo.supermercado}</span>}
            {mostrarSuper && emisor && <span className="suave"> · </span>}
            {emisor && <span className="suave">{emisor.nombre}</span>}
          </div>
          {segmento && (
            <span className="rounded px-1.5 py-0.5 text-xs" style={{ background: 'var(--acento-suave)', color: 'var(--acento)' }}>
              {segmento}
            </span>
          )}
        </div>

        <p className="mt-1 text-2xl font-bold tracking-tight">{etiquetaBeneficio(promo.beneficio)}</p>

        <div className="mt-3 flex flex-wrap gap-1.5 text-xs suave">
          {promo.dias.length === 7 ? (
            <span className="chip" data-activo="false">Todos los días</span>
          ) : (
            promo.dias.map((d) => (
              <span key={d} className="chip" data-activo="false">
                {ETIQUETA_DIA[d]}
              </span>
            ))
          )}
          {promo.canales.length < 3 &&
            promo.canales.map((c) => (
              <span key={c} className="chip" data-activo="false">
                {c === 'sucursal' ? 'En sucursal' : c === 'online' ? 'Solo online' : 'En la app'}
              </span>
            ))}
        </div>

        <dl className="mt-3 grid gap-x-4 gap-y-1 text-sm sm:grid-cols-2">
          <Dato titulo="Pagando con" valor={promo.mediosDePago.join(', ')} />
          {promo.tope && (
            <Dato titulo="Tope" valor={`${formatearPesos(promo.tope.monto)} ${etiquetaPeriodo(promo.tope.periodo)}`} />
          )}
          {!promo.tope && promo.beneficio.tipo !== 'cuotas' && <Dato titulo="Tope" valor="Sin tope publicado" />}
          {promo.minimoCompra && <Dato titulo="Compra mínima" valor={formatearPesos(promo.minimoCompra)} />}
          {optimo && <Dato titulo="Compra que agota el tope" valor={formatearPesos(optimo)} />}
        </dl>

        {resultado && (
          <div className="mt-3 rounded-lg px-3 py-2 text-sm" style={{ background: 'var(--acento-suave)' }}>
            {!resultado.aplica ? (
              <span className="suave">No aplica: {resultado.motivo}</span>
            ) : resultado.ahorro === null ? (
              <span className="suave">Ahorro variable: {resultado.motivo}</span>
            ) : (
              <>
                <strong style={{ color: 'var(--acento)' }}>
                  Ahorrás {formatearPesos(Math.round(resultado.ahorro))}
                </strong>{' '}
                <span className="suave">
                  ({resultado.ahorroEfectivo!.toFixed(1)}% efectivo
                  {promo.beneficio.tipo === 'cuotas' ? ' por financiación' : ''})
                  {resultado.motivo ? ` · ${resultado.motivo}` : ''}
                </span>
              </>
            )}
          </div>
        )}

        {(promo.requisitos.length > 0 || promo.exclusiones.length > 0 || promo.notas) && (
          <div className="mt-3 space-y-1 text-xs suave">
            {promo.requisitos.length > 0 && <p>Requisitos: {promo.requisitos.join('. ')}.</p>}
            {promo.exclusiones.length > 0 && <p>No incluye: {promo.exclusiones.join(', ')}.</p>}
            {promo.notas && <p>{promo.notas}</p>}
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-2 border-t pt-2 text-xs suave" style={{ borderColor: 'var(--borde)' }}>
          <IndicadorConfianza confianza={promo.confianza} tipo={promo.fuente.tipo} />
          <a href={promo.fuente.url} target="_blank" rel="noopener noreferrer nofollow" className="underline">
            Fuente: {promo.fuente.medio}
          </a>
          {supermercado && (
            <a href={supermercado.paginaPromos} target="_blank" rel="noopener noreferrer nofollow" className="underline">
              Verificar en {supermercado.nombre}
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div>
      <dt className="suave text-xs">{titulo}</dt>
      <dd>{valor}</dd>
    </div>
  )
}

function IndicadorConfianza({ confianza, tipo }: { confianza: Promocion['confianza']; tipo: 'oficial' | 'prensa' }) {
  const color = { alta: '#1a7f37', media: '#9a6700', baja: '#a1341a' }[confianza]
  const texto = {
    alta: 'Dato confirmado',
    media: 'Dato de prensa',
    baja: 'Sin reconfirmar',
  }[confianza]
  return (
    <span className="inline-flex items-center gap-1" title={tipo === 'oficial' ? 'Fuente oficial' : 'Fuente periodística'}>
      <span aria-hidden className="inline-block size-2 rounded-full" style={{ background: color }} />
      {texto}
    </span>
  )
}
