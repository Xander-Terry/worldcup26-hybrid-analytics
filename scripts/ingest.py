"""
ingest.py - WC26 Analytics v4.0
Reads:  data/processed/master_fifa_features.csv
        (output of derive_features.py)
Writes: Supabase tables
        players, player_stats_raw, player_stats_global,
        player_stats_bluelock, ingestion_log
"""

import os, sys
import pandas as pd
import numpy as np
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase env vars in .env.local")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

FEATURES_CSV = Path("data/processed/master_fifa_features.csv")

def sf(x, d=0.0):
    try:
        v = float(x)
        return d if v != v else v
    except:
        return d

def si(x, d=0):
    try: return int(float(x))
    except: return d

def sn(x):
    """Safe nullable float — returns None if zero or null."""
    try:
        v = float(x)
        return None if (v != v or v == 0) else v
    except:
        return None

def upsert_batch(table: str, records: list, conflict_col: str = "player_id"):
    for i in range(0, len(records), 100):
        chunk = records[i:i+100]
        supabase.table(table).upsert(chunk, on_conflict=conflict_col).execute()
        print(f"  {table}: {i+1}–{min(i+100,len(records))}")

# ── Load ──────────────────────────────────────────────────────────────────────
print("\n[1/6] Loading feature dataset...")
if not FEATURES_CSV.exists():
    print(f"ERROR: {FEATURES_CSV} not found. Run derive_features.py first.")
    sys.exit(1)

df = pd.read_csv(FEATURES_CSV)
print(f"  Players: {len(df)}")
print(f"  Columns: {len(df.columns)}")

df_out = df[~df["position"].str.upper().str.contains("GK", na=False)].copy()
df_fw  = df[ df["position"].str.upper().str.contains("FW", na=False)].copy()
print(f"  Outfield: {len(df_out)} | FW: {len(df_fw)}")

# ── Upsert players ────────────────────────────────────────────────────────────
print("\n[2/6] Upserting players table...")
player_records = []
for _, row in df.iterrows():
    player_records.append({
        "fifa_player_id": str(row["player_id"]),
        "fifa_team_id":   str(row.get("team_id","")) or None,
        "name":           str(row["player_name"]),
        "team":           str(row["team"]),
        "position":       str(row["position"]),
    })
upsert_batch("players", player_records, conflict_col="fifa_player_id")

# Fetch UUIDs
print("  Fetching player UUIDs...")
all_p  = supabase.table("players").select("id,fifa_player_id").execute().data
id_map = {p["fifa_player_id"]: p["id"] for p in all_p}
print(f"  UUID map: {len(id_map)} players")

