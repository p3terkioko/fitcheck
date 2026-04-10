import { ExternalLink } from 'lucide-react'

const STANCE_CONFIG = {
  SUPPORTS:     { label: 'Supports',     color: '#00C4A1' },
  CONTRADICTS:  { label: 'Contradicts',  color: '#F04E4E' },
  NEUTRAL:      { label: 'Neutral',      color: '#8B92A5' },
}

export function EvidenceCard({ card }) {
  const stance = STANCE_CONFIG[card.stance] || STANCE_CONFIG.NEUTRAL

  return (
    <div
      className="rounded-xl border border-border bg-card p-5"
      style={{ borderLeftWidth: 3, borderLeftColor: stance.color }}
    >
      {/* Top row */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span
          className="rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-medium uppercase"
          style={{ color: stance.color, borderColor: stance.color + '4D' }}
        >
          {stance.label}
        </span>
        <span className="font-mono text-xs text-text-secondary">{card.relevanceScore}% match</span>
      </div>

      {/* Title */}
      <p className="mb-1 line-clamp-2 font-body text-sm font-medium text-text-primary">
        {card.title}
      </p>

      {/* Meta */}
      <p className="mb-3 font-body text-xs text-text-secondary">
        {[card.authors, card.year, card.journal].filter(Boolean).join(' · ')}
      </p>

      {/* Finding */}
      <div className="border-l-2 border-border pl-3">
        <p className="font-body text-sm text-text-primary">{card.finding}</p>
      </div>

      {/* Links */}
      <div className="mt-3 flex gap-3">
        {card.pubmedUrl && (
          <a
            href={card.pubmedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-body text-xs text-accent hover:underline"
          >
            View on PubMed
            <ExternalLink size={10} />
          </a>
        )}
        {!card.pubmedUrl && card.doi && (
          <a
            href={`https://doi.org/${card.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 font-body text-xs text-accent hover:underline"
          >
            View DOI
            <ExternalLink size={10} />
          </a>
        )}
      </div>
    </div>
  )
}
