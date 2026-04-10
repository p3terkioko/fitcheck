export function PlatformPill({ platform }) {
  if (!platform || platform === 'unknown') return null

  const labels = {
    tiktok:    'TikTok',
    instagram: 'Instagram Reels',
    youtube:   'YouTube Shorts',
  }

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-body text-xs text-text-secondary">
      <span className="h-1.5 w-1.5 rounded-full bg-accent" />
      {labels[platform] || platform}
    </span>
  )
}
