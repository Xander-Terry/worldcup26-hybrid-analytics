// ── Shared across both modes ──────────────────────────────────────────────────

export type Position = "FW" | "MF" | "DF" | "GK"

export type LetterGrade = "S+" | "S" | "A" | "B" | "C" | "D" | "E" | "F" | "G"

export const GRADE_ORDER: LetterGrade[] = [
  "S+","S","A","B","C","D","E","F","G"
]

export const GRADE_COLORS: Record<LetterGrade, string> = {
  "S+": "#ffd700",
  "S":  "#c084fc",
  "A":  "#60a5fa",
  "B":  "#4ade80",
  "C":  "#facc15",
  "D":  "#fb923c",
  "E":  "#f87171",
  "F":  "#94a3b8",
  "G":  "#475569",
}

export const GRADE_INT: Record<LetterGrade, number> = {
  "S+": 9, "S": 8, "A": 7, "B": 6,
  "C": 5, "D": 4, "E": 3, "F": 2, "G": 1,
}

// ── Global Mode ───────────────────────────────────────────────────────────────

export type GlobalAxis = {
  attacking_threat:    number   // 0-100
  chance_creation:     number
  ball_progression:    number
  defensive_actions:   number
  possession_security: number
  physical_impact:     number
}

export const AXIS_META = [
  { key: "attacking_threat",    label: "AT", full: "Attacking Threat",    color: "#ef4444" },
  { key: "chance_creation",     label: "CC", full: "Chance Creation",     color: "#f97316" },
  { key: "ball_progression",    label: "BP", full: "Ball Progression",    color: "#eab308" },
  { key: "defensive_actions",   label: "DA", full: "Defensive Actions",   color: "#3b82f6" },
  { key: "possession_security", label: "PS", full: "Possession Security", color: "#8b5cf6" },
  { key: "physical_impact",     label: "PI", full: "Physical Impact",     color: "#10b981" },
] as const

export type GlobalPlayer = {
  id:               string
  name:             string
  team:             string
  nationality:      string
  position:         Position
  // Raw stats for display
  goals:            number
  assists:          number
  minutes:          number
  // Axis scores
  axes:             GlobalAxis
  // Cluster
  cluster_id:       number
  archetype_label:  string
  umap_x:           number
  umap_y:           number
}

// ── Blue Lock Mode ────────────────────────────────────────────────────────────

export type BLCategory = {
  shoot:   number   // 0-100
  offense: number
  dribble: number
  pass:    number
  speed:   number
  defense: number
}

export const BL_CAT_META = [
  { key: "shoot",   label: "SHOOT", abbr: "SHO", color: "#ef4444" },
  { key: "offense", label: "OFFENSE", abbr: "OFF", color: "#f97316" },
  { key: "dribble", label: "DRIBBLE", abbr: "DRI", color: "#eab308" },
  { key: "pass",    label: "PASS",   abbr: "PAS", color: "#3b82f6" },
  { key: "speed",   label: "SPEED",  abbr: "SPE", color: "#10b981" },
  { key: "defense", label: "DEFENSE",abbr: "DEF", color: "#8b5cf6" },
] as const

export type BLCategoryGrades = {
  grade_shoot:   LetterGrade
  grade_offense: LetterGrade
  grade_dribble: LetterGrade
  grade_pass:    LetterGrade
  grade_speed:   LetterGrade
  grade_defense: LetterGrade
}

export type BLStriker = {
  id:              string
  name:            string
  team:            string
  nationality:     string
  // BL scores
  categories:      BLCategory
  grades:          BLCategoryGrades
  overall_score:   number
  overall_grade:   LetterGrade
  // Ego Map
  ego_x:           number
  ego_y:           number
  // Cluster
  cluster_id:      number
  archetype_label: string
  // Raw stats for KPI cards
  goals:           number
  assists:         number
  minutes:         number
}

// ── Cluster colors ────────────────────────────────────────────────────────────

export const CLUSTER_COLORS: Record<number, string> = {
  0: "#ef4444",
  1: "#94a3b8",
  2: "#f97316",
  3: "#3b82f6",
  4: "#8b5cf6",
  5: "#10b981",
}

export const BL_CLUSTER_COLORS: Record<number, string> = {
  0: "#f87171",   // Press Striker
  1: "#ffd700",   // Ego Monster
  2: "#c084fc",   // Pure Predator
  3: "#6B7F9B",   // Shadow Nine
}