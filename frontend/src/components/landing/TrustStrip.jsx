import { BookOpen } from 'lucide-react'

export function TrustStrip() {
  return (
    <div className="border-y border-border bg-card px-6 py-5">
      <div className="mx-auto flex max-w-5xl items-center justify-center gap-3">
        <BookOpen size={16} className="text-text-secondary" strokeWidth={1.5} />
        <p className="font-body text-sm text-text-secondary">
          Evidence sourced from PubMed and peer-reviewed exercise science journals
        </p>
      </div>
    </div>
  )
}
