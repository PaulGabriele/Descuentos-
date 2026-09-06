import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Explorador } from '@/components/Explorador'
import { emisoresConPromos, promosDelDia, supermercados } from '@/lib/datos'
import { DIAS, ETIQUETA_DIA, type Dia } from '@/lib/tipos'

export function generateStaticParams() {
  return DIAS.map((d) => ({ slug: d }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  if (!(DIAS as readonly string[]).includes(slug)) return {}
  const dia = ETIQUETA_DIA[slug as Dia]
  return {
    title: `Descuentos en supermercados los ${dia.toLowerCase()}`,
    description: `Qué supermercado conviene los ${dia.toLowerCase()}: descuentos bancarios, reintegros y cuotas sin interés en Carrefour, Coto, Día, Chango Más, Jumbo y Disco.`,
  }
}

export default async function PaginaDia({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!(DIAS as readonly string[]).includes(slug)) notFound()
  const dia = slug as Dia
  const promos = promosDelDia(dia)

  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Descuentos de los {ETIQUETA_DIA[dia].toLowerCase()}</h1>
      <p className="mt-2 suave">{promos.length} promociones vigentes ese día.</p>
      <div className="mt-6">
        <Explorador
          promociones={promos}
          supermercados={supermercados}
          emisores={emisoresConPromos()}
          diaInicial={dia}
        />
      </div>
    </>
  )
}
