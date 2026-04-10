import { CheckCircle2 } from 'lucide-react'

const TEXT_STEPS = [
  { label: 'Parsing your claim',      desc: 'Breaking down the key assertion to search.' },
  { label: 'Searching research papers', desc: 'Scanning 900+ peer-reviewed studies for relevant evidence.' },
  { label: 'Analysing evidence',      desc: 'Reading and assessing what the research says.' },
  { label: 'Building your verdict',   desc: 'Synthesising a structured, evidence-grounded result.' },
]

const URL_STEPS = [
  { label: 'Fetching video',          desc: 'Extracting audio from the video URL.' },
  { label: 'Transcribing audio',      desc: 'Converting speech to text via Whisper.' },
  { label: 'Extracting claims',       desc: 'Identifying verifiable fitness and nutrition claims.' },
  { label: 'Verifying claims',        desc: 'Searching research and building verdicts for each claim.' },
]

export function ProgressTracker({ step, inputMode, fromCache }) {
  const steps = inputMode === 'url' ? URL_STEPS : TEXT_STEPS

  return (
    <div className="flex flex-col gap-5">
      {steps.map((s, i) => {
        const done    = i < step
        const active  = i === step
        const pending = i > step

        return (
          <div key={i} className="flex gap-4">
            {/* Left column: number / check */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  flex h-7 w-7 items-center justify-center rounded-full border text-xs font-mono font-medium transition-colors duration-300
                  ${done   ? 'border-accent bg-accent/10 text-accent' :
                    active ? 'border-accent text-accent' :
                             'border-border text-text-secondary'}
                `}
              >
                {done ? <CheckCircle2 size={14} /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div className={`mt-1 w-px flex-1 ${done ? 'bg-accent/40' : 'bg-border'}`} style={{ minHeight: 20 }} />
              )}
            </div>

            {/* Content */}
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`font-body text-sm font-medium transition-colors duration-300 ${
                    done || active ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {i === 0 && inputMode === 'url' && fromCache
                    ? 'Transcript retrieved'
                    : s.label}
                </span>
                {i === 0 && inputMode === 'url' && fromCache && done && (
                  <span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-text-secondary">
                    Cached
                  </span>
                )}
              </div>
              <p className={`font-body text-xs transition-colors duration-300 ${active ? 'text-text-secondary' : 'text-border'}`}>
                {i === 0 && inputMode === 'url' && fromCache
                  ? 'Previously transcribed — retrieving from cache.'
                  : s.desc}
              </p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
