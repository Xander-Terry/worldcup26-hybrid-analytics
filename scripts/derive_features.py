
"""
derive_features.py - WC26 Analytics v3.0
Reads:  data/processed/master_fifa_clean.csv
Writes: data/processed/master_fifa_features.csv

Key design decisions:
  - avg_speed excluded: FIFA avg_speed = match average (walking included)
    useless discriminator. sprints + speed_runs carry all physical signal.
  - FW prior = 45 min (lighter shrinkage — 3-game tournament, trust own rate)
  - Outfield prior = 90 min (more players, more variance to shrink)
  - BL overall weighted toward Shoot + Offense (Blue Lock philosophy)
  - Grades via percentile cutoffs (guaranteed realistic distribution)
"""

import pandas as pd
import numpy as np
from pathlib import Path

INPUT  = Path("data/processed/master_fifa_clean.csv")
OUTPUT = Path("data/processed/master_fifa_features.csv")

MINUTES_THRESHOLD    = 5
PRIOR_OUTFIELD       = 90   # shrinkage for global axis (more players, more noise)
PRIOR_FW             = 45   # lighter shrinkage for FW — 3 games is enough signal

# BL overall weights — Blue Lock philosophy: shooting is primary
BL_OVERALL_WEIGHTS = {
    "shoot":   0.35,
    "offense": 0.30,
    "dribble": 0.15,
    "pass":    0.10,
    "speed":   0.07,
    "defense": 0.03,
}

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
    """
    Percentile-based grade assignment.
    Guarantees realistic distribution regardless of score compression.

    S+  >= 98th  top ~2%   (2-3 players  — tournament's best striker)
    S   >= 90th  top ~10%  (~20 players  — elite)
    A   >= 75th  top ~25%  (~40 players  — world class)
    B   >= 55th  top ~45%  (~52 players  — strong)
    C   >= 35th  middle    (~52 players  — solid WC starter)
    D   >= 20th            (~39 players  — squad player)
    E   >= 10th            (~26 players  — fringe)
    F   >= 3rd             (~18 players  — minimal contribution)
    G   <  3rd             (~7 players   — appeared briefly)
    """
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

# ── 1. Load ───────────────────────────────────────────────────────────────────
print("\n[1/6] Loading master_fifa_clean.csv...")
df = pd.read_csv(INPUT)
print(f"  Loaded: {len(df)} players, {len(df.columns)} columns")

# ── 2. Unit conversions ───────────────────────────────────────────────────────
print("\n[2/6] Unit conversions...")

# Distance: metres → km (confirmed in metres from FIFA API)
df["total_distance_km"] = to_num(df["total_distance"]) / 1000
print(f"  total_distance_km: max={df['total_distance_km'].max():.2f} km")

# avg_speed is match average in km/h — NOT using it.
# It reflects walking/jogging average, not sprint speed.
# sprints and speed_runs carry all meaningful physical signal.
print(f"  avg_speed excluded from all calculations (match avg incl. walking)")
print(f"  Physical signal from: sprints_p90, speed_runs_p90, distance_p90")

df["minutes"] = to_num(df["total_competition_minutes_played"])

# Numeric conversions
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
    "offers_to_receive_in_between","offers_to_receive_inside","offers_to_receive_outside",
]
for col in counting_cols:
    if col in df.columns:
        df[col] = to_num(df[col])

rate_cols = [
    "passing_accuracy_rate","crossing_accuracy_rate",
    "linebreak_attempted_defensive_line_rate",
    "switches_of_play_rate","xg_goal_effiency_rate",
]
for col in rate_cols:
    if col in df.columns:
        df[col] = to_num(df[col])

# ── 3. Filter ─────────────────────────────────────────────────────────────────
print(f"\n[3/6] Filtering >= {MINUTES_THRESHOLD} minutes...")
df_all = df[df["minutes"] >= MINUTES_THRESHOLD].copy()
df_out = df_all[~df_all["position"].str.upper().str.contains("GK", na=False)].copy()
df_fw  = df_all[ df_all["position"].str.upper().str.contains("FW", na=False)].copy()

print(f"  All qualifying:    {len(df_all)}")
print(f"  Outfield (non-GK): {len(df_out)}")
print(f"  Forwards (FW):     {len(df_fw)}")

# ── 4. Bayesian per-90s ───────────────────────────────────────────────────────
print(f"\n[4/6] Bayesian per-90 rates...")
print(f"  Outfield prior: {PRIOR_OUTFIELD} min (global axis — more variance)")
print(f"  FW prior:       {PRIOR_FW} min (BL system — trust individual rates more)")

