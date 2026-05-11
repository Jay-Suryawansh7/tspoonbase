'use client'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center max-w-sm px-6">
        <div className="size-14 rounded-xl bg-card border border-border flex items-center justify-center mb-5">
          <span className="text-2xl">⚠</span>
        </div>
        <h1 className="text-lg font-bold mb-1.5">Something went wrong</h1>
        <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
