import { Sidebar } from './Sidebar'

export function AppShell({ children }) {
  return (
    <div className="flex min-h-screen flex-col bg-bg md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
