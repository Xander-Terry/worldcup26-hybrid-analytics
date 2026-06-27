"use client"

import { useState, useMemo } from "react"
import { AXIS_META } from "@/lib/types"
import type { GlobalPlayer } from "@/lib/types"

type Props = {
  players:  GlobalPlayer[]
  primaryId: string | null
  onSelect: (player: GlobalPlayer | null) => void
  selected: GlobalPlayer | null
}

export function PlayerCompare({ players, primaryId, onSelect, selected }: Props) {
  const [query, setQuery] = useState("")
  const [open,  setOpen]  = useState(false)

  const options = useMemo(() =>
    players
      .filter(p => p.id !== primaryId)
      .filter(p =>
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.team.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8),
    [players, primaryId, query]
  )

  return (
    <div className="mt-4 rounded-xl border border-[#E2E8F0] bg-white p-4">
      <p className="text-xs font-semibold text-[#0F172A] mb-2">Compare with...</p>

      {/* Search input */}
      <div className="relative">
        <input
          value={selected ? selected.name : query}
          onChange={e => {
            setQuery(e.target.value)
            if (selected) onSelect(null)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder="Search player..."
          className="w-full rounded-md border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2 text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
        />

        {open && options.length > 0 && (
          <div className="absolute z-20 mt-1 w-full rounded-lg border border-[#E2E8F0] bg-white shadow-lg overflow-hidden">
            {options.map(p => (
              <button
                key={p.id}
                onMouseDown={() => { onSelect(p); setQuery(""); setOpen(false) }}
                className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-[#F8FAFC] transition-colors"
              >
                <span className="text-xs font-medium text-[#0F172A]">{p.name}</span>
                <span className="text-[10px] text-[#64748B]">{p.team}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stat diff table */}
      {selected && (
        <div className="mt-3 space-y-1.5">
          {AXIS_META.map(axis => (
            <div key={axis.key} className="flex items-center gap-2">
              <span
                className="w-6 font-mono text-[9px] font-bold"
                style={{ color: axis.color }}
              >
                {axis.label}
              </span>
              <div className="flex-1 h-[3px] bg-[#F1F5F9] rounded-full" />
              <span className="w-8 text-right font-mono text-[9px] text-[#2563EB]">
                —
              </span>
              <span className="font-mono text-[9px] text-[#64748B]">vs</span>
              <span className="w-8 font-mono text-[9px] text-[#f59e0b]">
                {Math.round(selected.axes[axis.key as keyof typeof selected.axes])}
              </span>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <button
          onClick={() => { onSelect(null); setQuery("") }}
          className="mt-3 text-[10px] text-[#64748B] hover:text-[#ef4444] transition-colors"
        >
          Clear comparison
        </button>
      )}
    </div>
  )
}