# Note: avg_speed intentionally excluded from P90_COLS
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

    # DRIBBLE / MOVEMENT SIGNALS
    "receptions_pressure_p90":             "receptions_under_pressure",
    "receptions_in_behind_p90":            "receptions_in_behind",
    "receptions_between_mid_def_line_p90": "receptions_between_midfield_and_defensive_line",

    "offers_in_behind_p90":   "offers_to_receive_in_behind",
    "offers_in_between_p90":  "offers_to_receive_in_between",
    "offers_inside_p90":      "offers_to_receive_inside",
    "offers_outside_p90":     "offers_to_receive_outside",

    # PHYSICAL
    "sprints_p90":            "sprints",
    "speed_runs_p90":         "speed_runs",
    "distance_p90":           "total_distance_km",
}


def add_p90s(frame: pd.DataFrame, prior: float, label: str) -> pd.DataFrame:
    f    = frame.copy()
    mins = f["minutes"]
    for new_col, src in P90_COLS.items():
        if src in f.columns:
            f[new_col] = bayes_p90(f[src], mins, prior)
        else:
            f[new_col] = 0.0
    print(f"  [{label}] {len(P90_COLS)} per-90s computed  (prior={prior} min)")
    return f

df_out = add_p90s(df_out, PRIOR_OUTFIELD, "outfield")
df_fw  = add_p90s(df_fw,  PRIOR_FW,       "FW")

# ── 5. Global axis scores ─────────────────────────────────────────────────────
print("\n[5/6] Computing global 6-axis scores (outfield players)...")

