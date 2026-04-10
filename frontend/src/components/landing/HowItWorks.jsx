import { Search, BookOpen, ShieldCheck } from 'lucide-react'

const steps = [
  {
    number: '01',
    icon: <Search size={24} strokeWidth={1.5} />,
    title: 'Submit a claim or video',
    desc: 'Type a fitness or nutrition claim, or paste a TikTok, Reel, or YouTube Shorts URL.',
  },
  {
    number: '02',
    icon: <BookOpen size={24} strokeWidth={1.5} />,
    title: 'AI searches the evidence',
    desc: 'FitCheck scans 900+ peer-reviewed studies using semantic AI to find relevant research.',
  },
  {
    number: '03',
    icon: <ShieldCheck size={24} strokeWidth={1.5} />,
    title: 'Get a cited verdict',
    desc: 'Receive a structured verdict with a confidence score and linked evidence cards.',
  },
]

export function HowItWorks() {
  return (
    <section id="how-it-works" className="bg-bg px-6 py-24">
      <div className="mx-auto max-w-5xl">
        <p className="mb-12 font-mono text-xs font-medium uppercase tracking-widest text-text-secondary text-center">
          How It Works
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map(step => (
            <div key={step.number} className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <span className="font-mono text-sm font-medium text-accent">{step.number}</span>
                <div className="text-accent">{step.icon}</div>
              </div>
              <h3 className="font-body text-base font-semibold text-text-primary">{step.title}</h3>
              <p className="font-body text-sm leading-relaxed text-text-secondary">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
