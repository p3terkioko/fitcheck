import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Database, User } from 'lucide-react'
import { useVerification } from '../context/VerificationContext'
import { ClaimCard } from '../components/results/ClaimCard'
import { FilterBar } from '../components/results/FilterBar'
import { EmptyState } from '../components/ui/EmptyState'
import { FullPageSpinner } from '../components/ui/Spinner'

export function Results() {
  const {
    currentResult, currentClaims, currentData,
    sourceClaim, sourceUrl, inputMode, isProcessing,
  } = useVerification()
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all')

  // Single text-claim result → redirect to detail page
  useEffect(() => {
    if (!isProcessing && currentResult && !currentClaims) {
      navigate('/results/0', { state: { claim: sourceClaim, result: currentResult }, replace: true })
    }
  }, [isProcessing, currentResult, currentClaims])

  // Still processing or about to redirect
  if (isProcessing || (currentResult && !currentClaims)) return <FullPageSpinner />

  // No data
  if (!currentClaims) {
    return (
      <div className="mx-auto max-w-5xl px-6 py-12">
        <EmptyState
          title="No results yet"
          message="Submit a claim or video URL to get started."
          action={() => navigate('/submit')}
          actionLabel="Check a Claim"
        />
      </div>
    )
  }

  const filtered = filter === 'all'
    ? currentClaims
    : currentClaims.filter(c => c.result?.verdict === filter)

  const hasPersonalised = currentClaims.some(c => c.result?.profileContext?.hasRelevantContext)

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Back + breadcrumb */}
      <Link
        to="/submit"
        className="mb-6 inline-flex items-center gap-1 font-body text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        ← Back
      </Link>

      {/* URL summary card */}
      {inputMode === 'url' && currentData && (
        <div className="mb-6 flex items-start justify-between rounded-xl border border-border bg-card p-5 gap-4">
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-xs text-text-secondary capitalize">
                {currentData.platform || 'Video'}
              </span>
              <span className="font-mono text-xs text-text-secondary truncate max-w-xs">
                {sourceUrl}
              </span>
            </div>
            {currentData.fromCache && (
              <div className="flex items-center gap-1.5 mt-1">
                <Database size={12} className="text-text-secondary" />
                <span className="font-mono text-xs text-text-secondary">
                  Transcript from cache
                </span>
              </div>
            )}
          </div>
          <div className="text-right shrink-0">
            <p className="font-mono text-2xl font-medium text-accent">{currentClaims.length}</p>
            <p className="font-body text-xs text-text-secondary">claims found</p>
          </div>
        </div>
      )}

      {/* Personalised context banner */}
      {hasPersonalised && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border-l-2 border-accent bg-elevated px-5 py-3">
          <User size={16} className="shrink-0 text-accent" />
          <p className="font-body text-sm text-text-primary">
            Some of these results include notes personalised to your health profile.
          </p>
        </div>
      )}

      <FilterBar filter={filter} onFilter={setFilter} />

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {filtered.map((item, i) => (
          <ClaimCard key={i} item={item} index={currentClaims.indexOf(item)} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="mt-10 text-center">
          <p className="font-body text-sm text-text-secondary">No claims match this filter.</p>
        </div>
      )}
    </div>
  )
}
