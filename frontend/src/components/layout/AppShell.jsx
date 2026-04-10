import { Sidebar } from './Sidebar'

export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