# ── Upsert player_stats_raw ───────────────────────────────────────────────────
print("\n[3/6] Upserting player_stats_raw...")
raw_records = []
for _, row in df.iterrows():
    pid = id_map.get(str(row["player_id"]))
    if not pid: continue
    raw_records.append({
        "player_id":                     pid,
        "minutes":                       sf(row.get("minutes")),
        "goals":                         sf(row.get("goals")),
        "assists":                       sf(row.get("assists")),
        "xg":                            sf(row.get("xg")),
        "xg_goal_efficiency_rate":       sf(row.get("xg_goal_effiency_rate")),
        "attempt_at_goal":               sf(row.get("attempt_at_goal")),
        "attempt_at_goal_on_target":     sf(row.get("attempt_at_goal_on_target")),
        "attempt_at_goal_conversion_rate":sf(row.get("attempt_at_goal_conversion_rate")),
        "attempt_at_goal_inside_the_penalty_area": sf(row.get("attempt_at_goal_inside_the_penalty_area")),
        "attempt_at_goal_outside_the_penalty_area":sf(row.get("attempt_at_goal_outside_the_penalty_area")),
        "headed_attempt_at_goal":        sf(row.get("headed_attempt_at_goal")),
        "corners":                       sf(row.get("corners")),
        "offsides":                      sf(row.get("offsides")),
        "own_goals":                     sf(row.get("own_goals")),
        "forced_turnovers":              sf(row.get("forced_turnovers")),
        "defensive_pressures_applied":   sf(row.get("defensive_pressures_applied")),
        "direct_defensive_pressures_applied": sf(row.get("direct_defensive_pressures_applied")),
        "passes":                        sf(row.get("passes")),
        "passing_accuracy_rate":         sf(row.get("passing_accuracy_rate")),
        "crosses":                       sf(row.get("crosses")),
        "crossing_accuracy_rate":        sf(row.get("crossing_accuracy_rate")),
        "linebreaks_attempted_defensive_line": sf(row.get("linebreaks_attempted_defensive_line")),
        "linebreak_attempted_defensive_line_rate": sf(row.get("linebreak_attempted_defensive_line_rate")),
        "attempted_switches_of_play":    sf(row.get("attempted_switches_of_play")),
        "switches_of_play_rate":         sf(row.get("switches_of_play_rate")),
        "fouls_against":                 sf(row.get("fouls_against")),
        "fouls_for":                     sf(row.get("fouls_for")),
        "yellow_cards":                  sf(row.get("yellow_cards")),
        "red_cards":                     sf(row.get("red_cards")),
        "indirect_red_cards":            sf(row.get("indirect_red_cards")),
        "offers_to_receive_total":       sf(row.get("offers_to_receive_total")),
        "offers_to_receive_in_behind":   sf(row.get("offers_to_receive_in_behind")),
        "offers_to_receive_in_between":  sf(row.get("offers_to_receive_in_between")),
        "offers_to_receive_in_front":    sf(row.get("offers_to_receive_in_front")),
        "offers_to_receive_inside":      sf(row.get("offers_to_receive_inside")),
        "offers_to_receive_outside":     sf(row.get("offers_to_receive_outside")),
        "receptions_in_behind":          sf(row.get("receptions_in_behind")),
        "receptions_between_midfield_and_defensive_line": sf(row.get("receptions_between_midfield_and_defensive_line")),
        "receptions_under_pressure":     sf(row.get("receptions_under_pressure")),
        "number_of_involvements":        sf(row.get("number_of_involvements")),
        "total_distance_km":             sf(row.get("total_distance_km")),
        "avg_speed_kmh":                 sf(row.get("avg_speed_kmh")),
        "sprints":                       sf(row.get("sprints")),
        "speed_runs":                    sf(row.get("speed_runs")),
        "goalkeeper_saves":              sn(row.get("goalkeeper_saves")),
        "goalkeeper_actions_inside_box": sn(row.get("goalkeeper_defensive_actions_inside_penalty_area")),
        "goalkeeper_actions_outside_box":sn(row.get("goalkeeper_defensive_actions_outside_penalty_area")),
    })
upsert_batch("player_stats_raw", raw_records)

