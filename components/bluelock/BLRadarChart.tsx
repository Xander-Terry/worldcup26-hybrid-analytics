"use client"

import { useMemo } from "react"
import { GRADE_COLORS, BL_CAT_META } from "@/lib/types"
import type { BLStriker, LetterGrade } from "@/lib/types"

const SIZE       = 340
const CENTER     = SIZE / 2
const HEX_R      = 92
const RING_GAPS  = [16, 28, 38]
const RING_WIDTHS = [1, 2, 3]
const SEGMENT_COUNT = 64

function polar(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)]
}

function hexPath(r: number): string {
  const pts = Array.from({ length: 6 }, (_, i) => {
    const [x, y] = polar(i * 60, r)
    return `${x},${y}`
  })
  return `M ${pts.join(" L ")} Z`
}

function ringPath(r: number): string {
  const pts = Array.from({ length: 60 }, (_, i) => {
    const [x, y] = polar(i * 6, r)
    return `${x},${y}`
  })
  return `M ${pts.join(" L ")} Z`
}

function scorePath(scores: number[]): string {
  const pts = scores.map((s, i) => {
    const [x, y] = polar(i * 60, (s / 100) * HEX_R)
    return `${x},${y}`
  })
  return `M ${pts.join(" L ")} Z`
}

type Props = { striker: BLStriker; size?: number }

export function BLRadarChart({ striker, size = 340 }: Props) {
  const isElite       = striker.overall_grade === "S+" || striker.overall_grade === "S"

  const scores = useMemo(() => [
    striker.categories.shoot,
    striker.categories.offense,
    striker.categories.dribble,
    striker.categories.pass,
    striker.categories.speed,
    striker.categories.defense,
  ], [striker])

  const catGrades: LetterGrade[] = [
    striker.grades.grade_shoot,
    striker.grades.grade_offense,
    striker.grades.grade_dribble,
    striker.grades.grade_pass,
    striker.grades.grade_speed,
    striker.grades.grade_defense,
  ]

  const ring1R = HEX_R + RING_GAPS[0]
  const ring2R = HEX_R + RING_GAPS[1]
  const ring3R = HEX_R + RING_GAPS[2]
  const labelR = ring3R + 14   // tight to outer ring — no longer escapes card

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ overflow: "visible" }}
    >
      <defs>
        <radialGradient id={`radar-fill-${striker.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#0F53D6" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#0F53D6" stopOpacity={0.08} />
        </radialGradient>
        {isElite && (
          <filter id={`radar-glow-${striker.id}`} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      <path d={ringPath(ring1R)} fill="none" stroke="#0F53D6" strokeOpacity={0.4} strokeWidth={RING_WIDTHS[0]} />

      {Array.from({ length: SEGMENT_COUNT }, (_, i) => {
        const angle = i * (360 / SEGMENT_COUNT)
        const [x1, y1] = polar(angle, ring1R)
        const [x2, y2] = polar(angle, ring2R)
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}
            stroke="#0F53D6" strokeOpacity={0.18} strokeWidth={0.5} />
        )
      })}

      <path d={ringPath(ring2R)} fill="none" stroke="#0F53D6" strokeOpacity={0.45} strokeWidth={RING_WIDTHS[1]} />
      <path d={ringPath(ring3R)} fill="none" stroke="#0F53D6" strokeOpacity={0.55} strokeWidth={RING_WIDTHS[2]} />

      {[0.25, 0.5, 0.75, 1].map(frac => (
        <path
          key={frac}
          d={hexPath(HEX_R * frac)}
          fill="none"
          stroke="#0F53D6"
          strokeOpacity={frac === 1 ? 0.5 : 0.12}
          strokeWidth={frac === 1 ? 1.5 : 0.8}
        />
      ))}

      {Array.from({ length: 6 }, (_, i) => {
        const [x, y] = polar(i * 60, HEX_R)
        return (
          <line key={i} x1={CENTER} y1={CENTER} x2={x} y2={y}
            stroke="#0F53D6" strokeOpacity={0.25} strokeWidth={1} />
        )
      })}

      <path
        d={scorePath(scores)}
        fill={`url(#radar-fill-${striker.id})`}
        stroke="#00F0FF"
        strokeOpacity={0.9}
        strokeWidth={1.5}
        filter={isElite ? `url(#radar-glow-${striker.id})` : undefined}
      />

      {scores.map((s, i) => {
        const [x, y] = polar(i * 60, (s / 100) * HEX_R)
        return <circle key={i} cx={x} cy={y} r={3} fill="#00F0FF" fillOpacity={0.9} />
      })}

      {/* Category labels + grade pills — tight to outer ring, alternating anchor to avoid overlap */}
      {BL_CAT_META.map((cat, i) => {
        const angle        = i * 60
        const [lx, ly]     = polar(angle, labelR)
        const gradeColor   = GRADE_COLORS[catGrades[i]]
        const isEliteGrade = catGrades[i] === "S+" || catGrades[i] === "S"

        // Determine text-anchor based on horizontal position to avoid overlap
        let anchor: "start" | "middle" | "end" = "middle"
        if (lx > CENTER + 8) anchor = "start"
        else if (lx < CENTER - 8) anchor = "end"

        const above = ly < CENTER - 6
        const below = ly > CENTER + 6

        const labelDy = above ? -16 : below ? 16 : 0
        const pillDy  = above ? -2 : below ? 30 : 14

        return (
          <g key={cat.key}>
            <text
              x={lx}
              y={ly + labelDy}
              textAnchor={anchor}
              dominantBaseline="central"
              fill="#6B7F9B"
              fontSize={6.5}
              fontFamily="DM Mono, monospace"
              letterSpacing={0.3}
            >
              {cat.label}
            </text>
            <g transform={`translate(${lx}, ${ly + pillDy})`}>
              <rect
                x={-9} y={-6.5} width={18} height={13} rx={2.5}
                fill={`${gradeColor}22`}
                stroke={gradeColor}
                strokeWidth={0.7}
                strokeOpacity={0.7}
              />
              <text
                x={0} y={0.5}
                textAnchor="middle"
                dominantBaseline="central"
                fill={gradeColor}
                fontSize={7.5}
                fontFamily="Rajdhani, sans-serif"
                fontWeight={700}
                style={{
                  filter: isEliteGrade ? `drop-shadow(0 0 3px ${gradeColor})` : undefined,
                }}
              >
                {catGrades[i]}
              </text>
            </g>
          </g>
        )
      })}
    </svg>
  )
}