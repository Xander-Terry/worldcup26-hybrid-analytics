"use client"

import { motion, AnimatePresence } from "framer-motion"

type Props = {
  show: boolean
}

export function TransitionOverlay({ show }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{ pointerEvents: "none" }}
        >
          {/* Dark curtain */}
          <motion.div
            className="absolute inset-0"
            style={{ background: "#060F26" }}
            animate={{ opacity: [0, 0.97, 0.97, 0] }}
            transition={{ duration: 1.0, times: [0, 0.22, 0.68, 1] }}
          />

          {/* Electric ring */}
          <motion.div
            className="absolute rounded-full"
            style={{
              border:    "1.5px solid #00F0FF",
              boxShadow: "0 0 24px #00F0FF66, inset 0 0 24px #00F0FF22",
            }}
            animate={{
              width:   ["0px",  "180px", "1600px"],
              height:  ["0px",  "180px", "1600px"],
              opacity: [0, 1, 0],
            }}
            transition={{ duration: 0.85, ease: "easeOut", delay: 0.06 }}
          />

          {/* BLUE LOCK text */}
          <motion.div
            className="relative flex flex-col items-center gap-1"
            animate={{
              opacity: [0, 1, 1, 0],
              scale:   [0.8, 1, 1, 0.9],
            }}
            transition={{ duration: 0.8, times: [0, 0.25, 0.7, 1] }}
          >
            <p
              className="font-display text-4xl font-black tracking-widest"
              style={{
                color:      "#00F0FF",
                textShadow: "0 0 24px #00F0FF2a",
              }}
            >
              BLUE LOCK
            </p>
            <p className="font-mono text-xs text-[#6B7F9B] tracking-widest uppercase">
              Striker Evaluation System
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}