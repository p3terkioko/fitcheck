import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { History, Settings, LogOut, Menu, X, CheckCircle } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { Avatar } from '../ui/Avatar'

export function Navbar() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [avatarOpen, setAvatarOpen] = useState(false)

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/submit" className="flex items-center gap-2">
          <CheckCircle size={22} className="text-accent" />
          <span className="font-heading text-lg text-text-primary">FitCheck</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link
            to="/history"
            className="flex items-center gap-1.5 font-body text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <History size={16} />
            History
          </Link>
          <Link
            to="/settings"
            className="flex items-center gap-1.5 font-body text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <Settings size={16} />
            Settings
          </Link>

          {/* Avatar dropdown */}
          <div className="relative">
            <button
              onClick={() => setAvatarOpen(o => !o)}
              className="rounded-full focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <Avatar src={user?.avatarUrl} name={user?.displayName || user?.email} size={34} />
            </button>
            {avatarOpen && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl border border-border bg-card p-2 shadow-xl">
                <div className="px-3 py-2 border-b border-border mb-1">
                  <p className="font-body text-sm font-medium text-text-primary truncate">
                    {user?.displayName || 'User'}
                  </p>
                  <p className="font-body text-xs text-text-secondary truncate">{user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-body text-sm text-text-secondary hover:bg-elevated hover:text-text-primary transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-text-secondary hover:text-text-primary"
          onClick={() => setMenuOpen(o => !o)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border bg-card px-6 py-4 md:hidden">
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
            <Avatar src={user?.avatarUrl} name={user?.displayName} size={36} />
            <div>
              <p className="font-body text-sm font-medium text-text-primary">{user?.displayName}</p>
              <p className="font-body text-xs text-text-secondary">{user?.email}</p>
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            <Link
              to="/history"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm text-text-secondary hover:bg-elevated hover:text-text-primary"
            >
              <History size={16} /> History
            </Link>
            <Link
              to="/settings"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm text-text-secondary hover:bg-elevated hover:text-text-primary"
            >
              <Settings size={16} /> Settings
            </Link>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2.5 font-body text-sm text-text-secondary hover:bg-elevated hover:text-text-primary"
            >
              <LogOut size={16} /> Sign out
            </button>
          </nav>
        </div>
      )}
    </nav>
  )
}
