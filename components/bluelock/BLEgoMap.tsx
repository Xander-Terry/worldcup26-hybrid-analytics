"use client"

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"
import { GRADE_COLORS } from "@/lib/types"
import type { BLStriker } from "@/lib/types"
import { BLLetterGrade } from "@/components/bluelock/BLLetterGrade"

const AXIS_LABELS = [
  { label: "WORLD-STYLE",  side: "left"   as const, color: "#60a5fa" },
  { label: "SELF-STYLE",   side: "right"  as const, color: "#f87171" },
  { label: "FREEDOM",      side: "top"    as const, color: "#00F0FF" },
  { label: "RESTRICTIVE",  side: "bottom" as const, color: "#0F53D6" },
]

const QUADRANT_LEGEND = [
  { label: "TEAM WEAPON",     color: "#60a5fa" },
  { label: "EGO MONSTER",     color: "#f87171" },
  { label: "SHADOW NINE",     color: "#6B7F9B" },
  { label: "PHANTOM STRIKER", color: "#c084fc" },
]

type TooltipItem = { payload: BLStriker }

function EgoTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null
  return (
    <div className="rounded-lg p-2.5 text-white text-xs" style={{ background: "#0E1D3D", border: "1px solid #1e3a6a" }}>
      <p className="font-display font-bold">{p.name}</p>
      <p className="font-mono text-[#6B7F9B] text-[10px] mb-1">{p.team}</p>
      <div className="flex items-center gap-1.5">
        <BLLetterGrade grade={p.overall_grade} size="sm" />
        <span className="font-mono text-[9px] text-[#6B7F9B]">{p.archetype_label}</span>
      </div>
    </div>
  )
}

type DotProps = { cx?: number; cy?: number; payload?: BLStriker; selectedId?: string | null }

function EgoDot({ cx = 0, cy = 0, payload, selectedId }: DotProps) {
  if (!payload) return null
  const color      = GRADE_COLORS[payload.overall_grade]
  const isSelected = payload.id === selectedId

  return (
    <g>
      {isSelected && (
        <circle cx={cx} cy={cy} r={16} fill="none" stroke={color} strokeOpacity={0.25} strokeWidth={1} />
      )}
      <circle
        cx={cx} cy={cy}
        r={isSelected ? 8 : 5}
        fill="#0F53D6"
        stroke={isSelected ? color : "#00F0FF"}
        strokeWidth={isSelected ? 2 : 1}
        strokeOpacity={0.9}
        style={{ filter: isSelected ? `drop-shadow(0 0 6px ${color})` : undefined, cursor: "pointer" }}
      />
      {isSelected && (
        <text x={cx} y={cy - 16} textAnchor="middle" fill="#fff" fontSize={9} fontFamily="DM Mono, monospace">
          {payload.name.split(" ").pop()}
        </text>
      )}
    </g>
  )
}

// Single puzzle-piece badge — bump on the side facing inward
function PuzzleLabel({
  label, side, color,
}: {
  label: string
  side:  "left" | "right" | "top" | "bottom"
  color: string
}) {
  const W = 92
  const H = 22
  const bump = 6

  // Bump points toward chart center
  let path: string
  if (side === "left") {
    // bump on right edge (pointing into chart)
    path = `M0,0 L${W - bump},0 Q${W},0 ${W},${bump} L${W},${H - bump} Q${W},${H} ${W - bump},${H} L0,${H} Z`
  } else if (side === "right") {
    // bump on left edge
    path = `M${bump},0 L${W},0 L${W},${H} L${bump},${H} Q0,${H} 0,${H - bump} L0,${bump} Q0,0 ${bump},0 Z`
  } else if (side === "top") {
    // bump on bottom edge
    path = `M0,0 L${W},0 L${W},${H - bump} Q${W},${H} ${W - bump},${H} L${bump},${H} Q0,${H} 0,${H - bump} Z`
  } else {
    // bottom — bump on top edge
    path = `M0,${bump} Q0,0 ${bump},0 L${W - bump},0 Q${W},0 ${W},${bump} L${W},${H} L0,${H} Z`
  }

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible" }}>
      <path d={path} fill={`${color}16`} stroke={color} strokeOpacity={0.5} strokeWidth={1} />
      <text
        x={W / 2} y={H / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill={color}
        fontSize={9}
        fontFamily="DM Mono, monospace"
        fontWeight={700}
        letterSpacing={0.5}
      >
        {label}
      </text>
    </svg>
  )
}

type Props = {
  strikers:    BLStriker[]
  selectedId?: string | null
  onSelect?:   (striker: BLStriker) => void
}

export function BLEgoMap({ strikers, selectedId, onSelect }: Props) {
  return (
    <div className="rounded-xl p-4" style={{ background: "#0E1D3D", border: "1px solid #1e3a6a" }}>
      <p className="font-display text-sm font-bold uppercase tracking-widest text-white mb-0.5">
        Striker Ego Map
      </p>
      <p className="font-mono text-[10px] text-[#6B7F9B] mb-3">
        Style Archetype Positioning — WC 2026
      </p>

      {/* Top axis label (Freedom) */}
      <div className="flex justify-center mb-1">
        <PuzzleLabel label="▲ FREEDOM" side="top" color={AXIS_LABELS[2].color} />
      </div>

      <div className="flex items-center gap-2">
        {/* Left axis label */}
        <div className="shrink-0 -rotate-90">
          <PuzzleLabel label="WORLD-STYLE" side="left" color={AXIS_LABELS[0].color} />
        </div>

        <div className="flex-1">
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
              <CartesianGrid stroke="#0F53D6" strokeOpacity={0.1} strokeDasharray="4 4" />
              <XAxis
                dataKey="ego_x" type="number" domain={[0, 100]}
                tick={false} tickLine={false}
                axisLine={{ stroke: "#0F53D6", strokeOpacity: 0.5, strokeWidth: 1 }}
              />
              <YAxis
                dataKey="ego_y" type="number" domain={[0, 100]}
                tick={false} tickLine={false}
                axisLine={{ stroke: "#0F53D6", strokeOpacity: 0.5, strokeWidth: 1 }}
              />
              <ReferenceLine x={50} stroke="#00F0FF" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="6 3" />
              <ReferenceLine y={50} stroke="#00F0FF" strokeOpacity={0.3} strokeWidth={1} strokeDasharray="6 3" />
              <Tooltip content={<EgoTooltip />} />
              <Scatter
                data={strikers}
                shape={(props: DotProps) => <EgoDot {...props} selectedId={selectedId} />}
                onClick={(point) => {
                  const striker = point?.payload as BLStriker | undefined
                  if (striker) onSelect?.(striker)
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>

        {/* Right axis label */}
        <div className="shrink-0 rotate-90">
          <PuzzleLabel label="SELF-STYLE" side="right" color={AXIS_LABELS[1].color} />
        </div>
      </div>

      {/* Bottom axis label (Restrictive) */}
      <div className="flex justify-center mt-1">
        <PuzzleLabel label="▼ RESTRICTIVE" side="bottom" color={AXIS_LABELS[3].color} />
      </div>

      {/* Quadrant legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {QUADRANT_LEGEND.map(q => (
          <span
            key={q.label}
            className="rounded px-2 py-0.5 font-mono text-[9px] font-bold"
            style={{ color: q.color, border: `1px solid ${q.color}44`, background: `${q.color}12` }}
          >
            {q.label}
          </span>
        ))}
      </div>
    </div>
  )
}