import type { NextConfig } from 'next'

// `basePath` permite publicar en GitHub Pages bajo /<repo> sin tocar el código.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

const nextConfig: NextConfig = {
  output: 'export',
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
}

export default nextConfig
