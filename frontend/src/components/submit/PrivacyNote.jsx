import { Shield } from 'lucide-react'

export function PrivacyNote() {
  return (
    <div className="flex items-start gap-2">
      <Shield size={14} className="mt-0.5 shrink-0 text-text-secondary" strokeWidth={1.5} />
      <p className="font-body text-xs text-text-secondary">
        Audio is extracted, transcribed, and immediately deleted. Only the transcript is stored.
      </p>
    </div>
  )
}
