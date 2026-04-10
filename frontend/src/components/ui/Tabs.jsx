export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-0 border-b border-border">
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`
            flex items-center gap-2 px-5 py-3 font-body text-sm font-medium
            border-b-2 transition-colors duration-150 -mb-px
            ${active === tab.value
              ? 'border-accent text-text-primary'
              : 'border-transparent text-text-secondary hover:text-text-primary'
            }
          `}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
