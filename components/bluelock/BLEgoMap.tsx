"use client"

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts"
import { GRADE_COLORS } from "@/lib/types"
import type { BLStriker } from "@/lib/types"
import { BLLetterGrade } from "@/components/bluelock/BLLetterGrade"

const QUADRANTS = [
  { label: "Team Weapon",     color: "#60a5fa" },
  { label: "Ego Monster",     color: "#f87171" },
  { label: "Shadow Nine",     color: "#6B7F9B" },
  { label: "Phantom Striker", color: "#c084fc" },
]

type TooltipItem = { payload: BLStriker }

function EgoTooltip({ active, payload }: { active?: boolean; payload?: TooltipItem[] }) {
  if (!active || !payload?.length) return null
  const p = payload[0]?.payload
  if (!p) return null

  return (
    <div
      className="rounded-lg p-2.5 text-white text-xs"
      style={{ background: "#0E1D3D", border: "1px solid #1e3a6a" }}
    >
      <p className="font-display font-bold">{p.name}</p>
      <p className="font-mono text-[#6B7F9B] text-[10px]">{p.team}</p>
      <div className="flex items-center gap-1.5 mt-1">
        <BLLetterGrade grade={p.overall_grade} size="sm" />
        <span className="font-mono text-[9px] text-[#6B7F9B]">
          ego={p.ego_x.toFixed(0)} · team={p.ego_y.toFixed(0)}
        </span>
      </div>
    </div>
  )
}

type DotProps = {
  cx?:         number
  cy?:         number
  payload?:    BLStriker
  selectedId?: string | null
}

function EgoDot({ cx = 0, cy = 0, payload, selectedId }: DotProps) {
  if (!payload) return null
  const color      = GRADE_COLORS[payload.overall_grade]
  const isSelected = payload.id === selectedId

  return (
    <g>
      <circle
        cx={cx} cy={cy}
        r={isSelected ? 9 : 5}
        fill={color}
        fillOpacity={isSelected ? 1 : 0.75}
        stroke={isSelected ? "#fff" : "none"}
        strokeWidth={isSelected ? 1.5 : 0}
        style={{
          filter: isSelected ? `drop-shadow(0 0 6px ${color})` : undefined,
          cursor: "pointer",
        }}
      />
      {isSelected && (
        <text
          x={cx} y={cy - 14}
          textAnchor="middle"
          fill="#fff"
          fontSize={9}
          fontFamily="DM Mono, monospace"
        >
          {payload.name.split(" ").pop()}
        </text>
      )}
    </g>
  )
}

type Props = {
  strikers:    BLStriker[]
  selectedId?: string | null
  onSelect?:   (striker: BLStriker) => void
}

export function BLEgoMap({ strikers, selectedId, onSelect }: Props) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ background: "#0E1D3D", border: "1px solid #1e3a6a" }}
    >
      <p className="font-display text-sm font-bold uppercase tracking-widest text-white mb-0.5">
        Striker Ego Map
      </p>
      <p className="font-mono text-[10px] text-[#6B7F9B] mb-4">
        Style Archetype Positioning — WC 2026
      </p>

      <ResponsiveContainer width="100%" height={320}>
        <ScatterChart margin={{ top: 16, right: 16, bottom: 24, left: 0 }}>
          <CartesianGrid stroke="#1e3a6a" strokeOpacity={0.5} strokeDasharray="3 3" />
          <XAxis
            dataKey="ego_x"
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 9, fontFamily: "DM Mono, monospace", fill: "#6B7F9B" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "◀ WORLD-STYLE    SELF-STYLE ▶",
              position: "insideBottom",
              offset: -12,
              fontSize: 9,
              fill: "#6B7F9B",
              fontFamily: "DM Mono, monospace",
            }}
          />
          <YAxis
            dataKey="ego_y"
            type="number"
            domain={[0, 100]}
            tick={{ fontSize: 9, fontFamily: "DM Mono, monospace", fill: "#6B7F9B" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "▼ RESTRICTIVE    FREEDOM ▲",
              angle: -90,
              position: "insideLeft",
              offset: 12,
              fontSize: 9,
              fill: "#6B7F9B",
              fontFamily: "DM Mono, monospace",
            }}
          />
          <ReferenceLine x={50} stroke="#00F0FF" strokeOpacity={0.2} strokeDasharray="4 4" />
          <ReferenceLine y={50} stroke="#00F0FF" strokeOpacity={0.2} strokeDasharray="4 4" />
          <Tooltip content={<EgoTooltip />} />
          <Scatter
            data={strikers}
            shape={(props: DotProps) => (
              <EgoDot {...props} selectedId={selectedId} />
            )}
            onClick={(point: { payload?: BLStriker }) => {
              if (point?.payload) {
                onSelect?.(point.payload)
              }
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2 mt-2">
        {QUADRANTS.map(q => (
          <span
            key={q.label}
            className="rounded-full px-2.5 py-0.5 font-mono text-[9px] font-bold"
            style={{
              color:      q.color,
              border:     `1px solid ${q.color}44`,
              background: `${q.color}12`,
            }}
          >
            {q.label}
          </span>
        ))}
      </div>
    </div>
  )
}