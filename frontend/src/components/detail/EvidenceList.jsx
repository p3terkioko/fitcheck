import { EvidenceCard } from './EvidenceCard'

export function EvidenceList({ evidenceCards, compact = false }) {
  if (!evidenceCards || evidenceCards.length === 0) return null

  if (compact) {
    return (
      <div className="mt-2 flex flex-col gap-2">
        {evidenceCards.map((card, i) => (
          <div
            key={i}
            className="rounded-lg border-l-2 pl-3 py-1"
            style={{
              borderColor: card.stance === 'SUPPORTS' ? '#00C4A1'
                : card.stance === 'CONTRADICTS' ? '#F04E4E'
                : '#8B92A5'
            }}
          >
            <p className="font-body text-xs font-medium text-text-primary line-clamp-1">{card.title}</p>
            <p className="font-body text-xs text-text-secondary">{card.finding}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      <p className="mb-1 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
        Supporting Research
      </p>
      <p className="mb-4 font-body text-xs text-text-secondary">
        Showing contradictory evidence where it exists — not just sources that agree.
      </p>
      <div className="flex flex-col gap-3">
        {evidenceCards.map((card, i) => (
          <EvidenceCard key={i} card={card} />
        ))}
      </div>
    </div>
  )
}
