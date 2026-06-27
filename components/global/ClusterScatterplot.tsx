"use client"

import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts"
import { CLUSTER_COLORS } from "@/lib/types"
import type { GlobalPlayer } from "@/lib/types"
import { ClusterBadge } from "@/components/shared/ClusterBadge"

// Unique archetype labels + cluster IDs from player list
function getArchetypes(players: GlobalPlayer[]) {
  const seen = new Map<number, string>()
  players.forEach(p => {
    if (!seen.has(p.cluster_id)) seen.set(p.cluster_id, p.archetype_label)
  })
  return Array.from(seen.entries()).sort((a, b) => a[0] - b[0])
}

// Custom tooltip
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const p: GlobalPlayer = payload[0]?.payload
  if (!p) return null

  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-white p-2.5 shadow-lg">
      <p className="text-xs font-semibold text-[#0F172A]">{p.name}</p>
      <p className="text-[10px] text-[#64748B]">{p.team} · {p.position}</p>
      <div className="mt-1">
        <ClusterBadge clusterId={p.cluster_id} archetypeLabel={p.archetype_label} />
      </div>
      <div className="mt-1.5 grid grid-cols-2 gap-x-3 font-mono text-[9px] text-[#64748B]">
        <span>AT {Math.round(p.axes.attacking_threat)}</span>
        <span>BP {Math.round(p.axes.ball_progression)}</span>
      </div>
    </div>
  )
}

// Custom dot — larger + outlined for selected player
function ScatterDot(props: any) {
  const { cx, cy, payload, selectedId } = props
  const color    = CLUSTER_COLORS[payload.cluster_id] ?? "#94a3b8"
  const isSelected = payload.id === selectedId

  return (
    <circle
      cx={cx} cy={cy}
      r={isSelected ? 7 : 4}
      fill={color}
      fillOpacity={isSelected ? 1 : 0.7}
      stroke={isSelected ? "#fff" : "none"}
      strokeWidth={isSelected ? 2 : 0}
      style={{
        filter: isSelected ? `drop-shadow(0 0 6px ${color})` : undefined,
        cursor: "pointer",
      }}
    />
  )
}

type Props = {
  players:    GlobalPlayer[]
  selectedId?: string | null
  onSelect?:  (player: GlobalPlayer) => void
}

export function ClusterScatterplot({ players, selectedId, onSelect }: Props) {
  const archetypes = getArchetypes(players)

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className="text-sm font-semibold text-[#0F172A] mb-1">
        Player Style Clusters — UMAP Projection
      </p>
      <p className="text-[10px] text-[#64748B] font-mono mb-4">
        Each dot = one player · color = archetype cluster
      </p>

      <ResponsiveContainer width="100%" height={340}>
        <ScatterChart margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
          <CartesianGrid stroke="#E2E8F0" strokeDasharray="3 3" />
          <XAxis
            dataKey="umap_x"
            type="number"
            domain={["auto","auto"]}
            tick={{ fontSize: 9, fontFamily: "DM Mono, monospace", fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "UMAP Dimension 1",
              position: "insideBottomRight",
              offset: -4,
              fontSize: 9,
              fill: "#94A3B8",
              fontFamily: "DM Mono, monospace",
            }}
          />
          <YAxis
            dataKey="umap_y"
            type="number"
            domain={["auto","auto"]}
            tick={{ fontSize: 9, fontFamily: "DM Mono, monospace", fill: "#94A3B8" }}
            tickLine={false}
            axisLine={false}
            label={{
              value: "UMAP Dimension 2",
              angle: -90,
              position: "insideLeft",
              offset: 8,
              fontSize: 9,
              fill: "#94A3B8",
              fontFamily: "DM Mono, monospace",
            }}
          />
          <Tooltip content={<CustomTooltip />} />

          <Scatter
            data={players}
            shape={(props: any) => (
              <ScatterDot {...props} selectedId={selectedId} />
            )}
            onClick={(point) => {
              const player = point?.payload as GlobalPlayer
              if (player) onSelect?.(player)
            }}

          >
            {players.map(p => (
              <Cell
                key={p.id}
                fill={CLUSTER_COLORS[p.cluster_id] ?? "#94a3b8"}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mt-3">
        {archetypes.map(([cid, label]) => (
          <ClusterBadge key={cid} clusterId={cid} archetypeLabel={label} />
        ))}
      </div>
    </div>
  )
}