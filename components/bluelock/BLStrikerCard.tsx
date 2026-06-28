"use client"

import { GRADE_COLORS, BL_CAT_META } from "@/lib/types"
import type { BLStriker } from "@/lib/types"
import { BLRadarChart } from "@/components/bluelock/BLRadarChart"
import { BLOverallGrade } from "@/components/bluelock/BLOverallGrade"
import { BLLetterGrade } from "@/components/bluelock/BLLetterGrade"
import { StrikerCardSkeleton } from "@/components/shared/LoadingSkeleton"

const FLAGS: Record<string, string> = {
  France:"🇫🇷", Argentina:"🇦🇷", England:"🇬🇧", Portugal:"🇵🇹",
  Brazil:"🇧🇷", Germany:"🇩🇪", Spain:"🇪🇸", Norway:"🇳🇴",
  Egypt:"🇪🇬", Morocco:"🇲🇦", Senegal:"🇸🇳", Algeria:"🇩🇿",
  Netherlands:"🇳🇱", Belgium:"🇧🇪", Uruguay:"🇺🇾", Colombia:"🇨🇴",
  Mexico:"🇲🇽", Japan:"🇯🇵", Switzerland:"🇨🇭", Canada:"🇨🇦",
  Croatia:"🇭🇷", Ecuador:"🇪🇨", Sweden:"🇸🇪", Poland:"🇵🇱",
}
function getFlag(n: string) { return FLAGS[n] ?? "🏳️" }

// Corner bracket SVG decoration
function CornerBrackets({ color }: { color: string }) {
  const c = `${color}8c`  // 55% opacity
  const s = "M0 12 L0 0 L12 0"
  return (
    <>
      <svg className="absolute top-2 left-2 h-5 w-5" viewBox="0 0 12 12" fill="none">
        <path d={s} stroke={c} strokeWidth="1.5" />
      </svg>
      <svg className="absolute top-2 right-2 h-5 w-5 rotate-90" viewBox="0 0 12 12" fill="none">
        <path d={s} stroke={c} strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-2 left-2 h-5 w-5 -rotate-90" viewBox="0 0 12 12" fill="none">
        <path d={s} stroke={c} strokeWidth="1.5" />
      </svg>
      <svg className="absolute bottom-2 right-2 h-5 w-5 rotate-180" viewBox="0 0 12 12" fill="none">
        <path d={s} stroke={c} strokeWidth="1.5" />
      </svg>
    </>
  )
}

type Props = {
  striker: BLStriker | null
}

export function BLStrikerCard({ striker }: Props) {
  if (!striker) return <StrikerCardSkeleton />

  const color    = GRADE_COLORS[striker.overall_grade]
  const catScores = [
    striker.categories.shoot,
    striker.categories.offense,
    striker.categories.dribble,
    striker.categories.pass,
    striker.categories.speed,
    striker.categories.defense,
  ]

  return (
    <div
      className="flex flex-col gap-4 rounded-xl p-4"
      style={{ background: "#060F26", border: "1px solid #0E1D3D" }}
    >
      {/* Dossier header */}
      <div
        className="relative rounded-xl p-4 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0E1D3D, #060F26)",
          border: `1px solid ${color}44`,
        }}
      >
        {/* Crosshatch texture */}
        <div className="absolute inset-0 bl-crosshatch pointer-events-none" />

        <CornerBrackets color={color} />

        <div className="relative flex items-center justify-between gap-4">
          {/* Left: identity */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-3xl">{getFlag(striker.nationality)}</span>
            <div className="min-w-0">
              <p className="font-display text-xl font-black text-white leading-tight truncate">
                {striker.name}
              </p>
              <p className="font-mono text-xs text-[#6B7F9B] mt-0.5">
                {striker.nationality} · {striker.team}
              </p>
              <span
                className="mt-1.5 inline-block rounded px-2 py-0.5 font-mono text-[9px] font-bold"
                style={{
                  color:       "#00F0FF",
                  background:  "#00F0FF14",
                  border:      "1px solid #00F0FF44",
                }}
              >
                {striker.archetype_label.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Right: overall grade */}
          <BLOverallGrade grade={striker.overall_grade} />
        </div>
      </div>

      {/* Radar chart — centered */}
      <div className="flex justify-center">
        <BLRadarChart striker={striker} size={280} />
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "GOALS",   value: striker.goals },
          { label: "ASSISTS", value: striker.assists },
          { label: "MINUTES", value: striker.minutes },
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg p-2.5 text-center"
            style={{ background: "#0E1D3D", border: "1px solid #1e3a6a" }}
          >
            <p className="font-mono text-[9px] uppercase tracking-widest text-[#6B7F9B]">
              {label}
            </p>
            <p className="font-mono text-lg font-bold text-white mt-0.5">
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="grid grid-cols-6 gap-1">
        {BL_CAT_META.map((cat, i) => {
          const gradeKey   = `grade_${cat.key}` as keyof typeof striker.grades
          const catGrade   = striker.grades[gradeKey]
          const catColor   = GRADE_COLORS[catGrade as keyof typeof GRADE_COLORS]
          const rawScore   = catScores[i]

          return (
            <div
              key={cat.key}
              className="flex flex-col items-center gap-1 rounded-lg p-1.5"
              style={{
                background: "#060F26",
                border:     `1px solid ${catColor}33`,
              }}
            >
              <p className="font-mono text-[8px] text-[#6B7F9B]">{cat.abbr}</p>
              <p
                className="font-mono text-sm font-bold leading-none"
                style={{ color: catColor }}
              >
                {Math.round(rawScore)}
              </p>
              <BLLetterGrade grade={catGrade as any} size="sm" />
            </div>
          )
        })}
      </div>
    </div>
  )
}