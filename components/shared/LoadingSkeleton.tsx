import { cn } from "@/lib/utils"

type Props = {
  className?: string
  mode?: "global" | "bluelock"
  style?: React.CSSProperties
}


export function LoadingSkeleton({ className, mode = "global", style }: Props) {
  return (
    <div
      style={style}
      className={cn(
        "animate-pulse rounded-md",
        mode === "global" ? "bg-slate-100" : "bg-[#0E1D3D]",
        className
      )}
    />
  )
}


// Pre-built skeletons for common shapes
export function LeaderboardSkeleton({ mode = "global" }: { mode?: "global" | "bluelock" }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          mode={mode}
          className="h-10 w-full"
          style={{ opacity: 1 - i * 0.08 } as React.CSSProperties}
        />
      ))}
    </div>
  )
}

export function RadarSkeleton({ mode = "global" }: { mode?: "global" | "bluelock" }) {
  return (
    <div className="flex flex-col gap-3 p-4">
      <LoadingSkeleton mode={mode} className="h-4 w-32" />
      <LoadingSkeleton mode={mode} className="h-[240px] w-full rounded-xl" />
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <LoadingSkeleton key={i} mode={mode} className="h-3 flex-1" />
        ))}
      </div>
    </div>
  )
}

export function StrikerCardSkeleton() {
  return (
    <div className="space-y-3 p-4">
      <LoadingSkeleton mode="bluelock" className="h-20 w-full rounded-xl" />
      <LoadingSkeleton mode="bluelock" className="h-[300px] w-full rounded-xl" />
      <div className="grid grid-cols-4 gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <LoadingSkeleton key={i} mode="bluelock" className="h-14 rounded-lg" />
        ))}
      </div>
    </div>
  )
}