import type { Metadata } from 'next'
import Link from 'next/link'
import { promosDe, supermercados } from '@/lib/datos'

export const metadata: Metadata = {
  title: 'Supermercados',
  description: 'Promociones bancarias por cadena: Carrefour, Coto, Día, Chango Más, Jumbo, Disco y Vea.',
}

export default function Supermercados() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Supermercados</h1>
      <p className="mt-2 suave">Elegí una cadena para ver todas sus promos y el link a su página oficial.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {supermercados.map((s) => (
          <Link key={s.id} href={`/supermercados/${s.id}/`} className="tarjeta overflow-hidden">
            <div className="h-1" style={{ background: s.color }} />
            <div className="p-4">
              <p className="font-semibold">{s.nombre}</p>
              <p className="text-sm suave">
                {promosDe(s.id).length} promociones cargadas{s.grupo ? ` · ${s.grupo}` : ''}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </>
  )
}
