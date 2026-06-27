import { cn } from "@/lib/utils"
import type { ReactNode } from "react"

type Props = {
  label:    string
  value:    ReactNode
  subline?: string
  icon?:    ReactNode
  mode?:    "global" | "bluelock"
  className?: string
}

export function StatCard({ label, value, subline, icon, mode = "global", className }: Props) {
  const isGlobal = mode === "global"

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-xl border p-4",
        isGlobal
          ? "bg-white border-[#E2E8F0] shadow-[0_1px_4px_rgba(15,23,42,0.05)]"
          : "bg-[#0E1D3D] border-[#1e3a6a]",
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
            isGlobal ? "bg-[#EFF6FF] text-[#2563EB]" : "bg-[#0F53D6]/20 text-[#00F0FF]"
          )}
        >
          {icon}
        </div>
      )}

      <div className="min-w-0">
        <p
          className={cn(
            "font-mono text-[10px] uppercase tracking-widest",
            isGlobal ? "text-[#64748B]" : "text-[#6B7F9B]"
          )}
        >
          {label}
        </p>
        <p
          className={cn(
            "font-mono text-xl font-bold leading-tight mt-0.5",
            isGlobal ? "text-[#0F172A]" : "text-white"
          )}
        >
          {value}
        </p>
        {subline && (
          <p
            className={cn(
              "text-[10px] mt-0.5",
              isGlobal ? "text-[#16a34a]" : "text-[#6B7F9B]"
            )}
          >
            {subline}
          </p>
        )}
      </div>
    </div>
  )
}