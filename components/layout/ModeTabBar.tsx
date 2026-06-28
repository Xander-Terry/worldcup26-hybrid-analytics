"use client"

import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Globe, Zap } from "lucide-react"

type Mode = "global" | "bluelock"

type Props = {
  activeMode:  Mode
  onModeChange: (mode: Mode) => void
}

export function ModeTabBar({ activeMode, onModeChange }: Props) {
  const isGlobal = activeMode === "global"

  return (
    <div
      className="flex items-center gap-1 rounded-xl p-1 w-fit"
      style={{
        background: isGlobal ? "#F1F5F9" : "#0E1D3D",
        border:     isGlobal ? "1px solid #E2E8F0" : "1px solid #1e3a6a",
      }}
    >
      {/* Global tab */}
      <button
        onClick={() => onModeChange("global")}
        className="relative flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-colors"
        style={{
          background: activeMode === "global" ? "#FFFFFF" : "transparent",
          color:      activeMode === "global" ? "#0F172A" : "#64748B",
          borderBottom: activeMode === "global" ? "2px solid #2563EB" : "2px solid transparent",
          boxShadow:    activeMode === "global"
            ? "0 1px 4px rgba(15,23,42,0.08)"
            : undefined,
        }}
      >
        <Globe className="h-3.5 w-3.5" />
        Global Analytics
      </button>

      {/* Blue Lock tab */}
      <button
        onClick={() => onModeChange("bluelock")}
        className="relative flex items-center gap-1.5 overflow-hidden rounded-lg px-4 py-2 text-sm font-bold transition-colors"
        style={{
          background:  activeMode === "bluelock" ? "#060F26" : "transparent",
          color:       activeMode === "bluelock" ? "#00F0FF" : "#6B7F9B",
          border:      activeMode === "bluelock" ? "1px solid #00F0FF" : "1px solid transparent",
          boxShadow:   activeMode === "bluelock"
            ? "0 0 12px #00F0FF22, inset 0 0 8px #00F0FF08"
            : undefined,
        }}
      >
        {/* Shimmer sweep — only when BL is active */}
        {activeMode === "bluelock" && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent"
            style={{ opacity: 0.18 }}
            animate={{ opacity: [0.18, 0.48, 0.18] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <Zap className="relative h-3.5 w-3.5" />
        <span className="relative">BLUE LOCK</span>
      </button>
    </div>
  )
}