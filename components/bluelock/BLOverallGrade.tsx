"use client"

import { motion } from "framer-motion"
import { GRADE_COLORS } from "@/lib/types"
import type { LetterGrade } from "@/lib/types"

type Props = {
  grade: LetterGrade
}

export function BLOverallGrade({ grade }: Props) {
  const color   = GRADE_COLORS[grade]
  const isElite = grade === "S+" || grade === "S"

  return (
    <div className="relative flex flex-col items-center">
      {/* Pulsing glow — S and S+ only */}
      {isElite && (
        <motion.div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `radial-gradient(circle, ${color}66 0%, transparent 70%)`,
          }}
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      <div
        className="relative flex h-16 w-16 flex-col items-center justify-center rounded-xl"
        style={{
          background: `linear-gradient(135deg, ${color}22, ${color}08)`,
          border:     `2px solid ${color}`,
        }}
      >
        <p className="font-mono text-[9px] uppercase tracking-widest text-[#6B7F9B]">
          RATING
        </p>
        <p
          className="font-display text-3xl font-black leading-none"
          style={{ color }}
        >
          {grade}
        </p>
      </div>
    </div>
  )
}