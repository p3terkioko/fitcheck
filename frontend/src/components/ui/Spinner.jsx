import { Loader2 } from 'lucide-react'

export function Spinner({ size = 20, className = '' }) {
  return <Loader2 size={size} className={`animate-spin text-accent ${className}`} />
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-bg">
      <Spinner size={32} />
    </div>
  )
}
