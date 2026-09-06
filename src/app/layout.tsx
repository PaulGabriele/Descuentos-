import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'
import { ultimaActualizacion } from '@/lib/datos'
import { formatearFecha } from '@/lib/fechas'

export const metadata: Metadata = {
  metadataBase: new URL('https://promos-super.vercel.app'),
  title: {
    default: 'Promos Super — descuentos de supermercados en Argentina',
    template: '%s · Promos Super',
  },
  description:
    'Todas las promociones bancarias, descuentos y cuotas sin interés de Carrefour, Coto, Día, Chango Más, Jumbo, Disco y Vea, ordenadas por día y por banco.',
  keywords: [
    'descuentos supermercados',
    'promociones bancarias',
    'Carrefour',
    'Coto',
    'Día',
    'Chango Más',
    'Jumbo',
    'Disco',
    'cuotas sin interés',
  ],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: 'Promos Super',
  },
}

const NAV = [
  { href: '/', texto: 'Hoy' },
  { href: '/calendario/', texto: 'Semana' },
  { href: '/supermercados/', texto: 'Supermercados' },
  { href: '/bancos/', texto: 'Bancos' },
  { href: '/metodologia/', texto: 'Cómo lo armamos' },
]

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
      <body>
        <header className="border-b" style={{ borderColor: 'var(--borde)', background: 'var(--superficie)' }}>
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              Promos<span style={{ color: 'var(--acento)' }}>Super</span>
            </Link>
            <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm suave">
              {NAV.slice(1).map((n) => (
                <Link key={n.href} href={n.href} className="hover:underline">
                  {n.texto}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-5xl px-4 py-6">{children}</main>

        <footer className="mt-12 border-t" style={{ borderColor: 'var(--borde)' }}>
          <div className="mx-auto max-w-5xl px-4 py-6 text-sm suave">
            <p>
              Datos verificados por última vez el {formatearFecha(ultimaActualizacion)}. Las promociones cambian
              semanalmente: confirmá siempre en la web oficial del supermercado o de tu banco antes de comprar.
            </p>
            <p className="mt-2">
              Sitio independiente, sin relación con las cadenas ni con los bancos mencionados.{' '}
              <Link href="/metodologia/" className="underline">
                Cómo armamos los datos
              </Link>
              .
            </p>
          </div>
        </footer>
      </body>
    </html>
  )
}
