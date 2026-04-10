import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { CheckCircle, History, Settings, LogOut, Menu, X, Search } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'

const NAV_ITEMS = [
  { label: 'Check a Claim', icon: Search,      to: '/submit'  },
  { label: 'History',       icon: History,     to: '/history' },
  { label: 'Settings',      icon: Settings,    to: '/settings' },
]

function isActive(pathname, to) {
  if (to === '/submit') {
    return pathname === '/submit' || pathname === '/processing' || pathname.startsWith('/results')
  }
  return pathname === to
}

function NavContent({ user, onSignOut, onClose }) {
  const location = useLocation()

  return (
    <div className="flex h-full flex-col px-3 py-5">
      {/* Logo */}
      <Link
        to="/submit"
        onClick={onClose}
        className="mb-8 flex items-center gap-2.5 px-2"
      >
        <CheckCircle size={22} className="shrink-0 text-accent" />
        <span className="font-heading text-lg text-text-primary">FitCheck</span>
      </Link>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map(({ label, icon: Icon, to }) => {
          const active = isActive(location.pathname, to)
          return (
            <Link
              key={to}
              to={to}
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-body text-sm transition-colors ${
                active
                  ? 'bg-elevated font-medium text-text-primary'
                  : 'text-text-secondary hover:bg-elevated hover:text-text-primary'
              }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-border pt-4">
        <div className="mb-2 flex items-center gap-3 px-2">
          <Avatar src={user?.avatarUrl} name={user?.displayName || user?.email} size={30} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-body text-xs font-medium text-text-primary">
              {user?.displayName || 'User'}
            </p>
            <p className="truncate font-body text-[10px] text-text-secondary">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onSignOut}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 font-body text-sm text-text-secondary transition-colors hover:bg-elevated hover:text-text-primary"
        >
          <LogOut size={17} />
          Sign out
        </button>
      </div>
    </div>
  )
}

export function Sidebar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <>
      {/* ── Mobile top bar ── */}
      <div className="sticky top-0 z-50 flex items-center justify-between border-b border-border bg-bg px-4 py-3 md:hidden">
        <Link to="/submit" className="flex items-center gap-2">
          <CheckCircle size={20} className="text-accent" />
          <span className="font-heading text-base text-text-primary">FitCheck</span>
        </Link>
        <button
          onClick={() => setDrawerOpen(o => !o)}
          className="text-text-secondary hover:text-text-primary"
        >
          {drawerOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* ── Mobile drawer ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={() => setDrawerOpen(false)}
        >
          <div className="absolute inset-0 bg-black/50" />
          <div
            className="absolute bottom-0 left-0 top-0 w-64 border-r border-border bg-card"
            onClick={e => e.stopPropagation()}
          >
            <NavContent
              user={user}
              onSignOut={handleSignOut}
              onClose={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      {/* ── Desktop sidebar ── */}
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r border-border bg-card md:flex">
        <NavContent user={user} onSignOut={handleSignOut} onClose={() => {}} />
      </aside>
    </>
  )
}
