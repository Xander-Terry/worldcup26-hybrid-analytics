"use client"

import { useState, useMemo } from "react"
import { ChevronDown, ChevronUp, ArrowUpDown, Search } from "lucide-react"
import { AXIS_META } from "@/lib/types"
import type { GlobalPlayer } from "@/lib/types"
import { PlayerAvatar } from "@/components/shared/PlayerAvatar"
import { LeaderboardSkeleton } from "@/components/shared/LoadingSkeleton"

type SortKey = "attacking_threat" | "chance_creation" | "ball_progression"
             | "defensive_actions" | "possession_security" | "physical_impact"
type SortDir = "desc" | "asc"
type PosFilter = "ALL" | "FW" | "MF" | "DF"

const PAGE_SIZE = 8

type Props = {
  players:         GlobalPlayer[]
  loading?:        boolean
  selectedId?:     string | null
  onSelectPlayer:  (player: GlobalPlayer) => void
}

export function PlayerLeaderboard({
  players, loading, selectedId, onSelectPlayer
}: Props) {
  const [search,     setSearch]     = useState("")
  const [posFilter,  setPosFilter]  = useState<PosFilter>("ALL")
  const [cluster,    setCluster]    = useState<string>("all")
  const [sortKey,    setSortKey]    = useState<SortKey>("attacking_threat")
  const [sortDir,    setSortDir]    = useState<SortDir>("desc")
  const [page,       setPage]       = useState(1)

  // Unique cluster labels for dropdown
  const clusterOptions = useMemo(() => {
    const seen = new Map<string, number>()
    players.forEach(p => seen.set(p.archetype_label, p.cluster_id))
    return Array.from(seen.entries())
  }, [players])

  // Filter + sort
  const filtered = useMemo(() => {
    let result = players

    if (search.trim()) {
      const q = search.toLowerCase()
      result = result.filter(
        p => p.name.toLowerCase().includes(q) ||
             p.team.toLowerCase().includes(q)
      )
    }

    if (posFilter !== "ALL") {
      result = result.filter(p => p.position === posFilter)
    }

    if (cluster !== "all") {
      result = result.filter(p => p.archetype_label === cluster)
    }

    result = [...result].sort((a, b) => {
      const av = a.axes[sortKey as keyof typeof a.axes]
      const bv = b.axes[sortKey as keyof typeof b.axes]
      return sortDir === "desc" ? bv - av : av - bv
    })

    return result
  }, [players, search, posFilter, cluster, sortKey, sortDir])

  const totalPages  = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows    = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  )

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === "desc" ? "asc" : "desc")
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
    setPage(1)
  }

  if (loading) return <LeaderboardSkeleton />

  return (
    <div className="rounded-xl border border-[#E2E8F0] bg-white overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 pt-4 pb-3 border-b border-[#E2E8F0]">
        <div className="text-[#2563EB]">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
        </div>
        <p className="text-sm font-semibold text-[#0F172A]">Player Leaderboard</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-[#E2E8F0]">
        {/* Search */}
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#94A3B8]" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            placeholder="Search player or team..."
            className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] pl-8 pr-3 py-1.5 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
        </div>

        {/* Position pills */}
        <div className="flex gap-1">
          {(["ALL","FW","MF","DF"] as PosFilter[]).map(p => (
            <button
              key={p}
              onClick={() => { setPosFilter(p); setPage(1) }}
              className="rounded-full px-2.5 py-1 text-[10px] font-bold transition-colors"
              style={{
                background: posFilter === p ? "#2563EB" : "#F1F5F9",
                color:      posFilter === p ? "#fff"     : "#64748B",
              }}
            >
              {p}
            </button>
          ))}
        </div>

        {/* Cluster dropdown */}
        <select
          value={cluster}
          onChange={e => { setCluster(e.target.value); setPage(1) }}
          className="rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-2 py-1.5 text-xs text-[#64748B] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        >
          <option value="all">All Clusters</option>
          {clusterOptions.map(([label]) => (
            <option key={label} value={label}>{label}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E2E8F0]">
              <th className="w-8 px-3 py-2 text-left font-mono text-[9px] text-[#CBD5E1]">#</th>
              <th className="px-3 py-2 text-left font-mono text-[9px] text-[#CBD5E1]">PLAYER</th>
              {AXIS_META.map(axis => (
                <th key={axis.key} className="px-2 py-2 text-left min-w-[70px]">
                  <button
                    onClick={() => handleSort(axis.key as SortKey)}
                    className="flex items-center gap-1 font-mono text-[9px] font-bold hover:opacity-80 transition-opacity"
                    style={{ color: axis.color }}
                  >
                    {axis.label}
                    {sortKey === axis.key
                      ? sortDir === "desc"
                        ? <ChevronDown className="h-3 w-3" />
                        : <ChevronUp className="h-3 w-3" />
                      : <ArrowUpDown className="h-3 w-3 opacity-30" />
                    }
                  </button>
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {pageRows.map((player, i) => {
              const globalRank  = (currentPage - 1) * PAGE_SIZE + i + 1
              const isSelected  = player.id === selectedId

              return (
                <tr
                  key={player.id}
                  onClick={() => onSelectPlayer(player)}
                  className="cursor-pointer border-b border-[#F1F5F9] transition-colors"
                  style={{
                    background: isSelected ? "#EFF6FF" : undefined,
                  }}
                  onMouseEnter={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = "#F8FAFC"
                  }}
                  onMouseLeave={e => {
                    if (!isSelected)
                      (e.currentTarget as HTMLElement).style.background = ""
                  }}
                >
                  <td className="px-3 py-2 font-mono text-[10px] text-[#CBD5E1]">
                    {globalRank}
                  </td>
                  <td className="px-3 py-2">
                    <PlayerAvatar
                      name={player.name}
                      nationality={player.nationality}
                      position={player.position}
                      mode="global"
                      size="sm"
                    />
                  </td>
                  {AXIS_META.map(axis => {
                    const val = Math.round(
                      player.axes[axis.key as keyof typeof player.axes]
                    )
                    return (
                      <td key={axis.key} className="px-2 py-2">
                        <div className="flex items-center gap-1.5">
                          {/* Mini progress bar */}
                          <div className="h-[3px] w-9 rounded-full bg-[#F1F5F9] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width:      `${val}%`,
                                background: axis.color,
                              }}
                            />
                          </div>
                          <span className="font-mono text-[9px] text-[#64748B]">
                            {val}
                          </span>
                        </div>
                      </td>
                    )
                  })}
                </tr>
              )
            })}

            {pageRows.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center font-mono text-xs text-[#94A3B8]">
                  No players match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-[#E2E8F0]">
        <p className="font-mono text-[10px] text-[#94A3B8]">
          {filtered.length} players · page {currentPage} of {totalPages}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded px-2 py-1 text-xs text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded px-2 py-1 text-xs text-[#64748B] hover:bg-[#F1F5F9] disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}

