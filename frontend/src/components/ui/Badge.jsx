export function Badge({ children, color = '#8B92A5', filled = false, className = '' }) {
  const style = filled
    ? { backgroundColor: color + '18', color, borderColor: color + '4D' }
    : { color, borderColor: color + '4D' }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-body text-xs font-medium ${className}`}
      style={style}
    >
      {children}
    </span>
  )
}
