import { Loader2 } from 'lucide-react'

const variants = {
  primary: 'bg-accent text-bg font-medium hover:bg-accent/90 disabled:opacity-50',
  secondary: 'border border-accent text-accent hover:bg-accent/10 disabled:opacity-50',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-white/5 disabled:opacity-50',
  danger: 'border border-[#F04E4E] text-[#F04E4E] hover:bg-[#F04E4E]/10 disabled:opacity-50',
}

export function Button({ variant = 'primary', loading, children, className = '', ...props }) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5
        font-body text-sm transition-colors duration-150 cursor-pointer
        disabled:cursor-not-allowed
        ${variants[variant]} ${className}
      `}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading && <Loader2 size={16} className="animate-spin" />}
      {children}
    </button>
  )
}
