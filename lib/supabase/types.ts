// Database row types matching schema.sql exactly

export type DbPlayer = {
  id:           string
  fifa_player_id: string
  fifa_team_id:   string | null
  name:           string
  team:           string
  position:       string
  created_at:     string
}

export type DbPlayerStatsGlobal = {
  player_id:              string
  minutes:                number
  goals:                  number
  assists:                number
  attacking_threat:       number
  chance_creation:        number
  ball_progression:       number
  defensive_actions:      number
  possession_security:    number
  physical_impact:        number
  goals_p90:              number
  assists_p90:            number
  xg_p90:                 number
}

export type DbClusterGlobal = {
  player_id:      string
  cluster_id:     number
  archetype_label:string
  umap_x:         number
  umap_y:         number
}

export type DbPlayerStatsBL = {
  player_id:     string
  shoot:         number
  offense:       number
  dribble:       number
  pass:          number
  speed:         number
  defense:       number
  grade_shoot:   string
  grade_offense: string
  grade_dribble: string
  grade_pass:    string
  grade_speed:   string
  grade_defense: string
  overall_score: number
  overall_grade: string
  ego_x:         number
  ego_y:         number
}

export type DbClusterBL = {
  player_id:      string
  cluster_id:     number
  archetype_label:string
}

export type DbPlayerStatsRaw = {
  player_id:   string
  minutes:     number
  goals:       number
  assists:     number
  total_distance_km:  number | null
  avg_speed_kmh:      number | null
  sprints:            number | null
}