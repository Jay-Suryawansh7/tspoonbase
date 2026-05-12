'use client'

import dynamic from 'next/dynamic'
import { ReactFlowProvider } from 'reactflow'
import { useUser, SignInButton } from '@clerk/nextjs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Workflow } from 'lucide-react'

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

function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="size-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-xs text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center text-center max-w-sm px-6">
          <div className="size-14 rounded-xl bg-card border border-border flex items-center justify-center mb-5">
            <Workflow className="size-6 text-primary" />
          </div>
          <h1 className="text-lg font-bold mb-1.5">Sign in to continue</h1>
          <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
            You need to sign in to access the Torque workflow canvas.
          </p>
          <SignInButton mode="modal">
            <Button className="gap-2 h-9 px-5">Sign In</Button>
          </SignInButton>
          <Link href="/" className="mt-4 text-[11px] text-muted-foreground hover:text-foreground transition-colors">Back to home</Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default function CanvasPage() {
  return (
    <AuthGate>
      <ReactFlowProvider>
        <CanvasEditor />
      </ReactFlowProvider>
    </AuthGate>
  )
}
