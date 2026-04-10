export function ReasoningBlock({ reasoning, keyPoints }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
        Why This Verdict?
      </p>
      <p className="font-body text-sm leading-relaxed text-text-primary mb-5">{reasoning}</p>
      {keyPoints && keyPoints.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {keyPoints.map((point, i) => (
            <li key={i} className="flex items-start gap-3">
              <span className="mt-1.5 h-1 w-4 shrink-0 border-t border-accent" />
              <span className="font-body text-sm text-text-primary">{point}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
