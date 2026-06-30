"use client"

import { GRADE_COLORS } from "@/lib/types"
import type { BLStriker } from "@/lib/types"

type Props = { striker: BLStriker }

// Vertical tag — slanted top-left corner, grid texture, name top, big grade, small score below
export function BLPlayerTag({ striker }: Props) {
  const color = GRADE_COLORS[striker.overall_grade]
  const W = 96
  const H = 130
  const SLANT = 16

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="shrink-0">
      <defs>
        <pattern id={`tag-grid-${striker.id}`} width="7" height="7" patternUnits="userSpaceOnUse">
          <path d="M7 0H0V7" fill="none" stroke="#00F0FF" strokeOpacity={0.08} strokeWidth={0.5} />
        </pattern>
      </defs>

      {/* Tag shape — slanted top-left corner */}
      <polygon
        points={`${SLANT},0 ${W},0 ${W},${H} 0,${H} 0,${SLANT}`}
        fill="#060F26"
        fillOpacity={0.92}
      />
      <polygon
        points={`${SLANT},0 ${W},0 ${W},${H} 0,${H} 0,${SLANT}`}
        fill={`url(#tag-grid-${striker.id})`}
      />
      <polygon
        points={`${SLANT},0 ${W},0 ${W},${H} 0,${H} 0,${SLANT}`}
        fill="none"
        stroke="#0F53D6"
        strokeOpacity={0.55}
        strokeWidth={1}
      />
      {/* Glow accent on slant edge */}
      <line x1={SLANT} y1={0} x2={0} y2={SLANT} stroke="#00F0FF" strokeOpacity={0.5} strokeWidth={1.2} />

      {/* Player name */}
      <text
        x={W / 2} y={16}
        textAnchor="middle"
        fill="white"
        fontSize={9}
        fontFamily="Rajdhani, sans-serif"
        fontWeight={700}
        letterSpacing={0.3}
      >
        {shortName(striker.name).toUpperCase()}
      </text>

      <line x1={6} y1={24} x2={W - 6} y2={24} stroke="#0F53D6" strokeOpacity={0.4} strokeWidth={0.5} />

      {/* Big overall grade letter */}
      <text
        x={W / 2} y={86}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontFamily="Rajdhani, sans-serif"
        fontWeight={800}
        fontSize={42}
        style={{ filter: `drop-shadow(0 0 6px ${color}aa)` }}
      >
        {striker.overall_grade}
      </text>

      <line x1={6} y1={104} x2={W - 6} y2={104} stroke="#0F53D6" strokeOpacity={0.4} strokeWidth={0.5} />

      {/* Numerical score */}
      <text
        x={W / 2} y={119}
        textAnchor="middle"
        fill="#6B7F9B"
        fontSize={11}
        fontFamily="DM Mono, monospace"
        fontWeight={500}
      >
        {Math.round(striker.overall_score)} PTS
      </text>
    </svg>
  )
}

function shortName(name: string) {
  const parts = name.split(" ")
  if (parts.length < 2) return name
  // For vertical tag, just use last name (most space-efficient)
  return parts[parts.length - 1]
}