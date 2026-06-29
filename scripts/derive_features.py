"""
derive_features.py - WC26 Analytics v5.0

Floor algorithm:
  Each player's overall grade maps to a minimum floor for any category.
  S+ players cannot have a category below 55, S below 48, etc.
  Within the floor, original score adds a proportional bonus (max +8pts)
  so players with something in a category get slightly more than zero.
"""

import pandas as pd
import numpy as np
from pathlib import Path

INPUT  = Path("data/processed/master_fifa_clean.csv")
OUTPUT = Path("data/processed/master_fifa_features.csv")

MINUTES_THRESHOLD = 5
PRIOR_OUTFIELD    = 90
PRIOR_FW          = 45

BL_OVERALL_WEIGHTS = {
    "shoot":   0.45,
    "offense": 0.35,
    "dribble": 0.05,
    "pass":    0.08,
    "speed":   0.04,
    "defense": 0.03,
}

# Overall grade → minimum floor for any individual category
# Prevents elite players from having implausibly low category scores
GRADE_FLOORS = {
    "S+": 55,
    "S":  48,
    "A":  40,
    "B":  32,
    "C":  22,
    "D":  12,
    "E":  12,
    "F":   8,
    "G":   5,
}
BOOST_CEILING = 8  # max bonus points from original raw score

# ── Helpers ───────────────────────────────────────────────────────────────────
def to_num(s):
    return pd.to_numeric(s, errors="coerce").fillna(0)

def pct_rank(s: pd.Series) -> pd.Series:
    return s.rank(pct=True, na_option="bottom") * 100

def mm_norm(s: pd.Series) -> pd.Series:
    mn, mx = s.min(), s.max()
    return pd.Series(50.0, index=s.index) if mx == mn else (s - mn) / (mx - mn) * 100

def bayes_p90(count: pd.Series, minutes: pd.Series, prior_min: float) -> pd.Series:
    mins      = minutes.replace(0, np.nan)
    total_min = minutes.sum()
    total_cnt = count.sum()
    prior_p90 = (total_cnt / total_min * 90) if total_min > 0 else 0.0
    prior_cnt = (prior_p90 / 90) * prior_min
    return ((count + prior_cnt) / (mins + prior_min) * 90).fillna(0).clip(0)

def w_sum(df: pd.DataFrame, spec: list) -> pd.Series:
    result = pd.Series(0.0, index=df.index)
    total  = sum(w for _, w in spec)
    for col, w in spec:
        if col in df.columns:
            result += df[col].fillna(0) * (w / total)
        else:
            print(f"  WARN: '{col}' not found")
    return result

def percentile_grade(score: pd.Series) -> pd.Series:
    ranks  = score.rank(pct=True, na_option="bottom") * 100
    grades = pd.Series("G", index=score.index)
    grades[ranks >= 3]  = "F"
    grades[ranks >= 10] = "E"
    grades[ranks >= 20] = "D"
    grades[ranks >= 35] = "C"
    grades[ranks >= 55] = "B"
    grades[ranks >= 75] = "A"
    grades[ranks >= 90] = "S"
    grades[ranks >= 98] = "S+"
    return grades

def apply_grade_floor(frame: pd.DataFrame, cats: list[str]) -> pd.DataFrame:
    """
    For each player, look up their overall grade to get their floor value.
    Any category below that floor is lifted to:
        floor + (original / floor) * BOOST_CEILING

    This means:
      - original = 0    → exactly at floor (no bonus, likely a data gap)
      - original = floor/2 → floor + BOOST_CEILING/2
      - original = floor   → floor + BOOST_CEILING (would only apply if just under)

    Net effect:
      S/S+ players with a 0 land at 48-55
      S/S+ players with an 11 land at ~50
      A players with a 0 land at 40
      Everyone's category scores stay proportional to their raw input
      but implausible zeros from data gaps are corrected
    """
    f = frame.copy()

    # Log which categories got floored for which grades
    floor_report: dict[str, dict[str, int]] = {}

    for cat in cats:
        floor_report[cat] = {}
        for grade, floor in GRADE_FLOORS.items():
            mask = (f["overall_grade"] == grade) & (f[cat] < floor)
            if not mask.any():
                continue
            count = mask.sum()
            floor_report[cat][grade] = count

            original              = f.loc[mask, cat]
            bonus                 = (original / floor) * BOOST_CEILING
            f.loc[mask, cat]      = (floor + bonus).clip(upper=floor + BOOST_CEILING)

    print("\n  Grade floor report (players lifted per category):")
    for cat in cats:
        hits = floor_report[cat]
        if hits:
            detail = "  ".join(f"{g}:{n}" for g, n in hits.items())
            print(f"    {cat:<10} {detail}")

    return f

