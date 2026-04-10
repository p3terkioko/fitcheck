import { useNavigate } from 'react-router-dom'
import { useHistory } from '../hooks/useHistory'
import { StatsRow } from '../components/history/StatsRow'
import { HistoryFilters } from '../components/history/HistoryFilters'
import { HistoryItem } from '../components/history/HistoryItem'
import { EmptyState } from '../components/ui/EmptyState'
import { Spinner } from '../components/ui/Spinner'
import { Button } from '../components/ui/Button'
import { Search } from 'lucide-react'

export function History() {
  const navigate = useNavigate()
  const {
    items, stats, pagination, loading, loadingMore,
    verdictFilter, setVerdictFilter,
    searchQuery, setSearchQuery,
    loadMore,
  } = useHistory()

  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="mb-2 font-heading text-4xl text-text-primary">Your Verifications</h1>
      <p className="mb-8 font-body text-sm text-text-secondary">
        All claims you've checked, most recent first.
      </p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={28} /></div>
      ) : (
        <>
          <div className="mb-8">
            <StatsRow stats={stats} />
          </div>

          <div className="mb-6">
            <HistoryFilters
              searchQuery={searchQuery}
              onSearch={setSearchQuery}
              verdictFilter={verdictFilter}
              onFilter={setVerdictFilter}
            />
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nothing checked yet."
              message="Paste a claim to get started."
              action={() => navigate('/submit')}
              actionLabel="Check a Claim"
            />
          ) : (
            <div className="flex flex-col gap-3">
              {items.map(item => (
                <HistoryItem key={item.id} item={item} />
              ))}

              {pagination?.hasMore && (
                <div className="mt-4 flex justify-center">
                  <Button variant="secondary" onClick={loadMore} loading={loadingMore}>
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
