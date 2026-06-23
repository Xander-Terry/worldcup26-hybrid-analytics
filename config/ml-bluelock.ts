export const BL_K = 4
export const BL_MINUTES_THRESHOLD = 5

export const BL_CATEGORIES = [
  { key: 'shoot',   label: 'Shoot',   color: '#ef4444' },
  { key: 'offense', label: 'Offense', color: '#f97316' },
  { key: 'dribble', label: 'Dribble', color: '#eab308' },
  { key: 'pass',    label: 'Pass',    color: '#3b82f6' },
  { key: 'speed',   label: 'Speed',   color: '#10b981' },
  { key: 'defense', label: 'Defense', color: '#8b5cf6' },
] as const

export const GRADE_BANDS = [
  { min: 100, max: 100, grade: 'S+' },
  { min: 90,  max: 99,  grade: 'S'  },
  { min: 80,  max: 89,  grade: 'A'  },
  { min: 70,  max: 79,  grade: 'B'  },
  { min: 60,  max: 69,  grade: 'C'  },
  { min: 50,  max: 59,  grade: 'D'  },
  { min: 40,  max: 49,  grade: 'E'  },
  { min: 30,  max: 39,  grade: 'F'  },
  { min: 0,   max: 29,  grade: 'G'  },
] as const

export type LetterGrade = 'S+' | 'S' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'

export const BL_ARCHETYPE_LABELS: Record<number, string> = {
  0: 'Solo Threat',
  1: 'Phantom Striker',
  2: 'Team Weapon',
  3: 'Shadow Nine',
}

export const EGO_AXIS = {
  x: { left: 'Holistic (World-Style)', right: 'Self-Style (Individualistic)' },
  y: { bottom: 'Restrictive', top: 'Freedom' },
} as const
