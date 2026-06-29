import { cn } from "@/lib/utils"
import type { Position } from "@/lib/types"
import { getFlag } from "@/lib/flags"

const POSITION_STYLES: Record<Position, { bg: string; text: string }> = {
  FW: { bg: "#FEF2F2", text: "#DC2626" },
  MF: { bg: "#EFF6FF", text: "#2563EB" },
  DF: { bg: "#F0FDF4", text: "#16A34A" },
  GK: { bg: "#FEFCE8", text: "#CA8A04" },
}

type Props = {
  name:        string
  nationality: string
  position:    Position
  mode?:       "global" | "bluelock"
  size?:       "sm" | "md"
  className?:  string
}

export function PlayerAvatar({
  name, nationality, position, mode = "global", size = "md", className
}: Props) {
  const pos    = POSITION_STYLES[position] ?? POSITION_STYLES.MF
  const isBL   = mode === "bluelock"
  const flag   = getFlag(nationality)

  const displayName = name.length > 18
    ? name.split(" ").map((w, i) => i === 0 ? w[0] + "." : w).join(" ")
    : name

  return (
    <div className={`flex items-center gap-2 ${className ?? ""}`}>
      <span className={size === "sm" ? "text-base" : "text-xl"}>{flag}</span>
      <div className="min-w-0">
        <p
          className={cn(
            "font-semibold leading-tight truncate",
            size === "sm" ? "text-xs" : "text-sm",
            isBL ? "font-display text-white" : "text-[#0F172A]"
          )}
        >
          {displayName}
        </p>
        <span
          className="inline-block rounded px-1.5 py-0 text-[9px] font-bold leading-4 mt-0.5"
          style={{
            backgroundColor: isBL ? `${pos.text}22` : pos.bg,
            color:           pos.text,
            border:          isBL ? `1px solid ${pos.text}44` : "none",
          }}
        >
          {position}
        </span>
      </div>
    </div>
  )
}