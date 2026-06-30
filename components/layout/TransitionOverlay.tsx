"use client"

import { motion, AnimatePresence } from "framer-motion"

type Props = { show: boolean }

// Fixed base size — animated via scale transform (GPU-accelerated, no layout thrash)
const RING_BASE = 40

export function TransitionOverlay({ show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          {/* Dark curtain */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "#060F26", willChange: "opacity" }}
            animate={{ opacity: [0, 0.97, 0.97, 0] }}
            transition={{ duration: 1.0, times: [0, 0.22, 0.68, 1], ease: "easeInOut" }}
          />

          {/* Ring 1 — fast inner pulse, scale-based */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: RING_BASE, height: RING_BASE,
              border: "1px solid #00F0FF",
              boxShadow: "0 0 20px #00F0FF55, inset 0 0 20px #00F0FF11",
              willChange: "transform, opacity",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 3, 22], opacity: [0, 1, 0] }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.05 }}
          />

          {/* Ring 2 */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: RING_BASE, height: RING_BASE,
              border: "1.5px solid #0F53D6",
              boxShadow: "0 0 30px #0F53D666",
              willChange: "transform, opacity",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 5, 35], opacity: [0, 0.8, 0] }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.12 }}
          />

          {/* Ring 3 */}
          <motion.div
            className="absolute rounded-full"
            style={{
              width: RING_BASE, height: RING_BASE,
              border: "0.5px solid #00F0FF",
              boxShadow: "0 0 8px #00F0FF33",
              willChange: "transform, opacity",
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 7.5, 45], opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.0, ease: "easeOut", delay: 0.18 }}
          />

          {/* Spark lines — single SVG, all 6 lines together (fewer DOM nodes) */}
          <motion.svg
            className="absolute"
            width="600" height="600"
            viewBox="-300 -300 600 600"
            style={{ overflow: "visible", willChange: "opacity" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ duration: 0.5, delay: 0.12 }}
          >
            {Array.from({ length: 6 }, (_, i) => {
              const angle = i * 60
              const rad   = (angle - 90) * (Math.PI / 180)
              const x2    = Math.cos(rad) * 280
              const y2    = Math.sin(rad) * 280
              return (
                <line
                  key={i}
                  x1={0} y1={0} x2={x2} y2={y2}
                  stroke="#00F0FF"
                  strokeWidth={0.8}
                  strokeOpacity={0.55}
                />
              )
            })}
          </motion.svg>

          {/* BLUE LOCK text */}
          <motion.div
            className="relative flex flex-col items-center gap-2"
            style={{ willChange: "transform, opacity" }}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.85, 1, 1, 0.95] }}
            transition={{ duration: 0.9, times: [0, 0.2, 0.7, 1] }}
          >
            <svg width="60" height="52" viewBox="0 0 60 52" className="mb-1">
              {[30, 21, 12].map((r, ri) => (
                <polygon
                  key={ri}
                  points={Array.from({ length: 6 }, (_, i) => {
                    const a = (i * 60 - 90) * Math.PI / 180
                    return `${30 + r * Math.cos(a)},${26 + r * Math.sin(a)}`
                  }).join(" ")}
                  fill="none"
                  stroke="#00F0FF"
                  strokeOpacity={0.15 + ri * 0.12}
                  strokeWidth={ri === 2 ? 0.5 : 1}
                />
              ))}
            </svg>

            <p
              className="font-display text-5xl font-black tracking-[0.2em]"
              style={{ color: "#00F0FF", textShadow: "0 0 30px #00F0FF66, 0 0 60px #00F0FF22" }}
            >
              BLUE LOCK
            </p>
            <p className="font-mono text-xs tracking-[0.3em] uppercase" style={{ color: "#6B7F9B" }}>
              Striker Evaluation System
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}