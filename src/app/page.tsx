import Link from 'next/link'
import { Explorador } from '@/components/Explorador'
import { emisoresConPromos, promociones, supermercados, ultimaActualizacion } from '@/lib/datos'
import { formatearFecha } from '@/lib/fechas'

export default function Home() {
  return (
    <>
      <section className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Qué promo te conviene hoy</h1>
        <p className="mt-2 max-w-2xl suave">
          Descuentos bancarios, reintegros y cuotas sin interés de Carrefour, Coto, Día, Chango Más, Jumbo, Disco y Vea.
          Poné cuánto vas a gastar y ordenamos las promos por el ahorro real que te dejan, contando los topes.
        </p>
        <p className="mt-2 text-sm suave">
          {promociones.length} promociones cargadas · última verificación {formatearFecha(ultimaActualizacion)} ·{' '}
          <Link href="/metodologia/" className="underline">
            de dónde salen los datos
          </Link>
        </p>
      </section>

      <Explorador
        promociones={promociones}
        supermercados={supermercados}
        emisores={emisoresConPromos()}
        diaInicial="todos"
        autoDiaHoy
      />
    </>
  )
}
