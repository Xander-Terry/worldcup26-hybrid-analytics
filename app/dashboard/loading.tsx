import { LeaderboardSkeleton, RadarSkeleton } from "@/components/shared/LoadingSkeleton"

export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="h-14 border-b border-[#E2E8F0] bg-white/92" />
      <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-6 space-y-6">
        <div className="h-8 w-64 rounded-lg bg-slate-100 animate-pulse" />
        <div className="h-8 w-48 rounded-xl bg-slate-100 animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <LeaderboardSkeleton />
          </div>
          <div className="lg:col-span-2">
            <RadarSkeleton />
          </div>
        </div>
      </div>
    </div>
  )
}