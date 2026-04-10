import { Link, AlertCircle } from 'lucide-react'
import { PlatformPill } from './PlatformPill'

const SUPPORTED = ['tiktok.com', 'instagram.com', 'youtube.com', 'youtu.be']

function detectPlatform(url) {
  const lower = url.toLowerCase()
  if (lower.includes('tiktok.com'))    return 'tiktok'
  if (lower.includes('instagram.com')) return 'instagram'
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube'
  return 'unknown'
}

function isSupported(url) {
  if (!url) return true
  const lower = url.toLowerCase()
  return SUPPORTED.some(d => lower.includes(d))
}

export function UrlInput({ value, onChange }) {
  const platform = detectPlatform(value)
  const valid = isSupported(value)

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2">
          <Link size={16} className="text-text-secondary" />
        </div>
        <input
          type="url"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Paste a TikTok, Instagram Reel, or YouTube Shorts URL"
          className="
            w-full rounded-xl border border-border bg-card py-4 pl-10 pr-5
            font-body text-sm text-text-primary placeholder-text-secondary
            focus:border-accent focus:outline-none transition-colors
          "
        />
      </div>

      {/* Platform pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {!value && (
          <>
            <PlatformPill platform="tiktok" />
            <PlatformPill platform="instagram" />
            <PlatformPill platform="youtube" />
          </>
        )}
        {value && platform !== 'unknown' && <PlatformPill platform={platform} />}
      </div>

      {/* Unsupported platform warning */}
      {value && !valid && (
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-[#F59E0B]" />
          <span className="font-body text-xs text-[#F59E0B]">
            This URL doesn't look like a supported platform. Check the URL and try again.
          </span>
        </div>
      )}
    </div>
  )
}
