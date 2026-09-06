import type { Metadata } from 'next'
import { promociones, supermercados, ultimaActualizacion } from '@/lib/datos'
import { formatearFecha } from '@/lib/fechas'
import { TASA_MENSUAL_POR_DEFECTO } from '@/lib/ahorro'

export const metadata: Metadata = {
  title: 'Cómo armamos los datos',
  description:
    'De dónde salen las promociones que publicamos, cómo las verificamos y cómo calculamos el ahorro estimado de cada una.',
}

export default function Metodologia() {
  const porConfianza = {
    alta: promociones.filter((p) => p.confianza === 'alta').length,
    media: promociones.filter((p) => p.confianza === 'media').length,
    baja: promociones.filter((p) => p.confianza === 'baja').length,
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cómo armamos los datos</h1>
        <p className="mt-2 suave">Última verificación: {formatearFecha(ultimaActualizacion)}.</p>
      </div>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">De dónde salen</h2>
        <p>
          Cada promoción del sitio tiene un origen declarado y un link a la fuente. Hay dos tipos: <strong>oficial</strong>{' '}
          (la página de descuentos de la cadena o del banco) y <strong>prensa</strong> (medios que publican la grilla
          semanal). Los indicamos con un punto de color en cada tarjeta:
        </p>
        <ul className="ml-5 list-disc space-y-1">
          <li>
            <strong>Dato confirmado</strong> ({porConfianza.alta}): sale de una grilla completa y explícita del banco o
            de la cadena.
          </li>
          <li>
            <strong>Dato de prensa</strong> ({porConfianza.media}): lo publicó un medio y no lo pudimos contrastar
            contra la fuente oficial.
          </li>
          <li>
            <strong>Sin reconfirmar</strong> ({porConfianza.baja}): venía de un período anterior y no encontramos
            confirmación para el mes en curso. Verificalo antes de ir a comprar.
          </li>
        </ul>
        <p className="suave text-sm">
          Las cadenas publican sus promociones bancarias como imágenes cargadas por JavaScript, así que no existe una
          fuente estructurada que se pueda leer automáticamente. La carga es curada y versionada en el repositorio: cada
          cambio queda en el historial de git.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Cómo calculamos el ahorro</h2>
        <p>
          Para los descuentos y reintegros: <code>ahorro = monto × porcentaje</code>, recortado por el tope de la promo.
          Suponemos que el cupo del período (semanal o mensual) está intacto, así que es el <em>mejor caso</em>. Si ya
          usaste parte del tope este mes, vas a ahorrar menos.
        </p>
        <p>
          Para las cuotas sin interés no hay descuento nominal, pero sí un ahorro financiero: pagar en N cuotas vale
          menos que pagar todo hoy. Calculamos el valor presente de las cuotas con una tasa mensual que podés cambiar en
          el buscador (por defecto {(TASA_MENSUAL_POR_DEFECTO * 100).toFixed(1)}% mensual, que representa tu costo de
          oportunidad: lo que rendiría esa plata en un plazo fijo o un fondo money market).
        </p>
        <p>
          Los 2x1, 3x2 y segundas unidades dependen de qué productos entren en el carrito, así que no los estimamos
          sobre el ticket: los mostramos, pero sin número de ahorro.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Ofertas de producto (2x1, 3x2)</h2>
        <p>
          Ese tipo de oferta vive en el folleto semanal de cada cadena y rota todas las semanas. No inventamos entradas:
          si no las tenemos cargadas y verificadas, te mandamos al folleto oficial.
        </p>
        <ul className="ml-5 list-disc space-y-1">
          {supermercados
            .filter((s) => s.folleto)
            .map((s) => (
              <li key={s.id}>
                <a href={s.folleto} target="_blank" rel="noopener noreferrer nofollow" className="underline">
                  Folleto de {s.nombre}
                </a>
              </li>
            ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold">Aviso</h2>
        <p className="suave">
          Este es un sitio independiente y no tiene relación con las cadenas ni con los bancos mencionados. Las
          promociones cambian sin previo aviso y pueden variar por sucursal, provincia o segmento de cliente. La
          información se publica como referencia: la condición que vale es la que publica el comercio o el banco al
          momento de pagar.
        </p>
      </section>
    </div>
  )
}
