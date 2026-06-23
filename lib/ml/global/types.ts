export type GlobalAxis =
  | 'attacking_threat'
  | 'chance_creation'
  | 'ball_progression'
  | 'defensive_actions'
  | 'possession_security'
  | 'physical_impact'

export type GlobalPlayerVector = {
  player_id: string
  attacking_threat: number
  chance_creation: number
  ball_progression: number
  defensive_actions: number
  possession_security: number
  physical_impact: number
}

export type GlobalClusterResult = {
  player_id: string
  cluster_id: number
  archetype_label: string
  umap_x: number
  umap_y: number
}