# ── Upsert player_stats_global ────────────────────────────────────────────────
print("\n[4/6] Upserting player_stats_global (outfield only)...")
global_records = []
for _, row in df_out.iterrows():
    pid = id_map.get(str(row["player_id"]))
    if not pid: continue
    global_records.append({
        "player_id":                pid,
        "goals_p90":                round(sf(row.get("goals_p90")),4),
        "assists_p90":              round(sf(row.get("assists_p90")),4),
        "xg_p90":                   round(sf(row.get("xg_p90")),4),
        "attempt_at_goal_p90":      round(sf(row.get("attempt_at_goal_p90")),4),
        "attempt_at_goal_on_target_p90": round(sf(row.get("attempt_on_target_p90")),4),
        "attempt_inside_box_p90":   round(sf(row.get("attempt_inside_box_p90")),4),
        "corners_p90":              round(sf(row.get("corners_p90")),4),
        "crosses_p90":              round(sf(row.get("crosses_p90")),4),
        "passes_p90":               round(sf(row.get("passes_p90")),4),
        "linebreaks_p90":           round(sf(row.get("linebreaks_p90")),4),
        "switches_p90":             round(sf(row.get("switches_p90")),4),
        "involvements_p90":         round(sf(row.get("involvements_p90")),4),
        "forced_turnovers_p90":     round(sf(row.get("forced_turnovers_p90")),4),
        "pressures_p90":            round(sf(row.get("pressures_p90")),4),
        "direct_pressures_p90":     round(sf(row.get("direct_pressures_p90")),4),
        "fouls_drawn_p90":          round(sf(row.get("fouls_drawn_p90")),4),
        "fouls_committed_p90":      round(sf(row.get("fouls_committed_p90")),4),
        "receptions_under_pressure_p90": round(sf(row.get("receptions_pressure_p90")),4),
        "offers_in_behind_p90":     round(sf(row.get("offers_in_behind_p90")),4),
        "receptions_in_behind_p90": round(sf(row.get("receptions_in_behind_p90")),4),
        "sprints_p90":              round(sf(row.get("sprints_p90")),4),
        "speed_runs_p90":           round(sf(row.get("speed_runs_p90")),4),
        "distance_p90":             round(sf(row.get("distance_p90")),4),
        "passing_accuracy_rate":    round(sf(row.get("passing_accuracy_rate")),4),
        "crossing_accuracy_rate":   round(sf(row.get("crossing_accuracy_rate")),4),
        "avg_speed_kmh":            round(sf(row.get("avg_speed_kmh")),4),
        "attacking_threat":         round(sf(row.get("attacking_threat")),2),
        "chance_creation":          round(sf(row.get("chance_creation")),2),
        "ball_progression":         round(sf(row.get("ball_progression")),2),
        "defensive_actions":        round(sf(row.get("defensive_actions")),2),
        "possession_security":      round(sf(row.get("possession_security")),2),
        "physical_impact":          round(sf(row.get("physical_impact")),2),
    })
upsert_batch("player_stats_global", global_records)

# ── Upsert player_stats_bluelock ──────────────────────────────────────────────
print("\n[5/6] Upserting player_stats_bluelock (FW only)...")
bl_records = []
for _, row in df_fw.iterrows():
    pid = id_map.get(str(row["player_id"]))
    if not pid: continue
    # Only insert if BL scores were computed (not NaN)
    if pd.isna(row.get("overall_score")): continue
    bl_records.append({
        "player_id":     pid,
        "shoot":         round(sf(row.get("shoot")),2),
        "offense":       round(sf(row.get("offense")),2),
        "dribble":       round(sf(row.get("dribble")),2),
        "pass":          round(sf(row.get("pass")),2),
        "speed":         round(sf(row.get("speed")),2),
        "defense":       round(sf(row.get("defense")),2),
        "grade_shoot":   str(row.get("grade_shoot","G")),
        "grade_offense": str(row.get("grade_offense","G")),
        "grade_dribble": str(row.get("grade_dribble","G")),
        "grade_pass":    str(row.get("grade_pass","G")),
        "grade_speed":   str(row.get("grade_speed","G")),
        "grade_defense": str(row.get("grade_defense","G")),
        "overall_score": round(sf(row.get("overall_score")),2),
        "overall_grade": str(row.get("overall_grade","G")),
        "ego_x":         round(sf(row.get("ego_x")),2),
        "ego_y":         round(sf(row.get("ego_y")),2),
    })
upsert_batch("player_stats_bluelock", bl_records)

# ── Log ───────────────────────────────────────────────────────────────────────
print("\n[6/6] Logging ingestion run...")
df_filtered = df[pd.to_numeric(df.get("minutes",0),errors="coerce").fillna(0) >= 5]
supabase.table("ingestion_log").insert({
    "source":          "fifa_gameday_api",
    "players_written": len(df_filtered),
    "status":          "success",
    "notes":           f"outfield={len(df_out)}, fw={len(df_fw)}, source=master_fifa_features.csv",
}).execute()

print(f"""
   Ingestion complete!
   Players written:          {len(df_filtered)}
   Outfield stats:           {len(df_out)}
   BL striker stats:         {len(df_fw)}

Next:
   python cluster_global.py
   python cluster_bluelock.py
""")
