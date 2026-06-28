import { Suspense } from "react"
import { getGlobalPlayers, getBLStrikers, getSummaryStats } from "@/lib/actions/players"
import { DashboardClient } from "./DashboardClient"
import { LeaderboardSkeleton } from "@/components/shared/LoadingSkeleton"

export default async function DashboardPage() {
  // All three fetches run in parallel
  const [globalPlayers, blStrikers, summary] = await Promise.all([
    getGlobalPlayers(),
    getBLStrikers(),
    getSummaryStats(),
  ])

  return (
    <Suspense fallback={<LeaderboardSkeleton />}>
      <DashboardClient
        globalPlayers={globalPlayers}
        blStrikers={blStrikers}
        summary={summary}
      />
    </Suspense>
  )
}