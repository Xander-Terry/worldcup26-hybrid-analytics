import { Suspense } from "react"
import { DashboardClient } from "./DashboardClient"
import { LeaderboardSkeleton } from "@/components/shared/LoadingSkeleton"
import { supabase } from "@/lib/supabase/server"

// 🚀 Force full dynamic rendering — no static prerender, no cached bundle
export const dynamic = "force-dynamic"
export const revalidate = 0
export const fetchCache = "force-no-store"
export const runtime = "nodejs"

export default async function DashboardPage() {
  console.log("🏁 Dashboard Page Render Triggered (Dynamic Mode)")

  const { getGlobalPlayers, getBLStrikers, getSummaryStats } =
    await import("@/lib/actions/players")

  try {
    console.log("📡 Fetching Global Players...")
    const globalPlayers = await getGlobalPlayers()
    console.log(`✅ Global Players Loaded (${globalPlayers?.length ?? 0})`)

    console.log("📡 Fetching Blue Lock Strikers...")
    const blStrikers = await getBLStrikers()
    console.log(`✅ Blue Lock Strikers Loaded (${blStrikers?.length ?? 0})`)

    console.log("📡 Fetching Summary Stats...")
    const summary = await getSummaryStats()
    console.log("✅ Summary Stats Loaded")

    // ⭐ Fetch tournament stage dynamically
    const { data: stageData } = await supabase
      .from("tournament_meta")
      .select("value")
      .eq("key", "stage")
      .single()

    const tournamentStage = stageData?.value ?? "Unknown"

    return (
      <Suspense fallback={<LeaderboardSkeleton />}>
        <DashboardClient
          globalPlayers={globalPlayers}
          blStrikers={blStrikers}
          summary={summary}
          tournamentStage={tournamentStage}
        />
      </Suspense>
    )
  } catch (err) {
    console.error("💥 DashboardPage crashed:", err)
    throw err
  }
}