# ── 1. Load ───────────────────────────────────────────────────────────────────
print("\n[1/6] Loading master_fifa_clean.csv...")
df = pd.read_csv(INPUT)
print(f"  Loaded: {len(df)} players, {len(df.columns)} columns")

# ── 2. Unit conversions ───────────────────────────────────────────────────────
print("\n[2/6] Unit conversions...")
df["total_distance_km"] = to_num(df["total_distance"]) / 1000
df["avg_speed_kmh"]     = to_num(df["avg_speed"])
df["minutes"]           = to_num(df["total_competition_minutes_played"])
print(f"  distance max: {df['total_distance_km'].max():.1f} km")
print(f"  avg_speed excluded (match avg incl. walking)")

counting_cols = [
    "goals","assists","xg","attempt_at_goal","attempt_at_goal_on_target",
    "attempt_at_goal_inside_the_penalty_area",
    "attempt_at_goal_outside_the_penalty_area",
    "headed_attempt_at_goal","corners","own_goals",
    "forced_turnovers","defensive_pressures_applied",
    "direct_defensive_pressures_applied",
    "fouls_against","fouls_for","yellow_cards","red_cards",
    "passes","crosses","linebreaks_attempted_defensive_line",
    "attempted_switches_of_play","offers_to_receive_in_behind",
    "offers_to_receive_total","receptions_in_behind",
    "receptions_under_pressure","number_of_involvements",
    "sprints","speed_runs","receptions_between_midfield_and_defensive_line",
    "offers_to_receive_in_between","offers_to_receive_inside",
    "offers_to_receive_outside",
]
for col in counting_cols:
    if col in df.columns:
        df[col] = to_num(df[col])

for col in ["passing_accuracy_rate","crossing_accuracy_rate",
            "linebreak_attempted_defensive_line_rate",
            "switches_of_play_rate","xg_goal_effiency_rate"]:
    if col in df.columns:
        df[col] = to_num(df[col])

# ── 3. Filter ─────────────────────────────────────────────────────────────────
print(f"\n[3/6] Filtering >= {MINUTES_THRESHOLD} min...")
df_all = df[df["minutes"] >= MINUTES_THRESHOLD].copy()
df_out = df_all[~df_all["position"].str.upper().str.contains("GK", na=False)].copy()
df_fw  = df_all[ df_all["position"].str.upper().str.contains("FW", na=False)].copy()
print(f"  All:{len(df_all)}  Outfield:{len(df_out)}  FW:{len(df_fw)}")

# ── 4. Bayesian per-90s ───────────────────────────────────────────────────────
print(f"\n[4/6] Bayesian per-90s...")

P90_COLS = {
    "goals_p90":               "goals",
    "assists_p90":             "assists",
    "xg_p90":                  "xg",
    "attempt_at_goal_p90":     "attempt_at_goal",
    "attempt_on_target_p90":   "attempt_at_goal_on_target",
    "attempt_inside_box_p90":  "attempt_at_goal_inside_the_penalty_area",
    "corners_p90":             "corners",
    "crosses_p90":             "crosses",
    "passes_p90":              "passes",
    "linebreaks_p90":          "linebreaks_attempted_defensive_line",
    "switches_p90":            "attempted_switches_of_play",
    "involvements_p90":        "number_of_involvements",
    "forced_turnovers_p90":    "forced_turnovers",
    "pressures_p90":           "defensive_pressures_applied",
    "direct_pressures_p90":    "direct_defensive_pressures_applied",
    "fouls_drawn_p90":         "fouls_against",
    "fouls_committed_p90":     "fouls_for",
    "receptions_pressure_p90": "receptions_under_pressure",
    "receptions_in_behind_p90":"receptions_in_behind",
    "receptions_between_mid_def_line_p90": "receptions_between_midfield_and_defensive_line",
    "offers_in_behind_p90":    "offers_to_receive_in_behind",
    "offers_in_between_p90":   "offers_to_receive_in_between",
    "offers_inside_p90":       "offers_to_receive_inside",
    "offers_outside_p90":      "offers_to_receive_outside",
    "sprints_p90":             "sprints",
    "speed_runs_p90":          "speed_runs",
    "distance_p90":            "total_distance_km",
}

