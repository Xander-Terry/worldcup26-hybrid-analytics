"use client"

import { useMemo } from "react"
import { GRADE_COLORS, BL_CAT_META } from "@/lib/types"
import type { BLStriker, LetterGrade } from "@/lib/types"

// Hexagonal radar — custom SVG, not recharts
// This matches the Figma spec: grade rings, axis spokes, grade labels at vertices

const SIZE    = 300
const CENTER  = SIZE / 2
const RADIUS  = 110
const GRADES: LetterGrade[] = ["G","F","E","D","C","B","A","S","S+"]

// Convert a score (0-100) to a radius value
function scoreToR(score: number): number {
  return (score / 100) * RADIUS
}

// Get x,y for a vertex given angle and radius
function polar(angleDeg: number, r: number): [number, number] {
  const rad = (angleDeg - 90) * (Math.PI / 180)
  return [
    CENTER + r * Math.cos(rad),
    CENTER + r * Math.sin(rad),
  ]
}

// Build a hexagon polygon points string
function hexPoints(r: number): string {
  return Array.from({ length: 6 }, (_, i) => {
    const [x, y] = polar(i * 60, r)
    return `${x},${y}`
  }).join(" ")
}

// Build SVG path for the player's score polygon
function scorePath(scores: number[]): string {
  const points = scores.map((s, i) => {
    const [x, y] = polar(i * 60, scoreToR(s))
    return `${x},${y}`
  })
  return `M ${points.join(" L ")} Z`
}

type Props = {
  striker:     BLStriker
  size?:       number
}

export function BLRadarChart({ striker, size = 300 }: Props) {
  const color  = GRADE_COLORS[striker.overall_grade]
  const isElite = striker.overall_grade === "S+" || striker.overall_grade === "S"

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

  const scale = size / SIZE

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className="overflow-visible"
    >
      <defs>
        {/* Radial gradient fill for player polygon */}
        <radialGradient id={`bl-fill-${striker.id}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={color} stopOpacity={0.55} />
          <stop offset="100%" stopColor={color} stopOpacity={0.04} />
        </radialGradient>

        {/* Glow filter for S/S+ */}
        {isElite && (
          <filter id={`bl-glow-${striker.id}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        )}
      </defs>

      {/* Grade rings — G through S+ as hex polygons */}
      {GRADES.map((g, gi) => {
        const ringR = ((gi + 1) / GRADES.length) * RADIUS
        const ringColor = GRADE_COLORS[g]
        return (
          <polygon
            key={g}
            points={hexPoints(ringR)}
            fill={ringColor}
            fillOpacity={0.22}
            stroke={ringColor}
            strokeOpacity={0.7}
            strokeWidth={0.7}
          />
        )
      })}

      {/* Axis spokes */}
      {Array.from({ length: 6 }, (_, i) => {
        const [x, y] = polar(i * 60, RADIUS + 4)
        return (
          <line
            key={i}
            x1={CENTER} y1={CENTER}
            x2={x} y2={y}
            stroke="#00F0FF"
            strokeOpacity={0.1}
            strokeWidth={1}
          />
        )
      })}

      {/* Player score polygon */}
      <path
        d={scorePath(scores)}
        fill={`url(#bl-fill-${striker.id})`}
        stroke={color}
        strokeOpacity={0.9}
        strokeWidth={1.5}
        filter={isElite ? `url(#bl-glow-${striker.id})` : undefined}
      />

      {/* Vertex dots */}
      {scores.map((s, i) => {
        const [x, y] = polar(i * 60, scoreToR(s))
        return (
          <circle key={i} cx={x} cy={y} r={2.5} fill={color} />
        )
      })}

      {/* Axis labels + grade badges at each vertex */}
      {BL_CAT_META.map((cat, i) => {
        const angle        = i * 60
        const labelR       = RADIUS + 28
        const [lx, ly]     = polar(angle, labelR)
        const gradeColor   = GRADE_COLORS[catGrades[i]]
        const isEliteGrade = catGrades[i] === "S+" || catGrades[i] === "S"

        // Offset label above/below based on angle
        const yOffset = ly < CENTER ? -10 : 10

        return (
          <g key={cat.key}>
            {/* Category name */}
            <text
              x={lx} y={ly + yOffset - 8}
              textAnchor="middle"
              dominantBaseline="central"
              fill="#6B7F9B"
              fontSize={6.5}
              fontFamily="DM Mono, monospace"
            >
              {cat.label}
            </text>

            {/* Grade letter */}
            <text
              x={lx} y={ly + yOffset + 4}
              textAnchor="middle"
              dominantBaseline="central"
              fill={gradeColor}
              fontSize={10}
              fontFamily="Rajdhani, sans-serif"
              fontWeight={700}
              style={{
                filter: isEliteGrade
                  ? `drop-shadow(0 0 3px ${gradeColor})`
                  : undefined,
              }}
            >
              {catGrades[i]}
            </text>
          </g>
        )
      })}
    </svg>
  )
}