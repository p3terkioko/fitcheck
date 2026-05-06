import { useState, useRef, useEffect } from 'react'
import { Send } from 'lucide-react'
import { api } from '../../lib/api'
import { EvidenceList } from './EvidenceList'
import { Spinner } from '../ui/Spinner'

export function FollowUpPanel({ verificationId }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef(null)
  const sendingRef = useRef(false)

  useEffect(() => {
    if (!verificationId) return
    api.getFollowUps(verificationId)
      .then(({ data }) => {
        setMessages(data.map(row => ({
          question: row.question,
          answer: row.answer,
          relatedEvidence: row.related_evidence || [],
          error: null,
          loading: false,
        })))
      })
      .catch(() => {})
  }, [verificationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend() {
    if (!input.trim() || loading || sendingRef.current) return
    sendingRef.current = true
    const question = input.trim()
    setInput('')
    setLoading(true)
    setMessages(prev => [...prev, { question, answer: null, relatedEvidence: [], error: null, loading: true }])

    try {
      const { data } = await api.followUp({ verificationId, question })
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? { question, answer: data.answer, relatedEvidence: data.relatedEvidence || [], error: null, loading: false, saved: data.saved !== false }
          : m
      ))
    } catch (err) {
      setMessages(prev => prev.map((m, i) =>
        i === prev.length - 1
          ? { question, answer: null, relatedEvidence: [], error: err.message, loading: false }
          : m
      ))
    } finally {
      setLoading(false)
      sendingRef.current = false
    }
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <p className="mb-1 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
        Follow-up Questions
      </p>
      <p className="mb-5 font-body text-sm text-text-secondary">
        Ask about this specific verdict — e.g. how it applies to your situation or what the evidence means.
      </p>

      {/* Message thread */}
      {messages.length > 0 && (
        <div className="mb-5 flex flex-col gap-5">
          {messages.map((m, i) => (
            <div key={i}>
              {/* User question */}
              <div className="mb-2 flex justify-end">
                <p className="max-w-xs rounded-xl rounded-br-sm bg-accent/15 px-4 py-2 font-body text-sm text-text-primary">
                  {m.question}
                </p>
              </div>

              {/* Answer */}
              {m.loading && (
                <div className="flex items-center gap-2 pl-1">
                  <Spinner size={14} />
                  <span className="font-body text-xs text-text-secondary">Searching evidence…</span>
                </div>
              )}
              {m.answer && (
                <div className="rounded-xl rounded-bl-sm border border-border bg-elevated px-4 py-3">
                  <p className="font-body text-sm text-text-primary">{m.answer}</p>
                  {m.relatedEvidence?.length > 0 && (
                    <EvidenceList evidenceCards={m.relatedEvidence} compact />
                  )}
                  {m.saved === false && (
                    <p className="mt-2 font-body text-xs text-[#F59E0B]">
                      This answer couldn't be saved — it will be lost on refresh.
                    </p>
                  )}
                </div>
              )}
              {m.error && (
                <p className="rounded-lg border border-[#F04E4E]/30 bg-[#F04E4E]/10 px-3 py-2 font-body text-sm text-[#F04E4E]">
                  {m.error}
                </p>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="e.g. Does this apply differently for women over 50?"
          rows={2}
          className="flex-1 resize-none rounded-lg border border-border bg-elevated px-3 py-2.5 font-body text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-1 focus:ring-accent"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="self-end rounded-lg bg-accent px-4 py-2.5 font-body text-sm font-medium text-bg transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send size={16} />
        </button>
      </div>
      <p className="mt-2 font-body text-xs text-text-secondary">
        Press Enter to send · Shift+Enter for new line
      </p>
    </div>
  )
}
