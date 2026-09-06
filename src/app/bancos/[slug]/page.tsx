import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Explorador } from '@/components/Explorador'
import { emisoresConPromos, getEmisor, promosDeEmisor, supermercados } from '@/lib/datos'

export function generateStaticParams() {
  return emisoresConPromos().map((e) => ({ slug: e.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const e = getEmisor(slug)
  if (!e) return {}
  return {
    title: `Descuentos en supermercados con ${e.nombre}`,
    description: `Promociones, reintegros y cuotas sin interés de ${e.nombre} en Carrefour, Coto, Día, Chango Más, Jumbo, Disco y Vea.`,
  }
}

export default async function PaginaEmisor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const emisor = getEmisor(slug)
  if (!emisor) notFound()

  const promos = promosDeEmisor(slug)

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Supermercados con {emisor.nombre}</h1>
      <p className="mt-2 suave">
        {promos.length} promociones cargadas.
        {emisor.sitio && (
          <>
            {' '}
            <a href={emisor.sitio} target="_blank" rel="noopener noreferrer nofollow" className="underline">
              Sitio oficial
            </a>
            .
          </>
        )}
        {emisor.alias.length > 0 && <span> También aparece como {emisor.alias.join(', ')}.</span>}
      </p>

      <div className="mt-6">
        <Explorador
          promociones={promos}
          supermercados={supermercados}
          emisores={emisoresConPromos()}
          diaInicial="todos"
        />
      </div>
    </>
  )
}
