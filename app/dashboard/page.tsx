import { Suspense } from "react"
import { getGlobalPlayers, getBLStrikers, getSummaryStats } from "@/lib/actions/players"
import { DashboardClient } from "./DashboardClient"
import { LeaderboardSkeleton } from "@/components/shared/LoadingSkeleton"

export default async function DashboardPage() {
  console.log("🏁 1. Dashboard Page Render Triggered...")
  console.log("RAW URL:", JSON.stringify(process.env.SUPABASE_URL));

  try {
    console.log("📡 2. Fetching Global Players...")
    const globalPlayers = await getGlobalPlayers()
    console.log(`✅ 3. Global Players Finished! (Found ${globalPlayers?.length ?? 0} players)`)

    console.log("📡 4. Fetching Blue Lock Strikers...")
    const blStrikers = await getBLStrikers()
    console.log(`✅ 5. Blue Lock Strikers Finished! (Found ${blStrikers?.length ?? 0} strikers)`)

    console.log("📡 6. Fetching Summary Stats...")
    const summary = await getSummaryStats()
    console.log("✅ 7. Summary Stats Finished!")

    return (
      <Suspense fallback={<LeaderboardSkeleton />}>
        <DashboardClient
          globalPlayers={globalPlayers}
          blStrikers={blStrikers}
          summary={summary}
        />
      </Suspense>
    )
  } catch (err) {
    console.error("💥 DashboardPage crashed:", err)
    throw err
  }
}
