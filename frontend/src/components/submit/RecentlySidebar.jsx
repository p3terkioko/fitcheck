import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { getVerdictConfig, formatTimeAgo } from '../../lib/verdictUtils'

export function RecentlySidebar() {
  const [items, setItems] = useState([])

  useEffect(() => {
    api.getHistory({ limit: 5 }).then(res => {
      setItems(res.data.verifications.slice(0, 5))
    }).catch(() => {})
  }, [])

  if (!items.length) return null

  return (
    <aside className="hidden w-64 shrink-0 lg:block">
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="mb-4 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          Recently Verified
        </p>
        <div className="flex flex-col gap-3">
          {items.map(item => {
            const cfg = getVerdictConfig(item.result?.verdict)
            return (
              <Link
                key={item.id}
                to="/history"
                className="block rounded-lg p-2 hover:bg-elevated transition-colors"
              >
                <div className="mb-1 flex items-center gap-1.5">
                  <span
                    className="rounded-full px-2 py-0.5 font-mono text-[10px] font-medium uppercase"
                    style={{ backgroundColor: cfg.color + '18', color: cfg.color }}
                  >
                    {cfg.label}
                  </span>
                </div>
                <p className="line-clamp-1 font-body text-xs text-text-primary">{item.claim}</p>
                <p className="mt-0.5 font-mono text-[10px] text-text-secondary">
                  {formatTimeAgo(item.created_at)}
                </p>
              </Link>
            )
          })}
        </div>
        <Link
          to="/history"
          className="mt-4 block font-body text-xs text-accent hover:underline"
        >
          View all →
        </Link>
      </div>
    </aside>
  )
}
