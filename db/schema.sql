[System.IO.File]::WriteAllText(
  (Join-Path (Get-Location) "db\schema.sql"),
  @'
-- =============================================
-- WC26 Hybrid Analytics — Schema v3.0
-- Source: FIFA GameDay API (live WC2026 data)
-- Competition ID: 285023
-- =============================================

CREATE TABLE IF NOT EXISTS players (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fifa_player_id  TEXT UNIQUE NOT NULL,
  fifa_team_id    TEXT,
  name            TEXT NOT NULL,
  team            TEXT NOT NULL,
  position        TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_stats_raw (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,

  -- Playing time
  minutes                                   NUMERIC DEFAULT 0,

  -- Attacking
  goals                                     NUMERIC DEFAULT 0,
  assists                                   NUMERIC DEFAULT 0,
  xg                                        NUMERIC DEFAULT 0,
  xg_goal_efficiency_rate                   NUMERIC DEFAULT 0,
  attempt_at_goal                           NUMERIC DEFAULT 0,
  attempt_at_goal_on_target                 NUMERIC DEFAULT 0,
  attempt_at_goal_conversion_rate           NUMERIC DEFAULT 0,
  attempt_at_goal_inside_the_penalty_area   NUMERIC DEFAULT 0,
  attempt_at_goal_outside_the_penalty_area  NUMERIC DEFAULT 0,
  headed_attempt_at_goal                    NUMERIC DEFAULT 0,
  corners                                   NUMERIC DEFAULT 0,
  offsides                                  NUMERIC DEFAULT 0,
  own_goals                                 NUMERIC DEFAULT 0,

  -- Defending
  forced_turnovers                          NUMERIC DEFAULT 0,
  defensive_pressures_applied               NUMERIC DEFAULT 0,
  direct_defensive_pressures_applied        NUMERIC DEFAULT 0,

  -- Distribution
  passes                                    NUMERIC DEFAULT 0,
  passing_accuracy_rate                     NUMERIC DEFAULT 0,
  crosses                                   NUMERIC DEFAULT 0,
  crossing_accuracy_rate                    NUMERIC DEFAULT 0,
  linebreaks_attempted_defensive_line       NUMERIC DEFAULT 0,
  linebreak_attempted_defensive_line_rate   NUMERIC DEFAULT 0,
  attempted_switches_of_play                NUMERIC DEFAULT 0,
  switches_of_play_rate                     NUMERIC DEFAULT 0,

  -- Discipline
  fouls_against                             NUMERIC DEFAULT 0,
  fouls_for                                 NUMERIC DEFAULT 0,
  yellow_cards                              NUMERIC DEFAULT 0,
  red_cards                                 NUMERIC DEFAULT 0,
  indirect_red_cards                        NUMERIC DEFAULT 0,

  -- Movement / off-ball
  offers_to_receive_total                   NUMERIC DEFAULT 0,
  offers_to_receive_in_behind               NUMERIC DEFAULT 0,
  offers_to_receive_in_between              NUMERIC DEFAULT 0,
  offers_to_receive_in_front                NUMERIC DEFAULT 0,
  offers_to_receive_inside                  NUMERIC DEFAULT 0,
  offers_to_receive_outside                 NUMERIC DEFAULT 0,
  receptions_in_behind                      NUMERIC DEFAULT 0,
  receptions_between_midfield_and_defensive_line NUMERIC DEFAULT 0,
  receptions_under_pressure                 NUMERIC DEFAULT 0,
  number_of_involvements                    NUMERIC DEFAULT 0,

  -- Physical (stored in converted units)
  total_distance_km                         NUMERIC DEFAULT 0,
  avg_speed_kmh                             NUMERIC DEFAULT 0,
  sprints                                   NUMERIC DEFAULT 0,
  speed_runs                                NUMERIC DEFAULT 0,

  -- Goalkeeping (null for outfield)
  goalkeeper_saves                          NUMERIC,
  goalkeeper_actions_inside_box             NUMERIC,
  goalkeeper_actions_outside_box            NUMERIC,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE TABLE IF NOT EXISTS player_stats_global (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,

  -- Bayesian-smoothed per-90 rates
  goals_p90                          NUMERIC DEFAULT 0,
  assists_p90                        NUMERIC DEFAULT 0,
  xg_p90                             NUMERIC DEFAULT 0,
  attempt_at_goal_p90                NUMERIC DEFAULT 0,
  attempt_at_goal_on_target_p90      NUMERIC DEFAULT 0,
  attempt_inside_box_p90             NUMERIC DEFAULT 0,
  corners_p90                        NUMERIC DEFAULT 0,
  crosses_p90                        NUMERIC DEFAULT 0,
  passes_p90                         NUMERIC DEFAULT 0,
  linebreaks_p90                     NUMERIC DEFAULT 0,
  switches_p90                       NUMERIC DEFAULT 0,
  involvements_p90                   NUMERIC DEFAULT 0,
  forced_turnovers_p90               NUMERIC DEFAULT 0,
  pressures_p90                      NUMERIC DEFAULT 0,
  direct_pressures_p90               NUMERIC DEFAULT 0,
  fouls_drawn_p90                    NUMERIC DEFAULT 0,
  fouls_committed_p90                NUMERIC DEFAULT 0,
  receptions_under_pressure_p90      NUMERIC DEFAULT 0,
  offers_in_behind_p90               NUMERIC DEFAULT 0,
  receptions_in_behind_p90           NUMERIC DEFAULT 0,
  sprints_p90                        NUMERIC DEFAULT 0,
  speed_runs_p90                     NUMERIC DEFAULT 0,
  distance_p90                       NUMERIC DEFAULT 0,

  -- Rate stats (not per90 — already rates)
  passing_accuracy_rate              NUMERIC DEFAULT 0,
  crossing_accuracy_rate             NUMERIC DEFAULT 0,
  avg_speed_kmh                      NUMERIC DEFAULT 0,

  -- Derived 6-axis scores (0-100 percentile)
  attacking_threat                   NUMERIC DEFAULT 0,
  chance_creation                    NUMERIC DEFAULT 0,
  ball_progression                   NUMERIC DEFAULT 0,
  defensive_actions                  NUMERIC DEFAULT 0,
  possession_security                NUMERIC DEFAULT 0,
  physical_impact                    NUMERIC DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE TABLE IF NOT EXISTS cluster_results_global (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,
  cluster_id      INTEGER NOT NULL,
  archetype_label TEXT NOT NULL,
  umap_x          NUMERIC NOT NULL,
  umap_y          NUMERIC NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE TABLE IF NOT EXISTS player_stats_bluelock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,

  -- BL category scores (0-100, normalized within FW subset)
  shoot           NUMERIC DEFAULT 0,
  offense         NUMERIC DEFAULT 0,
  dribble         NUMERIC DEFAULT 0,
  pass            NUMERIC DEFAULT 0,
  speed           NUMERIC DEFAULT 0,
  defense         NUMERIC DEFAULT 0,

  -- Per-category letter grades
  grade_shoot     TEXT DEFAULT 'G',
  grade_offense   TEXT DEFAULT 'G',
  grade_dribble   TEXT DEFAULT 'G',
  grade_pass      TEXT DEFAULT 'G',
  grade_speed     TEXT DEFAULT 'G',
  grade_defense   TEXT DEFAULT 'G',

  -- Overall
  overall_score   NUMERIC DEFAULT 0,
  overall_grade   TEXT DEFAULT 'G',

  -- Ego Map
  ego_x           NUMERIC DEFAULT 0,
  ego_y           NUMERIC DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE TABLE IF NOT EXISTS cluster_results_bluelock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,
  cluster_id      INTEGER NOT NULL,
  archetype_label TEXT NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

CREATE TABLE IF NOT EXISTS ingestion_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_at          TIMESTAMPTZ DEFAULT NOW(),
  source          TEXT NOT NULL,
  players_written INTEGER DEFAULT 0,
  status          TEXT DEFAULT 'success',
  notes           TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_players_position   ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_team       ON players(team);
CREATE INDEX IF NOT EXISTS idx_global_cluster     ON cluster_results_global(cluster_id);
CREATE INDEX IF NOT EXISTS idx_bl_cluster         ON cluster_results_bluelock(cluster_id);
CREATE INDEX IF NOT EXISTS idx_stats_raw          ON player_stats_raw(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_global       ON player_stats_global(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_bl           ON player_stats_bluelock(player_id);
'@,
  [System.Text.Encoding]::UTF8
)
Write-Host "schema.sql v3.0 written" -ForegroundColor Green