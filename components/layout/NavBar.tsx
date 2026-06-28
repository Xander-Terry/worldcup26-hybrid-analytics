"use client"

import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import { Globe } from "lucide-react"

type Props = {
  mode: "global" | "bluelock"
}

export function NavBar({ mode }: Props) {
  const isGlobal = mode === "global"

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background:   isGlobal ? "rgba(248,250,252,0.92)" : "rgba(6,15,38,0.92)",
        borderBottom: isGlobal ? "1px solid #E2E8F0"      : "1px solid #0E1D3D",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
      }}
    >
      <div className="mx-auto flex h-14 max-w-[1440px] items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg"
            style={{
              background: isGlobal ? "#EFF6FF" : "#0F53D6",
            }}
          >
            <Globe
              className="h-4 w-4"
              style={{ color: isGlobal ? "#2563EB" : "#00F0FF" }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-bold"
              style={{ color: isGlobal ? "#0F172A" : "#FFFFFF" }}
            >
              WC26 Analytics
            </span>
            <span
              className="rounded px-1.5 py-0.5 font-mono text-[9px] font-bold"
              style={{
                color:      isGlobal ? "#2563EB" : "#00F0FF",
                background: isGlobal ? "#EFF6FF"  : "#00F0FF14",
                border:     isGlobal ? "1px solid #BFDBFE" : "1px solid #00F0FF44",
              }}
            >
              BETA
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          {[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Admin",     href: "/admin" },
          ].map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-lg px-3 py-1.5 text-sm transition-colors"
              style={{
                color:      isGlobal ? "#64748B" : "#6B7F9B",
                fontWeight: label === "Dashboard" ? 600 : 400,
                background: label === "Dashboard"
                  ? isGlobal ? "#F1F5F9" : "#0E1D3D"
                  : "transparent",
              }}
            >
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  )
}