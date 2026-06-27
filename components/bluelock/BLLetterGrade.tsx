"use client"

import { GRADE_COLORS } from "@/lib/types"
import type { LetterGrade } from "@/lib/types"
import { cn } from "@/lib/utils"

const SIZE_CLASSES = {
  sm: "h-[18px] w-[18px] text-[9px]",
  md: "h-6 w-6 text-[11px]",
  lg: "h-8 w-8 text-sm",
}

type Props = {
  grade:     LetterGrade
  size?:     "sm" | "md" | "lg"
  className?: string
}

export function BLLetterGrade({ grade, size = "md", className }: Props) {
  const color    = GRADE_COLORS[grade]
  const isElite  = grade === "S+" || grade === "S"

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded font-mono font-black leading-none",
        SIZE_CLASSES[size],
        className
      )}
      style={{
        backgroundColor: `${color}1a`,
        border:          `1px solid ${color}44`,
        color:           color,
        boxShadow:       isElite ? `0 0 8px ${color}99` : undefined,
      }}
    >
      {grade}
    </span>
  )
}