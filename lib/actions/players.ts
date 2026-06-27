"use server"

import { createClient } from "@/lib/supabase/server"
import type { GlobalPlayer, BLStriker, LetterGrade } from "@/lib/types"

// ── Global Mode ───────────────────────────────────────────────────────────────

export async function getGlobalPlayers(): Promise<GlobalPlayer[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("players")
    .select(`
      id,
      name,
      team,
      position,
      player_stats_global (
        minutes,
        goals,
        assists,
        attacking_threat,
        chance_creation,
        ball_progression,
        defensive_actions,
        possession_security,
        physical_impact
      ),
      cluster_results_global (
        cluster_id,
        archetype_label,
        umap_x,
        umap_y
      )
    `)
    .not("position", "eq", "GK")
    .order("name")

  if (error) {
    console.error("getGlobalPlayers error:", error)
    return []
  }

  return (data ?? [])
    .filter((p) => p.player_stats_global && p.cluster_results_global)
    .map((p) => {
      const stats   = p.player_stats_global as any
      const cluster = p.cluster_results_global as any

      return {
        id:          p.id,
        name:        p.name,
        team:        p.team,
        nationality: p.team,
        position:    p.position as any,
        goals:       stats.goals   ?? 0,
        assists:     stats.assists ?? 0,
        minutes:     stats.minutes ?? 0,
        axes: {
          attacking_threat:    stats.attacking_threat    ?? 0,
          chance_creation:     stats.chance_creation     ?? 0,
          ball_progression:    stats.ball_progression    ?? 0,
          defensive_actions:   stats.defensive_actions   ?? 0,
          possession_security: stats.possession_security ?? 0,
          physical_impact:     stats.physical_impact     ?? 0,
        },
        cluster_id:      cluster.cluster_id,
        archetype_label: cluster.archetype_label,
        umap_x:          cluster.umap_x,
        umap_y:          cluster.umap_y,
      } satisfies GlobalPlayer
    })
}

// ── Blue Lock Mode ────────────────────────────────────────────────────────────

export async function getBLStrikers(): Promise<BLStriker[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("players")
    .select(`
      id,
      name,
      team,
      position,
      player_stats_raw (
        minutes,
        goals,
        assists
      ),
      player_stats_bluelock (
        shoot, offense, dribble, pass, speed, defense,
        grade_shoot, grade_offense, grade_dribble,
        grade_pass, grade_speed, grade_defense,
        overall_score, overall_grade,
        ego_x, ego_y
      ),
      cluster_results_bluelock (
        cluster_id,
        archetype_label
      )
    `)
    .eq("position", "FW")

  if (error) {
    console.error("getBLStrikers error:", error)
    return []
  }

  return (data ?? [])
    .filter((p) => p.player_stats_bluelock && p.cluster_results_bluelock)
    .map((p) => {
      const bl      = p.player_stats_bluelock as any
      const raw     = p.player_stats_raw as any
      const cluster = p.cluster_results_bluelock as any

      return {
        id:          p.id,
        name:        p.name,
        team:        p.team,
        nationality: p.team,
        categories: {
          shoot:   bl.shoot   ?? 0,
          offense: bl.offense ?? 0,
          dribble: bl.dribble ?? 0,
          pass:    bl.pass    ?? 0,
          speed:   bl.speed   ?? 0,
          defense: bl.defense ?? 0,
        },
        grades: {
          grade_shoot:   bl.grade_shoot   as LetterGrade,
          grade_offense: bl.grade_offense as LetterGrade,
          grade_dribble: bl.grade_dribble as LetterGrade,
          grade_pass:    bl.grade_pass    as LetterGrade,
          grade_speed:   bl.grade_speed   as LetterGrade,
          grade_defense: bl.grade_defense as LetterGrade,
        },
        overall_score:   bl.overall_score   ?? 0,
        overall_grade:   bl.overall_grade   as LetterGrade,
        ego_x:           bl.ego_x           ?? 50,
        ego_y:           bl.ego_y           ?? 50,
        cluster_id:      cluster.cluster_id,
        archetype_label: cluster.archetype_label,
        goals:           raw?.goals   ?? 0,
        assists:         raw?.assists ?? 0,
        minutes:         raw?.minutes ?? 0,
      } satisfies BLStriker
    })
    .sort((a, b) => b.overall_score - a.overall_score)
}

// ── Summary stats for StatCards ───────────────────────────────────────────────

export type SummaryStats = {
  totalPlayers:  number
  totalMatches:  number
  topScorer: {
    name:    string
    team:    string
    goals:   number
    assists: number
  } | null
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const supabase = await createClient()

  // Total outfield players
  const { count: playerCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .not("position", "eq", "GK")

  // Top scorer — player with most goals from raw stats
  const { data: topScorerData } = await supabase
    .from("player_stats_raw")
    .select("player_id, goals, assists")
    .order("goals", { ascending: false })
    .limit(1)
    .single()

  let topScorer = null
  if (topScorerData) {
    const { data: topPlayer } = await supabase
      .from("players")
      .select("name, team")
      .eq("id", topScorerData.player_id)
      .single()

    if (topPlayer) {
      topScorer = {
        name:    topPlayer.name,
        team:    topPlayer.team,
        goals:   topScorerData.goals,
        assists: topScorerData.assists,
      }
    }
  }

  return {
    totalPlayers: playerCount ?? 0,
    totalMatches: 48,             // WC 2026 group stage — update when known
    topScorer,
  }
}