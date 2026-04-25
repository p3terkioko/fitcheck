import { useEffect, useState } from 'react'
import { Lightbulb } from 'lucide-react'

const FACTS = [
  'The "anabolic window" myth — total daily protein intake matters far more than the 30-minute post-workout window.',
  'Muscle soreness (DOMS) is caused by micro-tears in muscle fibres, not lactic acid buildup.',
  'Spot reduction is physiologically impossible — fat is mobilised systemically, not locally.',
  'Sleep is when most muscle repair and growth hormone secretion happens. Training without recovery limits progress.',
  'Progressive overload — gradually increasing resistance — is the single most reliable stimulus for muscle growth.',
  'Creatine monohydrate is the most researched supplement in sports science, with consistent evidence for strength and power.',
  'Cardio does not "eat muscle" — adequate protein intake and resistance training prevent muscle loss during cardio.',
  'Hydration significantly affects performance. Even 2% body water loss impairs strength and endurance.',
]

export function DidYouKnow() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * FACTS.length))
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    let fadeTimer = null
    const interval = setInterval(() => {
      setVisible(false)
      fadeTimer = setTimeout(() => {
        setIdx(i => (i + 1) % FACTS.length)
        setVisible(true)
      }, 400)
    }, 6000)
    return () => {
      clearInterval(interval)
      if (fadeTimer) clearTimeout(fadeTimer)
    }
  }, [])

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <Lightbulb size={16} className="text-accent" strokeWidth={1.5} />
        <span className="font-mono text-xs font-medium uppercase tracking-widest text-text-secondary">
          While You Wait
        </span>
      </div>
      <p
        className="font-body text-sm leading-relaxed text-text-primary transition-opacity duration-400"
        style={{ opacity: visible ? 1 : 0 }}
      >
        {FACTS[idx]}
      </p>
    </div>
  )
}
