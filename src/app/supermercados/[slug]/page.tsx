import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Explorador } from '@/components/Explorador'
import { emisoresConPromos, getSupermercado, promosDe, supermercados } from '@/lib/datos'

export function generateStaticParams() {
  return supermercados.map((s) => ({ slug: s.id }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const s = getSupermercado(slug)
  if (!s) return {}
  return {
    title: `Descuentos y promociones de ${s.nombre}`,
    description: `Todas las promociones bancarias, reintegros y cuotas sin interés de ${s.nombre} en Argentina, día por día y banco por banco.`,
  }
}

export default async function PaginaSupermercado({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supermercado = getSupermercado(slug)
  if (!supermercado) notFound()

  const promos = promosDe(slug)

  return (
    <>
      <div className="mb-1 h-1.5 w-16 rounded" style={{ background: supermercado.color }} />
      <h1 className="text-3xl font-bold tracking-tight">Promos de {supermercado.nombre}</h1>
      <p className="mt-2 suave">
        {promos.length} promociones cargadas.{' '}
        <a href={supermercado.paginaPromos} target="_blank" rel="noopener noreferrer nofollow" className="underline">
          Página oficial de descuentos
        </a>
        {supermercado.folleto && (
          <>
            {' · '}
            <a href={supermercado.folleto} target="_blank" rel="noopener noreferrer nofollow" className="underline">
              Folleto semanal (2x1 y ofertas de producto)
            </a>
          </>
        )}
      </p>

      <div className="mt-6">
        <Explorador
          promociones={promos}
          supermercados={supermercados}
          emisores={emisoresConPromos()}
          diaInicial="todos"
          fijarSupermercado={slug}
        />
      </div>
    </>
  )
}
