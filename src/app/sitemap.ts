import type { MetadataRoute } from 'next'
import { emisoresConPromos, supermercados } from '@/lib/datos'
import { DIAS } from '@/lib/tipos'

const BASE = 'https://promos-super.vercel.app'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const fijas = ['', '/calendario', '/supermercados', '/bancos', '/metodologia']
  return [
    ...fijas.map((r) => ({ url: `${BASE}${r}/`, changeFrequency: 'weekly' as const, priority: r === '' ? 1 : 0.7 })),
    ...supermercados.map((s) => ({ url: `${BASE}/supermercados/${s.id}/`, changeFrequency: 'weekly' as const, priority: 0.9 })),
    ...emisoresConPromos().map((e) => ({ url: `${BASE}/bancos/${e.id}/`, changeFrequency: 'weekly' as const, priority: 0.8 })),
    ...DIAS.map((d) => ({ url: `${BASE}/dia/${d}/`, changeFrequency: 'weekly' as const, priority: 0.8 })),
  ]
}
