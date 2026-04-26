import { Code, Package, BookOpen } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="border-t border-theme bg-theme-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="flex items-center gap-6">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-theme-tertiary transition-colors hover:text-theme"
            >
              <Code className="h-4 w-4" />
              GitHub
            </a>
            <a
              href="https://npmjs.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 text-sm text-theme-tertiary transition-colors hover:text-theme"
            >
              <Package className="h-4 w-4" />
              npm
            </a>
            <a
              href="/docs/getting-started/quick-start"
              className="flex items-center gap-2 text-sm text-theme-tertiary transition-colors hover:text-theme"
            >
              <BookOpen className="h-4 w-4" />
              Quick Start
            </a>
          </div>
          <p className="text-sm text-theme-muted">
            &copy; {new Date().getFullYear()} TspoonBase. MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}