def add_p90s(frame: pd.DataFrame, prior: float, label: str) -> pd.DataFrame:
    f    = frame.copy()
    mins = f["minutes"]
    for new_col, src in P90_COLS.items():
        f[new_col] = bayes_p90(f[src], mins, prior) if src in f.columns else 0.0
    print(f"  [{label}] {len(P90_COLS)} per-90s  prior={prior}min")
    return f

df_out = add_p90s(df_out, PRIOR_OUTFIELD, "outfield")
df_fw  = add_p90s(df_fw,  PRIOR_FW,       "FW")

# ── 5. Global axes ────────────────────────────────────────────────────────────
print("\n[5/6] Global 6-axis scores...")

def compute_global_axes(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()
    for col in list(P90_COLS.keys()) + ["passing_accuracy_rate","crossing_accuracy_rate","goals"]:
        src = frame[col] if col in frame.columns else pd.Series(0.0, index=frame.index)
        frame[f"{col}_pct"] = pct_rank(to_num(src))

    def p(c): return f"{c}_pct"

    frame["attacking_threat"] = w_sum(frame, [
        (p("goals_p90"),               0.35),
        (p("xg_p90"),                  0.30),
        (p("attempt_on_target_p90"),   0.15),
        (p("attempt_inside_box_p90"),  0.10),
        (p("receptions_in_behind_p90"),0.10),
    ])
    frame["chance_creation"] = w_sum(frame, [
        (p("assists_p90"),              0.35),
        (p("linebreaks_p90"),           0.25),
        (p("crosses_p90"),              0.15),
        (p("crossing_accuracy_rate"),   0.10),
        (p("corners_p90"),              0.05),
        (p("receptions_in_behind_p90"), 0.10),
    ])
    frame["ball_progression"] = w_sum(frame, [
        (p("passing_accuracy_rate"),               0.25),
        (p("passes_p90"),                          0.20),
        (p("linebreaks_p90"),                      0.20),
        (p("involvements_p90"),                    0.20),
        (p("receptions_pressure_p90"),             0.03),
        (p("receptions_between_mid_def_line_p90"), 0.03),
        (p("offers_inside_p90"),                   0.03),
        (p("offers_outside_p90"),                  0.03),
        (p("offers_in_behind_p90"),                0.03),
    ])
    frame["defensive_actions"] = w_sum(frame, [
        (p("forced_turnovers_p90"),  0.40),
        (p("pressures_p90"),         0.30),
        (p("direct_pressures_p90"),  0.20),
        (p("fouls_committed_p90"),   0.10),
    ])
    frame["possession_security"] = w_sum(frame, [
        (p("passing_accuracy_rate"),   0.45),
        (p("receptions_pressure_p90"), 0.35),
        (p("fouls_drawn_p90"),         0.25),
    ])
    frame["physical_impact"] = w_sum(frame, [
        (p("distance_p90"),   0.40),
        (p("sprints_p90"),    0.35),
        (p("speed_runs_p90"), 0.25),
    ])
    return frame

df_out = compute_global_axes(df_out)

# ── 6. Blue Lock + floor + grades + ego ───────────────────────────────────────
print("\n[6/6] Blue Lock scores, floor, grades, ego map (FW)...")

BL_CATS = ["shoot","offense","dribble","pass","speed","defense"]

def compute_bluelock(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()

    for col in list(P90_COLS.keys()) + ["passing_accuracy_rate","crossing_accuracy_rate"]:
        src = frame[col] if col in frame.columns else pd.Series(0.0, index=frame.index)
        frame[f"{col}_pct"] = pct_rank(to_num(src))

    def p(c): return f"{c}_pct"

    frame["shoot_raw"] = w_sum(frame, [
        (p("goals_p90"),              0.40),
        (p("xg_p90"),                 0.30),
        (p("attempt_on_target_p90"),  0.15),
        (p("attempt_inside_box_p90"), 0.05),
        (p("goals"),0.10),
        
    ])
    frame["offense_raw"] = w_sum(frame, [
        (p("goals_p90"),           0.40),
        (p("xg_p90"),              0.30),
        (p("assists_p90"),         0.20),
        (p("attempt_at_goal_p90"), 0.10),
    ])
    frame["dribble_raw"] = (
        w_sum(frame, [
            (p("receptions_pressure_p90"),             0.35),
            (p("receptions_between_mid_def_line_p90"), 0.30),
            (p("fouls_drawn_p90"),                     0.25),
            (p("involvements_p90"),                    0.10),
        ]) * 0.75 +
        w_sum(frame, [
            (p("offers_in_between_p90"),    0.30),
            (p("offers_inside_p90"),        0.25),
            (p("offers_outside_p90"),       0.15),
            (p("receptions_in_behind_p90"), 0.30),
        ]) * 0.25
    )
    frame["pass_raw"] = w_sum(frame, [
        (p("assists_p90"),            0.45),
        (p("crosses_p90"),            0.20),
        (p("corners_p90"),            0.10),
        (p("crossing_accuracy_rate"), 0.15),
        (p("passing_accuracy_rate"),  0.10),
    ])
    frame["speed_raw"] = w_sum(frame, [
        (p("sprints_p90"),    0.45),
        (p("speed_runs_p90"), 0.35),
        (p("distance_p90"),   0.20),
    ])
    frame["defense_raw"] = w_sum(frame, [
        (p("pressures_p90"),        0.40),
        (p("forced_turnovers_p90"), 0.35),
        (p("direct_pressures_p90"), 0.15),
        (p("fouls_committed_p90"),  0.10),
    ])

    # Normalize to 0-100 within FW population
    for cat in BL_CATS:
        frame[cat] = mm_norm(frame[f"{cat}_raw"])

    # Preliminary overall + grade (needed by floor algorithm)
    frame["overall_raw"] = sum(
        frame[cat] * w for cat, w in BL_OVERALL_WEIGHTS.items()
    )
    frame["overall_score"] = mm_norm(frame["overall_raw"])
    frame["overall_grade"] = percentile_grade(frame["overall_score"])

    # ── Minutes-based suppression BEFORE floor and BEFORE normalization ───────────
    # Players with fewer minutes get their category scores shrunk proportionally.
    # This prevents inflated per-90 monsters from outranking consistent performers.

    def minute_suppress(minutes):
        """
        Returns a suppression factor based on minutes played.
        90+ min  → 1.00 (no suppression)
        60–89    → 0.70
        30–59    → 0.45
        1–29     → 0.25
        """
        if minutes >= 90:
            return 1.00
        if minutes >= 60:
            return 0.70
        if minutes >= 30:
            return 0.45
        return 0.25

    # Apply suppression to category scores BEFORE floor logic
    for idx in frame.index:
        factor = minute_suppress(frame.at[idx, "minutes"])
        for cat in BL_CATS:
            frame.at[idx, cat] *= factor

    # Recompute overall_raw after suppression
    frame["overall_raw"] = sum(
        frame[cat] * w for cat, w in BL_OVERALL_WEIGHTS.items()
    )
    frame["overall_score"] = mm_norm(frame["overall_raw"])
    frame["overall_grade"] = percentile_grade(frame["overall_score"])


    # ── Grade-based floor ─────────────────────────────────────────────────────
    # Must run BEFORE re-normalizing so the floor values are on the 0-100 scale
    frame = apply_grade_floor(frame, BL_CATS)

    # Re-normalize after floor so radar display stays 0-100
    for cat in BL_CATS:
        frame[cat] = mm_norm(frame[cat])

    # Recompute overall with floored categories
    frame["overall_raw"] = sum(
        frame[cat] * w for cat, w in BL_OVERALL_WEIGHTS.items()
    )
    frame["overall_score"] = mm_norm(frame["overall_raw"])
    frame["overall_grade"] = percentile_grade(frame["overall_score"])

    for cat in BL_CATS:
        frame[f"grade_{cat}"] = percentile_grade(frame[cat])

    # Spot check
    print("\n  Key players after floor:")
    print(f"  {'Name':<22} {'OVR':<4} {'SHO':>4} {'OFF':>4} {'DRI':>4} {'PAS':>4} {'SPD':>4} {'DEF':>4}")
    for name in ["Messi","Ronaldo","Haaland","Mbappe","Kane","Rahimi"]:
        match = frame[frame["player_name"].str.contains(name, case=False, na=False)]
        if len(match) > 0:
            r = match.iloc[0]
            print(
                f"  {r['player_name']:<22} {r['overall_grade']:<4}"
                f" {r['shoot']:>4.0f} {r['offense']:>4.0f}"
                f" {r['dribble']:>4.0f} {r['pass']:>4.0f}"
                f" {r['speed']:>4.0f} {r['defense']:>4.0f}"
            )

    return frame

def compute_ego_map(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()
    def p(c): return f"{c}_pct"

    holistic = w_sum(frame, [
        (p("assists_p90"),           0.40),
        (p("corners_p90"),           0.25),
        (p("passing_accuracy_rate"), 0.35),
    ])
    self_style = w_sum(frame, [
        (p("goals_p90"),            0.40),
        (p("attempt_at_goal_p90"), 0.35),
        (p("offers_in_behind_p90"), 0.25),
    ])
    total_x    = holistic + self_style
    frame["ego_x"] = (self_style / total_x.replace(0, np.nan) * 100).fillna(50)

    restrictive = w_sum(frame, [
        (p("passing_accuracy_rate"),   0.55),
        (p("receptions_pressure_p90"), 0.45),
    ])
    freedom = w_sum(frame, [
        (p("linebreaks_p90"),       0.35),
        (p("fouls_drawn_p90"),      0.35),
        (p("offers_in_behind_p90"), 0.30),
    ])
    total_y    = restrictive + freedom
    frame["ego_y"] = (freedom / total_y.replace(0, np.nan) * 100).fillna(50)
    return frame

df_fw = compute_bluelock(df_fw)
df_fw = compute_ego_map(df_fw)

# ── Save ──────────────────────────────────────────────────────────────────────
print("\nSaving...")

bl_output_cols = [
    "shoot","offense","dribble","pass","speed","defense",
    "grade_shoot","grade_offense","grade_dribble",
    "grade_pass","grade_speed","grade_defense",
    "overall_score","overall_grade","ego_x","ego_y",
]
axis_output_cols = [
    "goals_p90","assists_p90","xg_p90","attempt_at_goal_p90",
    "attempt_on_target_p90","attempt_inside_box_p90","corners_p90",
    "crosses_p90","passes_p90","linebreaks_p90","switches_p90",
    "involvements_p90","forced_turnovers_p90","pressures_p90",
    "direct_pressures_p90","fouls_drawn_p90","fouls_committed_p90",
    "receptions_pressure_p90","offers_in_behind_p90",
    "receptions_in_behind_p90","sprints_p90","speed_runs_p90",
    "distance_p90","total_distance_km",
    "attacking_threat","chance_creation","ball_progression",
    "defensive_actions","possession_security","physical_impact",
]

df_features = df_all.copy()
df_features["total_distance_km"] = to_num(df_features["total_distance"]) / 1000
df_features["minutes"]           = to_num(df_features["total_competition_minutes_played"])

merge_axis = [c for c in axis_output_cols if c in df_out.columns]
df_features = df_features.merge(
    df_out[["player_id"] + merge_axis], on="player_id", how="left"
)
df_features = df_features.merge(
    df_fw[["player_id"] + bl_output_cols], on="player_id", how="left"
)

df_features.to_csv(OUTPUT, index=False)
print(f"  Saved: {OUTPUT}  shape={df_features.shape}")
print(f"""
 v5.0 complete
   Outfield: {len(df_out)}  FW: {len(df_fw)}
   Floor: grade-based (S+=55, S=48, A=40, B=32, C=22, D/below=12)
   Boost: original/floor * {BOOST_CEILING} extra pts
""")