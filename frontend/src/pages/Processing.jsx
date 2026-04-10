import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle } from 'lucide-react'
import { useVerification } from '../context/VerificationContext'
import { ProgressTracker } from '../components/processing/ProgressTracker'
import { DidYouKnow } from '../components/processing/DidYouKnow'

export function Processing() {
  const {
    isProcessing, processingStep, inputMode,
    currentResult, currentClaims, currentData, error,
  } = useVerification()
  const navigate = useNavigate()

  useEffect(() => {
    // If not processing and we have results, navigate there
    if (!isProcessing && (currentResult || currentClaims)) {
      navigate('/results', { replace: true })
      return
    }
    // If not processing and no results, go back to submit
    if (!isProcessing && !currentResult && !currentClaims) {
      navigate('/submit', { replace: true })
    }
  }, [isProcessing, currentResult, currentClaims])

  const fromCache = currentData?.fromCache ?? false

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-10 text-center">
          <div className="mb-4 flex justify-center">
            <CheckCircle size={32} className="text-accent animate-pulse" />
          </div>
          <h1 className="font-heading text-3xl text-text-primary">Checking the evidence...</h1>
          <p className="mt-2 font-body text-sm text-text-secondary">
            {inputMode === 'url'
              ? 'Video transcription can take up to 60 seconds.'
              : 'Usually takes under 30 seconds.'}
          </p>
        </div>

        <ProgressTracker step={processingStep} inputMode={inputMode} fromCache={fromCache} />

        {error && (
          <div className="mt-6 rounded-xl border border-[#F04E4E]/30 bg-[#F04E4E]/10 p-4">
            <p className="font-body text-sm text-[#F04E4E]">{error}</p>
          </div>
        )}

        <div className="mt-10">
          <DidYouKnow />
        </div>
      </div>
    </div>
  )
}
