"use client"

import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ResponsiveContainer, Tooltip
} from "recharts"
import { AXIS_META } from "@/lib/types"
import type { GlobalAxis, GlobalPlayer } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/PlayerAvatar"
import { ClusterBadge } from "@/components/shared/ClusterBadge"
import { RadarSkeleton } from "@/components/shared/LoadingSkeleton"

// Custom axis tick — each label rendered in its stat color
function AxisTick({ x, y, payload }: any) {
  const axis = AXIS_META.find(a => a.full === payload.value)
  return (
    <text
      x={x} y={y}
      textAnchor="middle"
      dominantBaseline="central"
      fill={axis?.color ?? "#94a3b8"}
      fontSize={10}
      fontFamily="DM Mono, monospace"
      fontWeight={700}
    >
      {axis?.label ?? payload.value}
    </text>
  )
}

type Props = {
  primary:   GlobalPlayer | null
  compare?:  GlobalPlayer | null
}

export function GlobalRadarChart({ primary, compare }: Props) {
  if (!primary) {
    return (
      <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
        <p className="text-sm font-semibold text-[#0F172A] mb-1">Performance Radar</p>
        <p className="text-xs text-[#64748B] mb-4">Select a player from the leaderboard</p>
        <RadarSkeleton />
      </div>
    )
  }

  const toChartData = (axes: GlobalAxis) =>
    AXIS_META.map(a => ({
      axis:  a.full,
      value: Math.round(axes[a.key as keyof GlobalAxis]),
    }))

  const primaryData = toChartData(primary.axes)
  const compareData = compare ? toChartData(compare.axes) : null

  // Merge into single data array for recharts
  const chartData = primaryData.map((d, i) => ({
    axis:    d.axis,
    primary: d.value,
    compare: compareData?.[i]?.value ?? null,
  }))

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white p-4">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-[#0F172A] mb-1">
            Performance Radar
          </p>
          <PlayerAvatar
            name={primary.name}
            nationality={primary.nationality}
            position={primary.position}
            mode="global"
          />
        </div>
        <ClusterBadge
          clusterId={primary.cluster_id}
          archetypeLabel={primary.archetype_label}
        />
      </div>

      {/* Compare legend */}
      {compare && (
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full bg-[#2563EB]" />
            <span className="text-[10px] text-[#64748B] font-mono">
              {primary.name.split(" ").pop()}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-6 rounded-full bg-[#f59e0b]" />
            <span className="text-[10px] text-[#64748B] font-mono">
              {compare.name.split(" ").pop()}
            </span>
          </div>
        </div>
      )}

      {/* Chart */}
      <ResponsiveContainer width="100%" height={240}>
        <RadarChart data={chartData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <PolarGrid gridType="polygon" stroke="#E2E8F0" />
          <PolarAngleAxis dataKey="axis" tick={<AxisTick />} />

          <Radar
            name={primary.name}
            dataKey="primary"
            stroke="#2563EB"
            fill="#2563EB"
            fillOpacity={0.25}
            strokeWidth={2}
            dot={false}
          />

          {compare && compareData && (
            <Radar
              name={compare.name}
              dataKey="compare"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.15}
              strokeWidth={2}
              dot={false}
            />
          )}

          <Tooltip
            formatter={(value, name) => [Number(value ?? 0), String(name)]}
            contentStyle={{
              background: "#fff",
              border: "1px solid #E2E8F0",
              borderRadius: 8,
              fontSize: 11,
              fontFamily: "DM Mono, monospace",
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}