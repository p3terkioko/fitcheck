import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { useVerification } from '../context/VerificationContext'
import { VerdictHeader } from '../components/detail/VerdictHeader'
import { ReasoningBlock } from '../components/detail/ReasoningBlock'
import { EvidenceList } from '../components/detail/EvidenceList'
import { ProfileContextCard } from '../components/detail/ProfileContextCard'
import { ReliabilityNote } from '../components/detail/ReliabilityNote'
import { FollowUpPanel } from '../components/detail/FollowUpPanel'
import { EmptyState } from '../components/ui/EmptyState'
import { Search } from 'lucide-react'

export function ClaimDetail() {
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { currentResult, currentClaims, sourceClaim, verificationId: ctxVerificationId } = useVerification()

  // Resolve claim + result + verificationId from router state or context
  let claim, result, verificationId

  if (location.state?.claim && location.state?.result) {
    claim          = location.state.claim
    result         = location.state.result
    verificationId = location.state.verificationId ?? ctxVerificationId
  } else if (currentClaims && id !== undefined) {
    const idx  = parseInt(id)
    const item = currentClaims[idx]
    if (item) { claim = item.claim; result = item.result; verificationId = item.verificationId }
  } else if (currentResult) {
    claim          = sourceClaim
    result         = currentResult
    verificationId = ctxVerificationId
  }

  if (!result) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <EmptyState
          icon={Search}
          title="No result found"
          message="Submit a claim to see a verdict here."
          action={() => navigate('/submit')}
          actionLabel="Check a Claim"
        />
      </div>
    )
  }

  const backTarget = currentClaims ? '/results' : '/submit'
  const backLabel  = currentClaims ? '← Back to Results' : '← Back to Submit'

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(backTarget)}
        className="mb-6 font-body text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {backLabel}
      </button>

      <div className="flex flex-col gap-8">
        <VerdictHeader result={result} claim={claim} />
        <ReasoningBlock reasoning={result.reasoning} keyPoints={result.keyPoints} />
        {result.profileContext?.hasRelevantContext && (
          <ProfileContextCard profileContext={result.profileContext} />
        )}
        <EvidenceList evidenceCards={result.evidenceCards} />
        <ReliabilityNote
          reliabilityNote={result.reliabilityNote}
          insufficientEvidenceNote={result.insufficientEvidenceNote}
        />
        {verificationId && <FollowUpPanel verificationId={verificationId} />}
      </div>
    </div>
  )
}
