const SAMPLES = [
  {
    verdict: 'BACKED_BY_RESEARCH',
    label: 'Backed by Research',
    color: '#00C4A1',
    confidence: 81,
    claim: 'Creatine improves strength and power output',
    summary: 'Consistently supported across multiple RCTs. Effect is robust across training populations.',
  },
  {
    verdict: 'PARTLY_TRUE',
    label: 'Partly True',
    color: '#F59E0B',
    confidence: 58,
    claim: 'You need protein within 30 minutes of training',
    summary: 'Total daily protein intake matters more than timing for most people. The window is overstated.',
  },
  {
    verdict: 'NOT_SUPPORTED_BY_EVIDENCE',
    label: 'Not Supported',
    color: '#F04E4E',
    confidence: 72,
    claim: 'Spot reduction works if you target the right exercises',
    summary: 'Fat loss is systemic. No exercise can pull fat from a specific area of the body.',
  },
]

export function SampleVerdicts() {
  return (
    <section className="bg-bg px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-12 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary text-center">
          What a Result Looks Like
        </p>
        <div className="grid gap-5 md:grid-cols-3">
          {SAMPLES.map(sample => (
            <div
              key={sample.verdict}
              className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="rounded-full px-3 py-1 font-mono text-xs font-medium uppercase"
                  style={{ backgroundColor: sample.color + '18', color: sample.color }}
                >
                  {sample.label}
                </span>
                <span className="font-mono text-sm font-medium" style={{ color: sample.color }}>
                  {sample.confidence}%
                </span>
              </div>
              <p className="font-body text-sm font-medium text-text-primary">"{sample.claim}"</p>
              <p className="font-body text-xs leading-relaxed text-text-secondary">{sample.summary}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
