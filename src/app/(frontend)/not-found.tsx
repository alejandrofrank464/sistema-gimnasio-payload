import Link from 'next/link'

export default function FrontendNotFound() {
  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-6">
      <div className="text-center">
        <h1 className="text-foreground mb-4 text-4xl font-bold">404</h1>
        <p className="text-muted-foreground mb-4 text-xl">Página no encontrada</p>
        <Link href="/" className="text-primary hover:text-primary/90 underline">
          Volver al inicio
        </Link>
      </div>
    </div>
  )
}
