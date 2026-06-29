"use server"

import { createClient } from "@/lib/supabase/server"
import type { GlobalPlayer, BLStriker, LetterGrade } from "@/lib/types"

// ── Supabase join row shapes ──────────────────────────────────────────────────

type GlobalStatsRow = {
  attacking_threat:    number
  chance_creation:     number
  ball_progression:    number
  defensive_actions:   number
  possession_security: number
  physical_impact:     number
}

type ClusterGlobalRow = {
  cluster_id:      number
  archetype_label: string
  umap_x:          number
  umap_y:          number
}

type BLStatsRow = {
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

type RawStatsRow = {
  minutes: number
  goals:   number
  assists: number
}

type ClusterBLRow = {
  cluster_id:      number
  archetype_label: string
}

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
      player_stats_raw (
        minutes,
        goals,
        assists
      ),
      player_stats_global (
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
      // Unpack Supabase relationship arrays safely
      const rawArray = p.player_stats_raw as unknown as RawStatsRow[] | RawStatsRow | null
      const raw = Array.isArray(rawArray) ? rawArray[0] : rawArray

      const statsArray = p.player_stats_global as unknown as GlobalStatsRow[] | GlobalStatsRow | null
      const stats = Array.isArray(statsArray) ? statsArray[0] : statsArray

      const clusterArray = p.cluster_results_global as unknown as ClusterGlobalRow[] | ClusterGlobalRow | null
      const cluster = Array.isArray(clusterArray) ? clusterArray[0] : clusterArray

      if (!stats || !cluster) return null;

      return {
        id:          p.id,
        name:        p.name,
        team:        p.team,
        nationality: p.team,
        position:    p.position as GlobalPlayer["position"],
        goals:       raw?.goals   ?? 0,
        assists:     raw?.assists ?? 0,
        minutes:     raw?.minutes ?? 0,
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
      } as GlobalPlayer
    })
    .filter(Boolean) as GlobalPlayer[]
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

  return (
    (data ?? [])
      .filter((p) => p.player_stats_bluelock && p.cluster_results_bluelock)
      .map((p) => {
        const blArray = p.player_stats_bluelock as BLStatsRow[] | BLStatsRow | null
        const bl = Array.isArray(blArray) ? blArray[0] : blArray

        const rawArray = p.player_stats_raw as RawStatsRow[] | RawStatsRow | null
        const raw = Array.isArray(rawArray) ? rawArray[0] : rawArray

        const clusterArray = p.cluster_results_bluelock as ClusterBLRow[] | ClusterBLRow | null
        const cluster = Array.isArray(clusterArray) ? clusterArray[0] : clusterArray

        if (!bl || !cluster) return null

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
        }
      })
      // Type‑narrowing filter — removes nulls AND tells TS they are gone
      .filter((p): p is BLStriker => p !== null)
      .sort((a, b) => b.overall_score - a.overall_score)
  )
}



// ── Summary stats ─────────────────────────────────────────────────────────────

export type SummaryStats = {
  totalPlayers: number
  totalMatches: number
  topScorer: {
    name:    string
    team:    string
    goals:   number
    assists: number
  } | null
}

export async function getSummaryStats(): Promise<SummaryStats> {
  const supabase = await createClient()

  const { count: playerCount } = await supabase
    .from("players")
    .select("id", { count: "exact", head: true })
    .not("position", "eq", "GK")

  const { data: topScorerData } = await supabase
    .from("player_stats_raw")
    .select("player_id, goals, assists")
    .order("goals", { ascending: false })
    .limit(1)

  let topScorer = null
  if (topScorerData && topScorerData.length > 0) {
    const mainScorer = topScorerData[0]
    const { data: topPlayer } = await supabase
      .from("players")
      .select("name, team")
      .eq("id", mainScorer.player_id)
      .maybeSingle()

    if (topPlayer) {
      topScorer = {
        name:    topPlayer.name,
        team:    topPlayer.team,
        goals:   mainScorer.goals,
        assists: mainScorer.assists,
      }
    }
  }

  return {
    totalPlayers: playerCount ?? 0,
    totalMatches: 48,
    topScorer,
  }
}