import { useNavigate } from 'react-router-dom'
import { Type, Link as LinkIcon } from 'lucide-react'
import { getVerdictConfig, formatTimeAgo } from '../../lib/verdictUtils'
import { useVerification } from '../../context/VerificationContext'

export function HistoryItem({ item }) {
  const navigate = useNavigate()
  const { setCurrentResult, setSourceClaim } = useVerification()
  const cfg = getVerdictConfig(item.result?.verdict)

  function handleClick() {
    setCurrentResult(item.result)
    setSourceClaim(item.claim)
    navigate('/results/0', { state: { claim: item.claim, result: item.result, verificationId: item.id } })
  }

  return (
    <button
      onClick={handleClick}
      className="flex w-full items-start gap-4 rounded-xl border border-border bg-card p-4 text-left hover:bg-elevated transition-colors"
    >
      {/* Input type icon */}
      <div className="mt-0.5 shrink-0 text-text-secondary">
        {item.input_type === 'url' ? <LinkIcon size={16} /> : <Type size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="mb-1 flex items-center gap-2 flex-wrap">
          <span
            className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase"
            style={{ backgroundColor: cfg.color + '18', color: cfg.color, borderColor: cfg.color + '4D' }}
          >
            {cfg.label}
          </span>
        </div>
        <p className="line-clamp-1 font-body text-sm font-medium text-text-primary">{item.claim}</p>
        {item.result?.oneLineSummary && (
          <p className="line-clamp-1 font-body text-xs text-text-secondary mt-0.5">
            {item.result.oneLineSummary}
          </p>
        )}
      </div>

      {/* Right */}
      <div className="shrink-0 text-right">
        <p className="font-mono text-xs text-text-secondary">{formatTimeAgo(item.created_at)}</p>
        <span className="mt-1 block font-body text-xs text-accent">View →</span>
      </div>
    </button>
  )
}
