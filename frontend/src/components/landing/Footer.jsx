import { Link } from 'react-router-dom'

export function Footer() {
  return (
    <footer className="border-t border-border px-6 py-8 bg-bg">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 sm:flex-row">
        <p className="text-sm text-text-secondary">
          © {new Date().getFullYear()} <span className="text-accent font-semibold">FitCheck</span>
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-text-secondary">
          <Link to="/" className="transition-colors hover:text-text-primary">About</Link>
          <Link to="/" className="transition-colors hover:text-text-primary">Pricing</Link>
          <Link to="/" className="transition-colors hover:text-text-primary">Privacy</Link>
          <Link to="/" className="transition-colors hover:text-text-primary">Contact</Link>
          <Link to="/login" className="transition-colors hover:text-text-primary font-medium text-text-primary">
            Log in
          </Link>
        </div>
      </div>
    </footer>
  )
}
