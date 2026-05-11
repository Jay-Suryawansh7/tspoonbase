import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Torque — Agentic Workflow Canvas',
  description: 'Visually build AI agent pipelines and deploy them to TspoonBase',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
