import { Search } from 'lucide-react'
import { Button } from './Button'

export function EmptyState({ icon: Icon = Search, title, message, action, actionLabel }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 rounded-full border-2 border-border p-5">
        <Icon size={32} className="text-text-secondary" strokeWidth={1.5} />
      </div>
      <h3 className="mb-2 font-heading text-xl text-text-primary">{title}</h3>
      <p className="mb-6 max-w-sm font-body text-sm text-text-secondary">{message}</p>
      {action && (
        <Button onClick={action}>{actionLabel || 'Get started'}</Button>
      )}
    </div>
  )
}
