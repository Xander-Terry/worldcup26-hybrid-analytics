export const GLOBAL_K = 6
export const MINUTES_THRESHOLD = 5

export const UMAP_PARAMS = {
  n_neighbors: 15,
  min_dist: 0.1,
  random_state: 42,
}

// Axis display metadata ï¿½ weights live in scripts/cluster_global.py
export const GLOBAL_AXES = [
  { key: 'attacking_threat',    label: 'Attacking Threat',    color: '#ef4444' },
  { key: 'chance_creation',     label: 'Chance Creation',     color: '#f97316' },
  { key: 'ball_progression',    label: 'Ball Progression',    color: '#eab308' },
  { key: 'defensive_actions',   label: 'Defensive Actions',   color: '#3b82f6' },
  { key: 'possession_security', label: 'Possession Security', color: '#8b5cf6' },
  { key: 'physical_impact',     label: 'Physical Impact',     color: '#10b981' },
] as const

// Filled after first cluster run
export const GLOBAL_ARCHETYPE_LABELS: Record<number, string> = {
  0: 'Box Threat',
  1: 'Press Engine',
  2: 'Playmaker',
  3: 'Ball Winner',
  4: 'Wing Carrier',
  5: 'Defensive Shield',
}
