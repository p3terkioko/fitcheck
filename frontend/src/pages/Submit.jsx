import { useState } from 'react'
import { Type, Link as LinkIcon, X } from 'lucide-react'
import { Tabs } from '../components/ui/Tabs'
import { Button } from '../components/ui/Button'
import { ClaimTextarea } from '../components/submit/ClaimTextarea'
import { UrlInput } from '../components/submit/UrlInput'
import { PrivacyNote } from '../components/submit/PrivacyNote'
import { RecentlySidebar } from '../components/submit/RecentlySidebar'
import { useVerify } from '../hooks/useVerify'
import { useVerification } from '../context/VerificationContext'
import { getVerdictConfig } from '../lib/verdictUtils'

const TABS = [
  { value: 'text', label: 'Text', icon: <Type size={14} /> },
  { value: 'url',  label: 'URL',  icon: <LinkIcon size={14} /> },
]

export function Submit() {
  const [activeTab, setActiveTab] = useState('text')
  const [claimText, setClaimText] = useState('')
  const [urlValue, setUrlValue] = useState('')
  const [validationMsg, setValidationMsg] = useState('')
  const { verifyClaim, analyzeUrl } = useVerify()
  const { currentResult, sourceClaim, error, reset } = useVerification()

  function handleSubmit() {
    setValidationMsg('')
    if (activeTab === 'text') {
      if (claimText.trim().length < 10) {
        setValidationMsg('Try entering a full claim for best results (at least 10 characters).')
        return
      }
      verifyClaim(claimText.trim())
    } else {
      if (!urlValue.trim()) {
        setValidationMsg('Please enter a video URL.')
        return
      }
      analyzeUrl(urlValue.trim())
    }
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-8 lg:flex-row lg:gap-8 lg:px-6 lg:py-12">
      {/* Main content */}
      <div className="flex-1">
        <h1 className="mb-2 font-heading text-3xl text-text-primary sm:text-4xl">What have you heard?</h1>
        <p className="mb-6 font-body text-sm text-text-secondary">
          Paste a fitness or nutrition claim to verify it against peer-reviewed research.
        </p>

        {/* Last result chip */}
        {currentResult && sourceClaim && (() => {
          const cfg = getVerdictConfig(currentResult.verdict)
          return (
            <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span
                  className="shrink-0 rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase"
                  style={{ backgroundColor: cfg.color + '18', color: cfg.color, borderColor: cfg.color + '4D' }}
                >
                  {cfg.label}
                </span>
                <p className="truncate font-body text-sm text-text-secondary">{sourceClaim}</p>
              </div>
              <button
                onClick={reset}
                className="shrink-0 text-text-secondary transition-colors hover:text-text-primary"
                aria-label="Clear last result"
              >
                <X size={14} />
              </button>
            </div>
          )
        })()}

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <div className="px-6 pt-5">
            <Tabs tabs={TABS} active={activeTab} onChange={tab => { setActiveTab(tab); setValidationMsg('') }} />
          </div>

          <div className="p-6 pt-5">
            {activeTab === 'text' ? (
              <ClaimTextarea value={claimText} onChange={setClaimText} />
            ) : (
              <div className="flex flex-col gap-4">
                <UrlInput value={urlValue} onChange={setUrlValue} />
                <PrivacyNote />
              </div>
            )}

            {validationMsg && (
              <p className="mt-3 font-body text-xs text-[#F59E0B]">{validationMsg}</p>
            )}
            {error && (
              <p className="mt-3 font-body text-xs text-[#F04E4E]">{error}</p>
            )}

            <Button onClick={handleSubmit} className="mt-5 w-full py-3">
              Verify This Claim →
            </Button>
          </div>
        </div>
      </div>

      <RecentlySidebar />
    </div>
  )
}
