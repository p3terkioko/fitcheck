export function ReliabilityNote({ reliabilityNote, insufficientEvidenceNote }) {
  if (!reliabilityNote && !insufficientEvidenceNote) return null

  return (
    <div className="flex flex-col gap-3">
      {reliabilityNote && (
        <p className="font-body text-xs text-text-secondary">{reliabilityNote}</p>
      )}
      {insufficientEvidenceNote && (
        <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/10 px-4 py-3">
          <p className="font-body text-xs text-[#F59E0B]">{insufficientEvidenceNote}</p>
        </div>
      )}
    </div>
  )
}
