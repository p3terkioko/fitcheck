export function Card({ children, elevated, className = '', ...props }) {
  return (
    <div
      className={`rounded-xl border border-border p-6 ${elevated ? 'bg-elevated' : 'bg-card'} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
