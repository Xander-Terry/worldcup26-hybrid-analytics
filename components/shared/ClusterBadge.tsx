import { CLUSTER_COLORS } from "@/lib/types"

type Props = {
  clusterId:      number
  archetypeLabel: string
}

export function ClusterBadge({ clusterId, archetypeLabel }: Props) {
  const color = CLUSTER_COLORS[clusterId] ?? "#94a3b8"

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{
        backgroundColor: `${color}22`,
        color:           color,
        border:          `1px solid ${color}44`,
      }}
    >
      {archetypeLabel}
    </span>
  )
}