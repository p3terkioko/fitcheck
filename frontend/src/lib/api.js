import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000'

async function getToken() {
  try {
    const { data } = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000)),
    ])
    return data?.session?.access_token ?? null
  } catch {
    // Supabase stalled (e.g. token refresh on a slow network) — fail open
    // so the fetch still goes out; server will 401 if truly unauthenticated.
    return null
  }
}

async function authHeaders() {
  const token = await getToken()
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }
}

async function request(method, path, body, timeoutMs = 90000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers = await authHeaders()
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body ? { body: JSON.stringify(body) } : {}),
    })
    clearTimeout(timer)
    const json = await res.json()
    if (!res.ok || !json.success) {
      throw new Error(json.error || `Request failed: ${res.status}`)
    }
    return json
  } catch (err) {
    clearTimeout(timer)
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please try again.')
    }
    throw err
  }
}

export const api = {
  getMe:           ()       => request('GET',  '/api/auth/me'),
  saveProfile:     (data)   => request('POST', '/api/auth/profile', data),
  verify:          (data)   => request('POST', '/api/verify', data, 60000),
  analyzeUrl:      (data)   => request('POST', '/api/analyze-url', data, 120000),
  followUp:        (data)   => request('POST', '/api/verify/followup', data, 45000),
  getHistory:      (params) => request('GET',  `/api/history?page=${params?.page || 1}&limit=${params?.limit || 20}`),
  getHistoryStats: ()       => request('GET',  '/api/history/stats'),
  getStats:        ()       => request('GET',  '/api/stats'),
}
