import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        <div className="size-14 rounded-xl bg-card border border-border flex items-center justify-center mb-5">
          <span className="text-2xl">404</span>
        </div>
        <h1 className="text-lg font-bold mb-1.5">Page not found</h1>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  )
}
