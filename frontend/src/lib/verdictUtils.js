export const VERDICT_CONFIG = {
  BACKED_BY_RESEARCH: {
    label: 'Backed by Research',
    color: '#00C4A1',
    textClass: 'text-[#00C4A1]',
    bgClass: 'bg-[#00C4A1]/10',
    borderClass: 'border-[#00C4A1]/30',
  },
  PARTLY_TRUE: {
    label: 'Partly True',
    color: '#F59E0B',
    textClass: 'text-[#F59E0B]',
    bgClass: 'bg-[#F59E0B]/10',
    borderClass: 'border-[#F59E0B]/30',
  },
  NOT_SUPPORTED_BY_EVIDENCE: {
    label: 'Not Supported',
    color: '#F04E4E',
    textClass: 'text-[#F04E4E]',
    bgClass: 'bg-[#F04E4E]/10',
    borderClass: 'border-[#F04E4E]/30',
  },
  UNCLEAR_LIMITED_RESEARCH: {
    label: 'Unclear — Limited Research',
    color: '#8B5CF6',
    textClass: 'text-[#8B5CF6]',
    bgClass: 'bg-[#8B5CF6]/10',
    borderClass: 'border-[#8B5CF6]/30',
  },
}

export function getVerdictConfig(verdict) {
  return VERDICT_CONFIG[verdict] ?? VERDICT_CONFIG.UNCLEAR_LIMITED_RESEARCH
}

export function formatTimeAgo(dateStr) {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now - date
  const diffSecs = Math.floor(diffMs / 1000)
  const diffMins = Math.floor(diffSecs / 60)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffMins > 0) return `${diffMins} min ago`
  return 'just now'
}
