"use client"

import type { ReactNode } from "react"

type Props = { children: ReactNode }

export function GlobalModeCanvas({ children }: Props) {
  return (
    <div className="relative min-h-screen" style={{ background: "#F0F1F0" }}>

      {/* Layer 1: Pitch grid — entire page, very faint */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:  "url('/textures/pitch-grid.svg')",
          backgroundRepeat: "repeat",
          backgroundSize:   "360px 240px",
          opacity:          0.03,
          zIndex:           0,
        }}
      />

      {/* Layer 2: Grain texture */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          backgroundImage:  "url('/textures/grain.svg')",
          backgroundRepeat: "repeat",
          backgroundSize:   "220px 220px",
          opacity:          0.015,
          mixBlendMode:     "multiply",
          zIndex:           1,
        }}
      />

      {/* Layer 3: WC26 squiggle accent — top right corner, behind cards */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: "-300px",
          right: 0,
          width: "850px",
          height: "500px",
          zIndex: 2,
          opacity: .80,        // brighter
        }}
      >
        <img
          src="/textures/wc26-corner.svg"
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",   // no cropping
            objectPosition: "right top", // flush right
          }}
        />
      </div>



      {/* Layer 4: Page content — sits above all background layers */}
      <div className="relative" style={{ zIndex: 10 }}>
        {children}
      </div>
    </div>
  )
}