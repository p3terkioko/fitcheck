import { User, AlertTriangle } from 'lucide-react'

export function ProfileContextCard({ profileContext }) {
  // Render nothing if no context or not relevant
  if (!profileContext || !profileContext.hasRelevantContext) return null

  return (
    <div className="rounded-xl border-l-2 border-accent bg-elevated p-6" style={{ borderLeftWidth: 2, borderLeftColor: '#00C4A1' }}>
      <div className="mb-3 flex items-center gap-2">
        <User size={16} className="text-accent" strokeWidth={1.5} />
        <span className="font-body text-sm font-medium text-accent">Considering your profile</span>
      </div>

      <p className="mb-4 font-body text-sm text-text-primary">
        {profileContext.contextualVerdict}
      </p>

      {profileContext.warnings && profileContext.warnings.length > 0 && (
        <div className="flex flex-col gap-2.5 mb-4">
          {profileContext.warnings.map((warning, i) => (
            <div key={i} className="flex items-start gap-2">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-[#F59E0B]" />
              <p className="font-body text-sm text-text-primary">{warning}</p>
            </div>
          ))}
        </div>
      )}

      {profileContext.consultProfessional && (
        <p className="font-body text-xs text-text-secondary">
          For your specific situation, speaking with a healthcare professional before acting on this is worthwhile.
        </p>
      )}
    </div>
  )
}
