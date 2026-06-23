import Link from 'next/link'
import { siteConfig } from '@/config/site'

export function NavBar() {
  return (
    <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="font-bold text-lg tracking-tight">
          {siteConfig.name}
        </Link>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link href="/dashboard" className="hover:text-foreground transition-colors">
            Dashboard
          </Link>
          <Link href="/admin" className="hover:text-foreground transition-colors">
            Admin
          </Link>
        </nav>
      </div>
    </header>
  )
}
