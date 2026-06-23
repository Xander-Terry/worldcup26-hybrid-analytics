import { ModeTabBar } from '@/components/layout/ModeTabBar'

export default function DashboardPage({
  searchParams,
}: {
  searchParams: { mode?: string }
}) {
  const mode = searchParams.mode === 'bluelock' ? 'bluelock' : 'global'

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">WC 2026 Analytics</h1>
        <p className="text-muted-foreground mt-1">
          FIFA World Cup 2026 � Player Performance Tracker
        </p>
      </div>

      <ModeTabBar activeMode={mode} />

      <div className="rounded-lg border border-border p-8 text-center text-muted-foreground">
        {mode === 'global' ? (
          <p>Global Analytics Mode � leaderboard and clustering coming in Slice 6</p>
        ) : (
          <p>Blue Lock Mode � striker analysis coming in Slice 7</p>
        )}
      </div>
    </div>
  )
}
