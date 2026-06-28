"use client"

import { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { GRADE_COLORS, BL_CAT_META } from "@/lib/types"
import type { BLStriker, LetterGrade } from "@/lib/types"
import { BLLetterGrade } from "@/components/bluelock/BLLetterGrade"

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

function getScore(p: BLStriker, key: SortKey): number {
  if (key === "overall") return p.overall_score
  return p.categories[key as keyof typeof p.categories]
}

type Props = {
  strikers:       BLStriker[]
  selectedId?:    string | null
  onSelect:       (striker: BLStriker) => void
}

export function BLStrikerList({ strikers, selectedId, onSelect }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("overall")

  const sorted = useMemo(() =>
    [...strikers].sort((a, b) => getScore(b, sortKey) - getScore(a, sortKey)),
    [strikers, sortKey]
  )

  return (
    <div className="flex h-full flex-col rounded-xl border border-[#1e3a6a] bg-[#0E1D3D] overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-[#1e3a6a]">
        <p className="font-display text-xs font-bold uppercase tracking-widest text-white">
          Striker Roster
        </p>
      </div>

      {/* Sort strip */}
      <div className="flex items-center gap-1 px-3 py-2 border-b border-[#1e3a6a] overflow-x-auto no-scrollbar">
        {SORT_LABELS.map(({ key, label }) => {
          const active = key === sortKey
          return (
            <button
              key={key}
              onClick={() => setSortKey(key)}
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

      {/* Roster list */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-2 py-2 space-y-1">
        {sorted.map((striker) => {
          const isSelected  = striker.id === selectedId
          const gradeColor  = GRADE_COLORS[striker.overall_grade]
          const isElite     = striker.overall_grade === "S+" || striker.overall_grade === "S"

          return (
            <motion.button
              key={striker.id}
              onClick={() => onSelect(striker)}
              whileHover={{ scale: 1.005 }}
              className="w-full rounded-lg px-3 py-2.5 text-left transition-colors"
              style={{
                background:  isSelected ? `${gradeColor}12` : "#060F26",
                border:      isSelected
                  ? `1px solid ${gradeColor}`
                  : "1px solid #1e3a6a",
                boxShadow:   isSelected && isElite
                  ? `0 0 14px ${gradeColor}22`
                  : undefined,
              }}
            >
              <div className="flex items-center justify-between gap-2">
                {/* Left: flag + name + team */}
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base shrink-0">
                    {getFlag(striker.nationality)}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-display text-sm font-bold text-white truncate">
                        {shortName(striker.name)}
                      </p>
                      {/* Overall grade badge */}
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
                    <p className="font-mono text-[9px] text-[#6B7F9B] truncate">
                      {striker.team}
                    </p>
                  </div>
                </div>

                {/* Right: 6 tiny category grade badges */}
                <div className="flex items-center gap-0.5 shrink-0">
                  {BL_CAT_META.map(cat => {
                    const gradeKey = `grade_${cat.key}` as keyof typeof striker.grades
                    const g = striker.grades[gradeKey] as LetterGrade
                    return (
                      <BLLetterGrade key={cat.key} grade={g} size="sm" />
                    )
                  })}
                </div>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// Helpers
const FLAGS: Record<string, string> = {
  France:"🇫🇷", Argentina:"🇦🇷", England:"🇬🇧", Portugal:"🇵🇹",
  Brazil:"🇧🇷", Germany:"🇩🇪", Spain:"🇪🇸", Norway:"🇳🇴",
  Egypt:"🇪🇬", Morocco:"🇲🇦", Senegal:"🇸🇳", Algeria:"🇩🇿",
  Netherlands:"🇳🇱", Belgium:"🇧🇪", Uruguay:"🇺🇾", Colombia:"🇨🇴",
  Mexico:"🇲🇽", Japan:"🇯🇵", Switzerland:"🇨🇭", Canada:"🇨🇦",
  Croatia:"🇭🇷", Ecuador:"🇪🇨", Sweden:"🇸🇪", Poland:"🇵🇱",
}
function getFlag(n: string) { return FLAGS[n] ?? "🏳️" }
function shortName(name: string) {
  const parts = name.split(" ")
  if (parts.length < 2 || name.length <= 14) return name
  return `${parts[0][0]}. ${parts.slice(1).join(" ")}`
}