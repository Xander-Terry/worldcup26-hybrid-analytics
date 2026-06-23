-- =============================================
-- WC26 Hybrid Analytics — Database Schema
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- TABLE: players
-- One row per unique player (aggregated from CSV)
-- =============================================
CREATE TABLE IF NOT EXISTS players (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kaggle_player_id         TEXT UNIQUE NOT NULL,
  name                     TEXT NOT NULL,
  age                      INTEGER,
  nationality              TEXT NOT NULL,
  team                     TEXT NOT NULL,
  jersey_number            INTEGER,
  position                 TEXT NOT NULL,
  height_cm                NUMERIC,
  weight_kg                NUMERIC,
  preferred_foot           TEXT,
  club_name                TEXT,
  market_value_eur         NUMERIC,
  total_minutes_tournament INTEGER DEFAULT 0,
  total_goals_tournament   INTEGER DEFAULT 0,
  total_assists_tournament INTEGER DEFAULT 0,
  player_of_match_awards   INTEGER DEFAULT 0,
  tournament_rating        NUMERIC,
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TABLE: player_stats_global
-- Derived 6-axis scores for all outfield players
-- Minimum threshold: total_minutes_tournament >= 5
-- =============================================
CREATE TABLE IF NOT EXISTS player_stats_global (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id                UUID REFERENCES players(id) ON DELETE CASCADE,

  -- Per-90 aggregated raw stats
  goals_p90                NUMERIC DEFAULT 0,
  shots_on_target_p90      NUMERIC DEFAULT 0,
  xg_p90                   NUMERIC DEFAULT 0,
  key_passes_p90           NUMERIC DEFAULT 0,
  xa_p90                   NUMERIC DEFAULT 0,
  assists_p90              NUMERIC DEFAULT 0,
  successful_crosses_p90   NUMERIC DEFAULT 0,
  successful_dribbles_p90  NUMERIC DEFAULT 0,
  dribbles_attempted_p90   NUMERIC DEFAULT 0,
  successful_passes_p90    NUMERIC DEFAULT 0,
  pass_accuracy            NUMERIC DEFAULT 0,
  tackles_p90              NUMERIC DEFAULT 0,
  interceptions_p90        NUMERIC DEFAULT 0,
  defensive_actions_p90    NUMERIC DEFAULT 0,
  clearances_p90           NUMERIC DEFAULT 0,
  recoveries_p90           NUMERIC DEFAULT 0,
  aerial_duels_won_p90     NUMERIC DEFAULT 0,
  aerial_duels_lost_p90    NUMERIC DEFAULT 0,
  blocks_p90               NUMERIC DEFAULT 0,
  distance_p90             NUMERIC DEFAULT 0,
  sprint_distance_p90      NUMERIC DEFAULT 0,
  top_speed_kmh            NUMERIC DEFAULT 0,
  stamina_score            NUMERIC DEFAULT 0,
  accelerations_p90        NUMERIC DEFAULT 0,
  pressure_resistance      NUMERIC DEFAULT 0,
  possession_impact        NUMERIC DEFAULT 0,
  creativity_score         NUMERIC DEFAULT 0,
  offensive_contribution   NUMERIC DEFAULT 0,
  clutch_performance_score NUMERIC DEFAULT 0,
  fouls_suffered_p90       NUMERIC DEFAULT 0,
  total_goals_tournament   NUMERIC DEFAULT 0,
  total_assists_tournament NUMERIC DEFAULT 0,

  -- Derived 6-axis scores (0-100 percentile)
  attacking_threat         NUMERIC DEFAULT 0,
  chance_creation          NUMERIC DEFAULT 0,
  ball_progression         NUMERIC DEFAULT 0,
  defensive_actions        NUMERIC DEFAULT 0,
  possession_security      NUMERIC DEFAULT 0,
  physical_impact          NUMERIC DEFAULT 0,

  updated_at               TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

-- =============================================
-- TABLE: cluster_results_global
-- K-means + UMAP output for all outfield players
-- =============================================
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

-- =============================================
-- TABLE: player_stats_bluelock
-- BL 6-category scores + grades for FW only
-- =============================================
CREATE TABLE IF NOT EXISTS player_stats_bluelock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,

  -- BL category scores (0-100, normalized within FW subset)
  offense         NUMERIC DEFAULT 0,
  defense         NUMERIC DEFAULT 0,
  speed           NUMERIC DEFAULT 0,
  shoot           NUMERIC DEFAULT 0,
  pass            NUMERIC DEFAULT 0,
  dribble         NUMERIC DEFAULT 0,

  -- Per-category letter grades
  grade_offense   TEXT DEFAULT 'G',
  grade_defense   TEXT DEFAULT 'G',
  grade_speed     TEXT DEFAULT 'G',
  grade_shoot     TEXT DEFAULT 'G',
  grade_pass      TEXT DEFAULT 'G',
  grade_dribble   TEXT DEFAULT 'G',

  -- Overall grade
  overall_score   NUMERIC DEFAULT 0,
  overall_grade   TEXT DEFAULT 'G',

  -- Ego Map coordinates (0-100)
  ego_x           NUMERIC DEFAULT 0,
  ego_y           NUMERIC DEFAULT 0,

  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

-- =============================================
-- TABLE: cluster_results_bluelock
-- BL archetype clustering for FW players only
-- =============================================
CREATE TABLE IF NOT EXISTS cluster_results_bluelock (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id       UUID REFERENCES players(id) ON DELETE CASCADE,
  cluster_id      INTEGER NOT NULL,
  archetype_label TEXT NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id)
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_players_position    ON players(position);
CREATE INDEX IF NOT EXISTS idx_players_nationality ON players(nationality);
CREATE INDEX IF NOT EXISTS idx_players_minutes     ON players(total_minutes_tournament);
CREATE INDEX IF NOT EXISTS idx_global_cluster      ON cluster_results_global(cluster_id);
CREATE INDEX IF NOT EXISTS idx_bl_cluster          ON cluster_results_bluelock(cluster_id);
CREATE INDEX IF NOT EXISTS idx_stats_global_player ON player_stats_global(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_bl_player     ON player_stats_bluelock(player_id);
