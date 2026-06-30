"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { GRADE_COLORS, BL_CAT_META } from "@/lib/types"
import type { BLStriker, LetterGrade } from "@/lib/types"
import { BLLetterGrade } from "@/components/bluelock/BLLetterGrade"
import { getFlag } from "@/lib/flags"

type SortKey = "overall" | "shoot" | "offense" | "dribble" | "pass" | "speed" | "defense"

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: "overall",  label: "OVR" },
  { key: "shoot",    label: "SHO" },
  { key: "offense",  label: "OFF" },
  { key: "dribble",  label: "DRI" },
  { key: "pass",     label: "PAS" },
  { key: "speed",    label: "SPE" },
  { key: "defense",  label: "DEF" },
]

const PAGE_SIZE = 10

function getScore(p: BLStriker, key: SortKey): number {
  if (key === "overall") return p.overall_score
  return p.categories[key as keyof typeof p.categories]
}

function shortName(name: string) {
  const parts = name.split(" ")
  if (parts.length < 2 || name.length <= 14) return name
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`
}

type Props = {
  strikers:    BLStriker[]
  selectedId?: string | null
  onSelect:    (striker: BLStriker) => void
}

export function BLStrikerList({ strikers, selectedId, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("overall")
  const [page,    setPage]    = useState(1)

  const sorted = useMemo(() =>
    [...strikers].sort((a, b) => getScore(b, sortKey) - getScore(a, sortKey)),
    [strikers, sortKey]
  )

  const totalPages  = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageRows    = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  function handleSort(key: SortKey) {
    setSortKey(key)
    setPage(1)
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1e3a6a] bg-[#0E1D3D] overflow-hidden">
      <div className="px-4 pt-4 pb-3 border-b border-[#1e3a6a]">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-white">
          Striker Roster
        </p>
      </div>

      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1e3a6a] overflow-x-auto no-scrollbar">
        {SORT_LABELS.map(({ key, label }) => {
          const active = key === sortKey
          return (
            <button
              key={key}
              onClick={() => handleSort(key)}
              className="shrink-0 rounded px-2 py-1 font-mono text-[9px] font-bold transition-colors"
              style={{
                color:           active ? "#00F0FF" : "#6B7F9B",
                border:          active ? "1px solid #00F0FF" : "1px solid #1a3060",
                backgroundColor: active ? "#00F0FF12" : "transparent",
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-1 min-h-0">
        {pageRows.map((striker) => {
          const isSelected = striker.id === selectedId
          const gradeColor = GRADE_COLORS[striker.overall_grade]
          const isElite    = striker.overall_grade === "S+" || striker.overall_grade === "S"

          return (
            <div key={striker.id} className="relative rounded-lg group">


              {/* CONDITIONAL ELECTRIC + GLOW WRAPPER */}
              <div
                className={`
                  absolute inset-0 rounded-lg pointer-events-none z-[3]
                  transition-opacity duration-200
                  ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                `}
              >
                {/* Electric animated border */}
                <div
                  className="absolute inset-0 rounded-lg border-2"
                  style={{
                    borderColor: gradeColor,
                    filter: "url(#bl-electric-border)",
                  }}
                />

                {/* Fog glow layers */}
                <div
                  className="absolute inset-0 rounded-lg border-2"
                  style={{
                    borderColor: `${gradeColor}cc`,
                    filter: "blur(6px)",
                    opacity: 0.55,
                  }}
                />
                <div
                  className="absolute inset-0 rounded-lg border-2"
                  style={{
                    borderColor: `${gradeColor}aa`,
                    filter: "blur(14px)",
                    opacity: 0.40,
                  }}
                />
                <div
                  className="absolute inset-0 rounded-lg border-2"
                  style={{
                    borderColor: `${gradeColor}66`,
                    filter: "blur(25px)",
                    opacity: 0.40,
                  }}
                />
              </div>

              {/* ACTUAL CARD CONTENT */}
              <motion.button
                key={striker.id}
                onClick={() => onSelect(striker)}
                whileHover={{ scale: 1.01 }}
                className="w-full rounded-lg text-left bg-[#060F26] border px-3 py-2.5 z-[1]"
                style={{
                  borderColor: isSelected ? gradeColor : "#1e3a6a",
                  background: isSelected ? `${gradeColor}12` : "#060F26",
                }}
              >

                {/* your existing content stays EXACTLY the same */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">{getFlag(striker.nationality)}</span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-display text-sm font-bold text-white truncate">
                          {shortName(striker.name)}
                        </p>
                        <span
                          className="shrink-0 inline-flex items-center justify-center rounded px-1 font-mono text-[9px] font-black"
                          style={{
                            color:           gradeColor,
                            backgroundColor: `${gradeColor}1a`,
                            border:          `1px solid ${gradeColor}44`,
                            boxShadow:       isElite ? `0 0 6px ${gradeColor}99` : undefined,
                          }}
                        >
                          {striker.overall_grade}
                        </span>
                      </div>
                      <p className="font-mono text-[9px] text-[#6B7F9B] truncate">{striker.team}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5 shrink-0">
                    {BL_CAT_META.map(cat => {
                      const gradeKey = `grade_${cat.key}` as keyof typeof striker.grades
                      const g = striker.grades[gradeKey] as LetterGrade
                      return <BLLetterGrade key={cat.key} grade={g} size="sm" />
                    })}
                  </div>
                </div>
              </motion.button>
            </div>
          )
        })}
      </div>

      <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e3a6a]">
        <p className="font-mono text-[10px] text-[#6B7F9B]">
          {sorted.length} strikers · page {currentPage}/{totalPages}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="rounded px-2 py-1 text-xs text-[#6B7F9B] hover:text-[#00F0FF] disabled:opacity-30 transition-colors"
          >
            ‹
          </button>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="rounded px-2 py-1 text-xs text-[#6B7F9B] hover:text-[#00F0FF] disabled:opacity-30 transition-colors"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  )
}