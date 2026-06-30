"use client"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Users, Activity, Trophy } from "lucide-react"

import { NavBar }            from "@/components/layout/NavBar"
import { ModeTabBar }        from "@/components/layout/ModeTabBar"
import { TransitionOverlay } from "@/components/layout/TransitionOverlay"

import { StatCard }            from "@/components/shared/StatCard"
import { PlayerLeaderboard }   from "@/components/global/PlayerLeaderboard"
import { GlobalRadarChart }    from "@/components/global/GlobalRadarChart"
import { ClusterScatterplot }  from "@/components/global/ClusterScatterplot"
import { PlayerCompare }       from "@/components/global/PlayerCompare"

import { BLStrikerList }  from "@/components/bluelock/BLStrikerList"
import { BLStrikerCard }  from "@/components/bluelock/BLStrikerCard"
import { BLEgoMap }       from "@/components/bluelock/BLEgoMap"
import { BLBanner } from "@/components/bluelock/BLBanner"


import type { GlobalPlayer, BLStriker } from "@/lib/types"
import type { SummaryStats }            from "@/lib/actions/players"

type Mode = "global" | "bluelock"

type Props = {
  globalPlayers: GlobalPlayer[]
  blStrikers:    BLStriker[]
  summary:       SummaryStats
}

export function DashboardClient({ globalPlayers, blStrikers, summary }: Props) {
  const [mode,          setMode]         = useState<Mode>("global")
  const [showOverlay,   setShowOverlay]  = useState(false)
  const hasEnteredBL                     = useRef(false)

  // Selected players
  const [selectedPlayer,  setSelectedPlayer]  = useState<GlobalPlayer | null>(
    globalPlayers[0] ?? null
  )
  const [comparePlayer,   setComparePlayer]   = useState<GlobalPlayer | null>(null)
  const [selectedStriker, setSelectedStriker] = useState<BLStriker | null>(
    blStrikers[0] ?? null
  )

  // Advanced tab for global mode
  const [advancedTab, setAdvancedTab] = useState<"clusters" | "compare">("clusters")

  function handleModeChange(newMode: Mode) {
    if (newMode === mode) return

    if (newMode === "bluelock" && !hasEnteredBL.current) {
      // First BL entry — cinematic transition
      hasEnteredBL.current = true
      setShowOverlay(true)
      setTimeout(() => setMode("bluelock"), 500)
      setTimeout(() => setShowOverlay(false), 1050)
    } else {
      setMode(newMode)
    }
  }

  const isGlobal = mode === "global"

  return (
    <>
      <TransitionOverlay show={showOverlay} />

      {/* Mode-aware background */}
      <div
        className="min-h-screen transition-colors duration-300"
        style={{ background: isGlobal ? "#F8FAFC" : "#060F26" }}
      >
        <NavBar mode={mode} />

        <div className="mx-auto max-w-[1440px] px-4 md:px-6 py-6 space-y-6">

          {/* Page header */}
          <AnimatePresence mode="wait">
            <motion.div
              key={mode}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              {isGlobal ? (
                <div>
                  <h1 className="text-2xl font-bold text-[#0F172A]">
                    World Cup 2026 — Scouting Dashboard
                  </h1>
                  <p className="text-sm text-[#64748B] mt-1">
                    Outfield player analytics · All groups · {summary.totalMatches} matches covered
                  </p>
                </div>
              ) : (
                <div>
                  <h1
                    className="font-display text-3xl font-black uppercase tracking-wide text-white"
                    style={{ textShadow: "0 0 24px #00F0FF2a" }}
                  >
                    Striker Evaluation System
                  </h1>
                  <p className="font-mono text-sm text-[#6B7F9B] mt-1">
                    Blue Lock Ego Rating Framework · WC26 Group Stage
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Mode tab bar */}
          <ModeTabBar activeMode={mode} onModeChange={handleModeChange} />

          {/* ── GLOBAL MODE ─────────────────────────────────────────── */}
          <AnimatePresence mode="wait">
            {isGlobal && (
              <motion.div
                key="global"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
                {/* Stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <StatCard
                    mode="global"
                    label="Total Players"
                    value={summary.totalPlayers.toLocaleString()}
                    subline="+24 from qualifier data"
                    icon={<Users className="h-4 w-4" />}
                  />
                  <StatCard
                    mode="global"
                    label="Matches Covered"
                    value={summary.totalMatches}
                    subline="Group stage complete"
                    icon={<Activity className="h-4 w-4" />}
                  />
                  <StatCard
                    mode="global"
                    label="Top Scorer"
                    value={
                      summary.topScorer
                        ? summary.topScorer.name.split(" ").pop() ?? summary.topScorer.name
                        : "—"
                    }
                    subline={
                      summary.topScorer
                        ? `${summary.topScorer.goals} goals · ${summary.topScorer.assists} assists`
                        : undefined
                    }
                    icon={<Trophy className="h-4 w-4" />}
                  />
                </div>

                {/* Main content — leaderboard + radar */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Leaderboard (3/5) */}
                  <div className="lg:col-span-3">
                    <PlayerLeaderboard
                      players={globalPlayers}
                      selectedId={selectedPlayer?.id}
                      onSelectPlayer={p => {
                        setSelectedPlayer(p)
                        setComparePlayer(null)
                      }}
                    />
                  </div>

                  {/* Radar + compare (2/5) */}
                  <div className="lg:col-span-2 space-y-4">
                    <GlobalRadarChart
                      primary={selectedPlayer}
                      compare={comparePlayer}
                    />
                    {selectedPlayer && (
                      <PlayerCompare
                        players={globalPlayers}
                        primaryId={selectedPlayer.id}
                        selected={comparePlayer}
                        onSelect={setComparePlayer}
                      />
                    )}
                  </div>
                </div>

                {/* Advanced analytics tabs */}
                <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
                  {/* Tab bar */}
                  <div className="flex border-b border-[#E2E8F0]">
                    {(["clusters", "compare"] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setAdvancedTab(tab)}
                        className="px-5 py-3 text-xs font-semibold transition-colors"
                        style={{
                          color:         advancedTab === tab ? "#2563EB" : "#64748B",
                          background:    advancedTab === tab ? "#EFF6FF" : "transparent",
                          borderBottom:  advancedTab === tab ? "2px solid #2563EB" : "2px solid transparent",
                        }}
                      >
                        {tab === "clusters" ? "Cluster Analysis" : "Player Comparison"}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={advancedTab}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.14 }}
                      className="p-4"
                    >
                      {advancedTab === "clusters" ? (
                        <ClusterScatterplot
                          players={globalPlayers}
                          selectedId={selectedPlayer?.id}
                          onSelect={setSelectedPlayer}
                        />
                      ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          <GlobalRadarChart
                            primary={selectedPlayer}
                            compare={comparePlayer}
                          />
                          <PlayerCompare
                            players={globalPlayers}
                            primaryId={selectedPlayer?.id ?? null}
                            selected={comparePlayer}
                            onSelect={setComparePlayer}
                          />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* ── BLUE LOCK MODE ─────────────────────────────────────── */}
            {!isGlobal && (
              <motion.div
                key="bluelock"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0, transition: { delay: 0.52, duration: 0.22 } }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.22 }}
                className="space-y-6"
              >
              
              <BLBanner strikers={blStrikers}/>

                {/* Main content - striker list + card */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  {/* Striker list (2/5) */}
                  <div className="lg:col-span-2 min-h-[500px]">
                    <BLStrikerList
                      strikers={blStrikers}
                      selectedId={selectedStriker?.id}
                      onSelect={setSelectedStriker}
                    />
                  </div>

                  {/* Striker card (3/5) */}
                  <div className="lg:col-span-3">
                    <BLStrikerCard striker={selectedStriker} />
                  </div>
                </div>

                {/* Ego Map — full width */}
                <BLEgoMap
                  strikers={blStrikers}
                  selectedId={selectedStriker?.id}
                  onSelect={setSelectedStriker}
                />
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </>
  )
}