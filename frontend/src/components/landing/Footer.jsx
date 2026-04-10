export function Footer() {
  return (
    <footer className="bg-bg border-t border-border px-6 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-3 text-center">
        <div className="flex gap-5 font-body text-xs text-text-secondary">
          <a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-text-primary transition-colors">Contact</a>
        </div>
        <p className="font-body text-xs text-text-secondary">© FitCheck 2025</p>
      </div>
    </footer>
  )
}
