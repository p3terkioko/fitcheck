import { useEffect, useState, useRef } from 'react'
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
  const debounceRef = useRef(null)
  const isFirstRender = useRef(true)

  // Load stats once on mount
  useEffect(() => {
    api.getHistoryStats()
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [])

  // Fetch page 1 on mount and whenever filters change (debounced for search)
  useEffect(() => {
    clearTimeout(debounceRef.current)
    const delay = isFirstRender.current ? 0 : searchQuery ? 300 : 0
    isFirstRender.current = false
    debounceRef.current = setTimeout(() => fetchPage(1), delay)
    return () => clearTimeout(debounceRef.current)
  }, [verdictFilter, searchQuery])

  async function fetchPage(pageNum) {
    setLoading(true)
    try {
      const res = await api.getHistory({
        page: pageNum,
        verdict: verdictFilter !== 'all' ? verdictFilter : undefined,
        search: searchQuery || undefined,
      })
      setItems(res.data.verifications)
      setPagination(res.data.pagination)
      setPage(pageNum)
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
      const res = await api.getHistory({
        page: nextPage,
        verdict: verdictFilter !== 'all' ? verdictFilter : undefined,
        search: searchQuery || undefined,
      })
      setItems(prev => [...prev, ...res.data.verifications])
      setPagination(res.data.pagination)
      setPage(nextPage)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoadingMore(false)
    }
  }

  return {
    items,
    allItems: items,
    stats,
    pagination,
    loading,
    loadingMore,
    error,
    verdictFilter, setVerdictFilter,
    searchQuery, setSearchQuery,
    loadMore,
    refresh: () => fetchPage(1),
  }
}
