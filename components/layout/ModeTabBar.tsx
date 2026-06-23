import Link from 'next/link'
import { siteConfig } from '@/config/site'

type Mode = 'global' | 'bluelock'

export function ModeTabBar({ activeMode }: { activeMode: Mode }) {
  const tabs: { mode: Mode; label: string }[] = [
    { mode: 'global',    label: siteConfig.modes.global },
    { mode: 'bluelock',  label: siteConfig.modes.bluelock },
  ]

  return (
    <div className="flex gap-1 border-b border-border">
      {tabs.map(({ mode, label }) => (
        <Link
          key={mode}
          href={`/dashboard?mode=${mode}`}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${
            activeMode === mode
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {label}
        </Link>
      ))}
    </div>
  )
}
