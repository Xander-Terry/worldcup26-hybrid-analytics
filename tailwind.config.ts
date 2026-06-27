import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      fontFamily: {
        sans:    ["Inter", "sans-serif"],
        mono:    ["DM Mono", "monospace"],
        display: ["Rajdhani", "sans-serif"],
      },
      colors: {
        // shadcn/ui CSS variable tokens
        border:     "hsl(var(--border))",
        input:      "hsl(var(--input))",
        ring:       "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT:    "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT:    "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT:    "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT:    "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT:    "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT:    "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // ── Global Mode tokens ──────────────────────────────
        global: {
          bg:       "#F8FAFC",
          surface:  "#FFFFFF",
          border:   "#E2E8F0",
          text:     "#0F172A",
          muted:    "#64748B",
          faint:    "#94A3B8",
          accent:   "#2563EB",
          "accent-surface": "#EFF6FF",
        },
        // ── Blue Lock Mode tokens ───────────────────────────
        bl: {
          bg:       "#060F26",
          panel:    "#0E1D3D",
          border:   "#1e3a6a",
          electric: "#00F0FF",
          samurai:  "#0F53D6",
          text:     "#FFFFFF",
          muted:    "#6B7F9B",
        },
        // ── 6-Axis stat colors ──────────────────────────────
        axis: {
          at: "#ef4444",   // Attacking Threat
          cc: "#f97316",   // Chance Creation
          bp: "#eab308",   // Ball Progression
          da: "#3b82f6",   // Defensive Actions
          ps: "#8b5cf6",   // Possession Security
          pi: "#10b981",   // Physical Impact
        },
        // ── BL Grade colors ─────────────────────────────────
        grade: {
          "s-plus": "#ffd700",
          s:        "#c084fc",
          a:        "#60a5fa",
          b:        "#4ade80",
          c:        "#facc15",
          d:        "#fb923c",
          e:        "#f87171",
          f:        "#94a3b8",
          g:        "#475569",
        },
        // ── Cluster colors ──────────────────────────────────
        cluster: {
          0: "#ef4444",
          1: "#94a3b8",
          2: "#f97316",
          3: "#3b82f6",
          4: "#8b5cf6",
          5: "#10b981",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      maxWidth: {
        dashboard: "1440px",
      },
      keyframes: {
        "shimmer-sweep": {
          "0%,100%": { opacity: "0.18" },
          "50%":     { opacity: "0.48" },
        },
        "grade-pulse": {
          "0%,100%": { opacity: "0" },
          "50%":     { opacity: "0.4" },
        },
      },
      animation: {
        "shimmer-sweep": "shimmer-sweep 2.6s ease-in-out infinite",
        "grade-pulse":   "grade-pulse 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

export default config