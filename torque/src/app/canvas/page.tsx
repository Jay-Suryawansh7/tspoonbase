'use client'

import dynamic from 'next/dynamic'
import { ReactFlowProvider } from 'reactflow'

const CanvasEditor = dynamic(() => import('@/components/CanvasEditor'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-xs text-muted-foreground">Loading canvas...</p>
      </div>
    </div>
  ),
})

export default function CanvasPage() {
  return (
    <ReactFlowProvider>
      <CanvasEditor />
    </ReactFlowProvider>
  )
}
