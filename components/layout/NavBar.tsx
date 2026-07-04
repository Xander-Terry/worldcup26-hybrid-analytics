"use client"

import Link from "next/link"
import Image from "next/Image"
type Props = {
  mode: "global" | "bluelock"
}

export function NavBar({ mode }: Props) {
  const isGlobal = mode === "global"

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background:           isGlobal ? "rgba(248,250,252,0.92)" : "rgba(6,15,38,0.92)",
        borderBottom:         isGlobal ? "1px solid #E2E8F0"      : "1px solid #0E1D3D",
        backdropFilter:       "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 md:px-6">
        {/* Logo — custom PNG, mode-aware, no bubble wrapper */}
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <Image
            src={isGlobal ? "/blackwc26raw.png" : "/fifa-world-cup-2026.png"}
            alt="WC26 Logo"
            width={32}
            height={32}
            className="h-8 w-auto object-contain"
            priority
          />

          <span
            className="text-sm font-bold"
            style={{ color: isGlobal ? "#0F172A" : "#FFFFFF" }}
          >
            WC26 Analytics
          </span>
        </Link>

        {/* Nav — Dashboard only, Admin removed */}
        <nav className="flex items-center gap-1">
          <Link
            href="/dashboard"
            className="rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors"
            style={{
              color:      isGlobal ? "#64748B" : "#6B7F9B",
              background: isGlobal ? "#F1F5F9" : "#0E1D3D",
            }}
          >
            Dashboard
          </Link>
        </nav>
      </div>
    </header>
  )
}