import type { Metadata } from 'next'
import Link from 'next/link'
import { emisoresConPromos, promosDeEmisor } from '@/lib/datos'

export const metadata: Metadata = {
  title: 'Bancos y billeteras',
  description:
    'Descuentos en supermercados por banco y billetera: Banco Nación, Cuenta DNI, Galicia, BBVA, ICBC, Mercado Pago, MODO, Naranja X y Ualá.',
}

const ETIQUETA_TIPO = { banco: 'Banco', billetera: 'Billetera', tarjeta: 'Tarjeta', programa: 'Programa' }

export default function Bancos() {
  const emisores = emisoresConPromos()
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Bancos y billeteras</h1>
      <p className="mt-2 suave">Mirá qué te dan tus medios de pago en cada supermercado.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        {emisores.map((e) => (
          <Link key={e.id} href={`/bancos/${e.id}/`} className="tarjeta p-4">
            <p className="font-semibold">{e.nombre}</p>
            <p className="text-sm suave">
              {ETIQUETA_TIPO[e.tipo]} · {promosDeEmisor(e.id).length} promociones
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
