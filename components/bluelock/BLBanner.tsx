"use client"

import type { BLStriker } from "@/lib/types"
import { GRADE_COLORS } from "@/lib/types"
import Image from "next/image"


const GRADE_ORDER = ["S+","S","A","B","C","D","E","F","G"]

function gradeDistribution(strikers: BLStriker[]) {
  const counts: Record<string, number> = {}
  strikers.forEach(s => {
    counts[s.overall_grade] = (counts[s.overall_grade] ?? 0) + 1
  })
  return GRADE_ORDER
    .filter(g => counts[g] > 0)
    .map(g => ({
      grade: g,
      count: counts[g],
      color: GRADE_COLORS[g as keyof typeof GRADE_COLORS],
    }))
}

type Props = { strikers: BLStriker[] }

export function BLBanner({ strikers }: Props) {
  const dist     = gradeDistribution(strikers)
  const maxCount = Math.max(...dist.map(d => d.count), 1)

  return (
    // overflow-visible so the sprite can pop above the card boundary
    <div className="relative" style={{ overflow: "visible" }}>
      <div
        className="relative overflow-hidden rounded-xl px-5 py-3"
        style={{
          background: "linear-gradient(135deg, #0F53D6 0%, #060F26 55%, #0E1D3D 100%)",
          border:     "1px solid #0F53D666",
          boxShadow:  "0 0 40px #0F53D618",
        }}
      >
        {/* Grid background */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <pattern id="bl-banner-grid" width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M24 0H0V24" fill="none" stroke="#00F0FF" strokeOpacity={0.08} strokeWidth={0.6} />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#bl-banner-grid)" />
        </svg>

        {/* Content row: text left | sprite space center | bars right */}
        <div className="relative flex items-center justify-between gap-4">
          {/* Left: text */}
          <div className="shrink-0">
            <h2
              className="font-display text-lg font-black uppercase text-white leading-tight"
              style={{ textShadow: "0 0 20px #00F0FF2a" }}
            >
              Blue Lock Striker Analysis
            </h2>
            <p className="font-mono text-[11px] text-[#9fb3d6] mt-0.5">
              World Cup 2026: Ego Rating &amp; Classification
            </p>
          </div>

          {/* Center: sprite placeholder space — sprite is absolutely positioned */}
          <div className="flex-1" />

          {/* Right: grade distribution bars */}
          <div className="hidden sm:flex items-end gap-1 shrink-0 h-10">
            {dist.map(({ grade, count, color }) => (
              <div key={grade} className="flex flex-col items-center justify-end gap-0.5 h-full">
                <span className="font-mono text-[8px] leading-none" style={{ color }}>
                  {count}
                </span>
                <div
                  className="w-3 rounded-t"
                  style={{
                    height:     `${Math.max((count / maxCount) * 28, 3)}px`,
                    background: `${color}cc`,
                  }}
                />
                <span className="font-mono text-[7px] leading-none" style={{ color }}>
                  {grade}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ego sprite — pops above the card
          bottom is aligned to the card bottom (bottom-0)
          top extends upward freely because parent is overflow-visible
          horizontally centered between the text and bar chart */}
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: 0,
          left:   "50%",
          transform: "translateX(-50%)",
          // Height matches from card bottom up to the "STRIKER EVALUATION SYSTEM" title level
          // Adjust this value if the sprite needs to be taller or shorter
          height: "218px",
          display: "flex",
          alignItems: "flex-end",
          zIndex: 10,
        }}
      >
       <Image
          src="/egospritecrop.png"
          alt="Ego Sprite"
          width={300}
          height={218}
          style={{
            height: "100%",
            width: "auto",
            objectFit: "contain",
            objectPosition: "bottom",
          }}
          priority
        />

      </div>
    </div>
  )
}