def compute_global_axes(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()

    pct_input_cols = list(P90_COLS.keys()) + [
        "passing_accuracy_rate",
        "crossing_accuracy_rate",
    ]   


    for col in pct_input_cols:
        src = frame[col] if col in frame.columns else pd.Series(0.0, index=frame.index)
        frame[f"{col}_pct"] = pct_rank(to_num(src))

    def p(c): return f"{c}_pct"

    # Attacking Threat
    frame["attacking_threat"] = w_sum(frame, [
        (p("goals_p90"),              0.35),
        (p("xg_p90"),                 0.30),
        (p("attempt_on_target_p90"),  0.15),
        (p("attempt_inside_box_p90"), 0.10),
        (p("receptions_in_behind_p90"), 0.10),
        (p("fouls_drawn_p90"),0.05),
    ])


    # Chance Creation
    frame["chance_creation"] = w_sum(frame, [
        (p("assists_p90"),            0.35),
        (p("linebreaks_p90"),         0.25),
        (p("crosses_p90"),            0.15),
        (p("crossing_accuracy_rate"), 0.10),
        (p("corners_p90"),            0.05),
        (p("receptions_in_behind_p90"),0.10)
    ])


    # Ball Progression
    frame["ball_progression"] = w_sum(frame, [
        (p("passing_accuracy_rate"),  0.25),
        (p("passes_p90"),             0.20),
        (p("linebreaks_p90"),         0.20),
        (p("involvements_p90"),       0.20),
        (p("receptions_pressure_p90"),0.03),
        (p("receptions_between_mid_def_line_p90"),0.03),
        (p("offers_inside_p90"),0.03),
        (p("offers_outside_p90"),0.03),
        (p("offers_in_behind_p90"),0.03)
    ])

    # Defensive Actions
    frame["defensive_actions"] = w_sum(frame, [
        (p("forced_turnovers_p90"),  0.40),
        (p("pressures_p90"),         0.30),
        (p("direct_pressures_p90"),  0.20),
        (p("fouls_committed_p90"),   0.10),
    ])

    # Possession Security
    frame["possession_security"] = w_sum(frame, [
        (p("passing_accuracy_rate"),   0.45),
        (p("receptions_pressure_p90"), 0.35),
        (p("fouls_drawn_p90"),         0.25),
    ])

    # Physical Impact — avg_speed excluded, sprints carry the signal
    frame["physical_impact"] = w_sum(frame, [
        (p("distance_p90"),   0.40),
        (p("sprints_p90"),    0.35),
        (p("speed_runs_p90"), 0.25),
    ])

    print("  Axis score ranges:")
    for axis in ["attacking_threat","chance_creation","ball_progression",
                 "defensive_actions","possession_security","physical_impact"]:
        s = frame[axis]
        print(f"    {axis:<25} min={s.min():.1f}  max={s.max():.1f}  mean={s.mean():.1f}")

    return frame

df_out = compute_global_axes(df_out)

# ── 6. Blue Lock scores + grades + ego map ────────────────────────────────────
print("\n[6/6] Blue Lock scores, grades, ego map (FW only)...")

def compute_bluelock(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()

    # 1) Percentile-rank all relevant inputs within FW population
    bl_input_cols = list(P90_COLS.keys()) + [
        "passing_accuracy_rate", "crossing_accuracy_rate"
    ]
    for col in bl_input_cols:
        src = frame[col] if col in frame.columns else pd.Series(0.0, index=frame.index)
        frame[f"{col}_pct"] = pct_rank(to_num(src))

    def p(c): return f"{c}_pct"

    # 2) Category raw scores (0–100 scale via weighted percentile sums)

    # SHOOT — pure finishing quality (S+ should live here)
    frame["shoot_raw"] = w_sum(frame, [
        (p("goals_p90"),             0.50),
        (p("xg_p90"),                0.30),
        (p("attempt_on_target_p90"), 0.25),
        (p("attempt_inside_box_p90"), 0.05),
    ])

    # OFFENSE — overall attacking output and goal involvement
    frame["offense_raw"] = w_sum(frame, [
        (p("goals_p90"),            0.40),
        (p("xg_p90"),               0.30),
        (p("assists_p90"),          0.20),
        (p("attempt_at_goal_p90"),  0.10),
    ])

    # DRIBBLE — movement / off-ball runs (secondary, stylistic)
        # DRIBBLE — true on-ball dribbling proxies
    frame["dribble_onball_raw"] = w_sum(frame, [
        (p("receptions_pressure_p90"),             0.35),
        (p("receptions_between_mid_def_line_p90"), 0.30),
        (p("fouls_drawn_p90"),                     0.25),
        (p("involvements_p90"),                    0.10),
    ])

    # DRIBBLE — movement / pocket-finding
    frame["dribble_movement_raw"] = w_sum(frame, [
        (p("offers_in_between_p90"),   0.30),
        (p("offers_inside_p90"),       0.25),
        (p("offers_outside_p90"),      0.15),
        (p("receptions_in_behind_p90"),0.30),
    ])

    # Combined dribble axis
    frame["dribble_raw"] = (
        frame["dribble_onball_raw"] * 0.75 +
        frame["dribble_movement_raw"] * 0.25
    )



    # PASS — creative passing and chance creation
    frame["pass_raw"] = w_sum(frame, [
        (p("assists_p90"),            0.45),
        (p("crosses_p90"),            0.20),
        (p("corners_p90"),            0.10),
        (p("crossing_accuracy_rate"), 0.15),
        (p("passing_accuracy_rate"),  0.10),
    ])

    # SPEED — physical intensity (low-weight tiebreaker)
    frame["speed_raw"] = w_sum(frame, [
        (p("sprints_p90"),    0.45),
        (p("speed_runs_p90"), 0.35),
        (p("distance_p90"),   0.20),
    ])

    # DEFENSE — pressing as a striker (tiny bonus)
    frame["defense_raw"] = w_sum(frame, [
        (p("pressures_p90"),        0.40),
        (p("forced_turnovers_p90"), 0.35),
        (p("direct_pressures_p90"), 0.15),
        (p("fouls_committed_p90"),  0.10),
    ])

    # 3) Striker-first overall weighting (Blue Lock ego philosophy)
    STRIKER_WEIGHTS = {
        "shoot":   0.45,
        "offense": 0.35,
        "dribble": 0.05,
        "pass":    0.08,
        "speed":   0.04,
        "defense": 0.03,
    }
    print(f"\n  BL overall weights (striker-first): {STRIKER_WEIGHTS}")

    frame["overall_raw"] = (
        frame["shoot_raw"].fillna(0)   * STRIKER_WEIGHTS["shoot"]   +
        frame["offense_raw"].fillna(0) * STRIKER_WEIGHTS["offense"] +
        frame["dribble_raw"].fillna(0) * STRIKER_WEIGHTS["dribble"] +
        frame["pass_raw"].fillna(0)    * STRIKER_WEIGHTS["pass"]    +
        frame["speed_raw"].fillna(0)   * STRIKER_WEIGHTS["speed"]   +
        frame["defense_raw"].fillna(0) * STRIKER_WEIGHTS["defense"]
    )

    # Optional: enforce a minimum minutes threshold for BL ranking
    # Players below this get their overall_raw shrunk or set to NaN
    MIN_BL_MINUTES = 180
    mask_low_min = frame["minutes"] < MIN_BL_MINUTES
    frame.loc[mask_low_min, "overall_raw"] = frame.loc[mask_low_min, "overall_raw"] * 0.5

    # 4) Normalize overall to 0–100 across FW population
    frame["overall_score"] = mm_norm(frame["overall_raw"])

    # 5) Percentile-based grades (realistic distribution)
    frame["overall_grade"] = percentile_grade(frame["overall_score"])

    # 6) Scale individual categories to 0–100 for radar display + category grades
    for cat in ["shoot","offense","dribble","pass","speed","defense"]:
        frame[cat] = mm_norm(frame[f"{cat}_raw"])
        frame[f"grade_{cat}"] = percentile_grade(frame[cat])

    # 7) Diagnostics: top 20 + key players
    top = frame.nlargest(20, "overall_score")[
        ["player_name","team","overall_score","overall_grade",
         "shoot","offense","dribble","pass","speed","defense"]
    ]
    print("\n  Top 20 forwards by overall score:")
    print(top.to_string(index=False))

    print("\n  Overall grade distribution:")
    dist = frame["overall_grade"].value_counts().sort_index().to_dict()
    print(f"  {dist}")

    print("\n  Key players:")
    for name in ["Messi","Ronaldo","Haaland","Mbappe","Kane","Rahimi","Salah"]:
        match = frame[frame["player_name"].str.contains(name, case=False, na=False)]
        if len(match) > 0:
            r = match.iloc[0]
            print(f"  {r['player_name']:<22} {r['overall_grade']:<3} "
                  f"score={r['overall_score']:.1f}  "
                  f"shoot={r['shoot']:.1f} off={r['offense']:.1f} "
                  f"drib={r['dribble']:.1f} pass={r['pass']:.1f} "
                  f"spd={r['speed']:.1f} def={r['defense']:.1f}")

    return frame


def compute_ego_map(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()

    def p(c): return f"{c}_pct"

    # X: Holistic (World-Style) ←→ Self-Style (Individualistic)
    holistic = w_sum(frame, [
        (p("assists_p90"),          0.40),
        (p("corners_p90"),          0.25),
        (p("passing_accuracy_rate"),0.35),
    ])
    self_style = w_sum(frame, [
        (p("goals_p90"),            0.40),
        (p("attempt_at_goal_p90"),  0.35),
        (p("offers_in_behind_p90"), 0.25),
    ])
    total_x    = holistic + self_style
    frame["ego_x"] = (self_style / total_x.replace(0, np.nan) * 100).fillna(50)

    # Y: Restrictive ←→ Freedom
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

    print(f"\n  Ego Map ranges:")
    print(f"    ego_x: {frame['ego_x'].min():.1f}–{frame['ego_x'].max():.1f}")
    print(f"    ego_y: {frame['ego_y'].min():.1f}–{frame['ego_y'].max():.1f}")

    # Spot check key players on ego map
    print("\n  Ego positions (0=Holistic/Restrictive, 100=Self-Style/Freedom):")
    for name in ["Messi","Ronaldo","Haaland","Mbappe","Kane","Rahimi"]:
        match = frame[frame["player_name"].str.contains(name, case=False, na=False)]
        if len(match) > 0:
            r = match.iloc[0]
            x_label = "Self-Style" if r["ego_x"] > 60 else ("Holistic" if r["ego_x"] < 40 else "Balanced")
            y_label = "Free"       if r["ego_y"] > 60 else ("Restrictive" if r["ego_y"] < 40 else "Balanced")
            print(f"    {r['player_name']:<22} x={r['ego_x']:.1f} ({x_label})  y={r['ego_y']:.1f} ({y_label})")

    return frame

df_fw = compute_bluelock(df_fw)
df_fw = compute_ego_map(df_fw)

# ── Save ──────────────────────────────────────────────────────────────────────
print("\nBuilding final feature dataset...")

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

# Merge outfield axes
merge_axis = [c for c in axis_output_cols if c in df_out.columns]
df_features = df_features.merge(
    df_out[["player_id"] + merge_axis],
    on="player_id", how="left"
)

# Merge BL scores (FW only)
df_features = df_features.merge(
    df_fw[["player_id"] + bl_output_cols],
    on="player_id", how="left"
)

df_features.to_csv(OUTPUT, index=False)
print(f"\n  Saved: {OUTPUT}")
print(f"  Shape: {df_features.shape}")

print(f"""
    Feature engineering v3.0 complete!
   All qualifying players:  {len(df_all)}
   Outfield (axis scores):  {len(df_out)}
   Forwards (BL scores):    {len(df_fw)}

   avg_speed:     EXCLUDED (match average incl. walking — not useful)
   Outfield prior: {PRIOR_OUTFIELD} min
   FW prior:       {PRIOR_FW} min
   BL weights:     shoot={BL_OVERALL_WEIGHTS['shoot']} offense={BL_OVERALL_WEIGHTS['offense']} dribble={BL_OVERALL_WEIGHTS['dribble']} pass={BL_OVERALL_WEIGHTS['pass']} speed={BL_OVERALL_WEIGHTS['speed']} defense={BL_OVERALL_WEIGHTS['defense']}

Next: python ingest.py
""")
