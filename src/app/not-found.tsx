import Link from 'next/link'

export default function NoEncontrado() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold">No encontramos esa página</h1>
      <p className="mt-2 suave">Puede que hayamos movido algo.</p>
      <Link href="/" className="chip mt-4 inline-block">
        Volver a las promos de hoy
      </Link>
    </div>
  )
}
