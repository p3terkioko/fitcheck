import { useEffect, useState } from 'react'
import { api } from '../lib/api'

export function useHistory() {
  const [items, setItems] = useState([])
  const [stats, setStats] = useState(null)
  const [pagination, setPagination] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [page, setPage] = useState(1)
  const [verdictFilter, setVerdictFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    loadInitial()
  }, [])

  async function loadInitial() {
    setLoading(true)
    try {
      const [historyRes, statsRes] = await Promise.all([
        api.getHistory({ page: 1 }),
        api.getHistoryStats(),
      ])
      setItems(historyRes.data.verifications)
      setPagination(historyRes.data.pagination)
      setStats(statsRes.data)
      setPage(1)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!pagination?.hasMore || loadingMore) return
    setLoadingMore(true)
    try {
      const nextPage = page + 1
      const res = await api.getHistory({ page: nextPage })
      setItems(prev => [...prev, ...res.data.verifications])
      setPagination(res.data.pagination)
      setPage(nextPage)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  // Client-side filter
  const filteredItems = items.filter(item => {
    const matchesVerdict = verdictFilter === 'all' || item.result?.verdict === verdictFilter
    const matchesSearch = !searchQuery ||
      item.claim.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesVerdict && matchesSearch
  })

  return {
    items: filteredItems,
    allItems: items,
    stats,
    pagination,
    loading,
    loadingMore,
    error,
    verdictFilter, setVerdictFilter,
    searchQuery, setSearchQuery,
    loadMore,
    refresh: loadInitial,
  }
}
