export function Avatar({ src, name, size = 36 }) {
  const initials = name
    ? name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'User'}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    )
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-elevated border border-border font-body text-sm font-medium text-text-secondary"
      style={{ width: size, height: size }}
    >
      {initials}
    </div>
  )
}
