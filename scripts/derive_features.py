import pandas as pd
import numpy as np
from pathlib import Path

def debug_player(frame, name, label):
    match = frame[frame["player_name"].str.contains(name, case=False, na=False)]
    if len(match) == 0:
        print(f"  [DEBUG] {label}: {name} not found")
        return
    r = match.iloc[0]
    print(f"\n[DEBUG] {label}: {r['player_name']}")
    print(f"  SHO_raw={r.get('shoot_raw',0):.1f} OFF_raw={r.get('offense_raw',0):.1f} "
          f"DRI_raw={r.get('dribble_raw',0):.1f} PAS_raw={r.get('pass_raw',0):.1f} "
          f"SPD_raw={r.get('speed_raw',0):.1f} DEF_raw={r.get('defense_raw',0):.1f}")
    print(f"  SHO={r.get('shoot',0):.1f} OFF={r.get('offense',0):.1f} "
          f"DRI={r.get('dribble',0):.1f} PAS={r.get('pass',0):.1f} "
          f"SPD={r.get('speed',0):.1f} DEF={r.get('defense',0):.1f}")
    print(f"  overall_raw={r.get('overall_raw',0):.1f}  overall_score={r.get('overall_score',0):.1f}  grade={r.get('overall_grade','?')}")


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

# Overall grade → minimum floor for any individual BL category
BL_GRADE_FLOORS = {
    "S+": 55, "S": 48, "A": 40, "B": 32,
    "C": 22, "D": 12, "E": 12, "F": 8, "G": 5,
}
BL_BOOST_CEILING = 8

# Global axis floor uses self-relative averaging (see apply_global_axis_floor)

GLOBAL_AXES = [
    "attacking_threat","chance_creation","ball_progression",
    "defensive_actions","possession_security","physical_impact",
]
BL_CATS = ["shoot","offense","dribble","pass","speed","defense"]

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

def apply_bl_grade_floor(frame: pd.DataFrame, cats: list[str]) -> pd.DataFrame:
    f = frame.copy()
    floor_report: dict[str, dict[str, int]] = {}
    for cat in cats:
        floor_report[cat] = {}
        for grade, floor in BL_GRADE_FLOORS.items():
            mask = (f["overall_grade"] == grade) & (f[cat] < floor)
            if not mask.any():
                continue
            floor_report[cat][grade] = int(mask.sum())
            original          = f.loc[mask, cat]
            bonus             = (original / floor) * BL_BOOST_CEILING
            f.loc[mask, cat]  = (floor + bonus).clip(upper=floor + BL_BOOST_CEILING)

    print("\n  BL grade floor report:")
    for cat in cats:
        hits = floor_report[cat]
        if hits:
            print(f"    {cat:<10} " + "  ".join(f"{g}:{n}" for g, n in hits.items()))
    return f

def apply_global_axis_floor(frame: pd.DataFrame, axes: list[str]) -> pd.DataFrame:
    f = frame.copy()

    axis_avg     = f[axes].mean(axis=1)
    deficit_rate = 0.65   # how much of the gap to own_avg gets closed
    buffer_rate  = 0.15   # gentle lift for scores near but below avg
    buffer_zone  = 8      # how far above own_avg counts as "near"
    floor_report: dict[str, int] = {}

    for axis in axes:
        scores = f[axis]

        below_avg_mask = scores < axis_avg
        near_avg_mask  = (scores >= axis_avg) & (scores < axis_avg + buffer_zone)

        # Zone 1: below own average — close most of the gap
        deficit = (axis_avg - scores).clip(lower=0)
        boost_below = deficit * deficit_rate

        # Zone 2: near average but still below buffer — small lift
        near_gap = (axis_avg + buffer_zone - scores).clip(lower=0)
        boost_near = near_gap * buffer_rate

        f.loc[below_avg_mask, axis] = scores[below_avg_mask] + boost_below[below_avg_mask]
        f.loc[near_avg_mask,  axis] = scores[near_avg_mask]  + boost_near[near_avg_mask]

        floor_report[axis] = int(below_avg_mask.sum())

    print("\n  Global self-relative floor report (players boosted toward own avg):")
    for axis, n in floor_report.items():
        print(f"    {axis:<22} {n} players")

    return f


# ── 1. Load ───────────────────────────────────────────────────────────────────
print("\n[1/7] Loading master_fifa_clean.csv...")
df = pd.read_csv(INPUT)
print(f"  Loaded: {len(df)} players, {len(df.columns)} columns")

# ── 2. Unit conversions ───────────────────────────────────────────────────────
print("\n[2/7] Unit conversions...")
df["total_distance_km"] = to_num(df["total_distance"]) / 1000
df["avg_speed_kmh"]     = to_num(df["avg_speed"])
df["minutes"]           = to_num(df["total_competition_minutes_played"])
print(f"  distance max: {df['total_distance_km'].max():.1f} km")

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
print(f"\n[3/7] Filtering >= {MINUTES_THRESHOLD} min...")
df_all = df[df["minutes"] >= MINUTES_THRESHOLD].copy()
df_out = df_all[~df_all["position"].str.upper().str.contains("GK", na=False)].copy()
df_fw  = df_all[ df_all["position"].str.upper().str.contains("FW", na=False)].copy()
print(f"  All:{len(df_all)}  Outfield:{len(df_out)}  FW:{len(df_fw)}")

# ── 4. Bayesian per-90s ───────────────────────────────────────────────────────
print(f"\n[4/7] Bayesian per-90s...")

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
    minutes_factor = np.minimum(1.0, np.sqrt(mins / 300))
    for new_col, src in P90_COLS.items():
        if src in f.columns:
            base_p90 = bayes_p90(f[src], mins, prior)
            f[new_col] = base_p90 * minutes_factor
        else:
            f[new_col] = 0.0

    print(f"  [{label}] {len(P90_COLS)} per-90s  prior={prior}min  (minutes discount applied)")
    return f

df_out = add_p90s(df_out, PRIOR_OUTFIELD, "outfield")
df_fw  = add_p90s(df_fw,  PRIOR_FW,       "FW")

# ── 5. Global axes + floor ────────────────────────────────────────────────────
print("\n[5/7] Global 6-axis scores...")

def compute_global_axes(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()
    for col in list(P90_COLS.keys()) + ["passing_accuracy_rate","crossing_accuracy_rate"]:
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

    print("  Axis ranges (pre-floor):")
    for ax in GLOBAL_AXES:
        s = frame[ax]
        print(f"    {ax:<25} {s.min():.1f}-{s.max():.1f}  mean={s.mean():.1f}")

    # ── Apply global axis floor ───────────────────────────────────────────────
    frame = apply_global_axis_floor(frame, GLOBAL_AXES)

    # Re-normalize after floor
    for ax in GLOBAL_AXES:
        frame[ax] = mm_norm(frame[ax])

    print("\n  Axis ranges (post-floor):")
    for ax in GLOBAL_AXES:
        s = frame[ax]
        print(f"    {ax:<25} {s.min():.1f}-{s.max():.1f}  mean={s.mean():.1f}")

    # Spot check key players
    print("\n  Key players (Global axes after floor):")
    for name in ["Messi","Ronaldo","Haaland","Mbappe","Kane","Rahimi"]:
        match = frame[frame["player_name"].str.contains(name, case=False, na=False)]
        if len(match) > 0:
            r = match.iloc[0]
            print(
                f"  {r['player_name']:<22} "
                f"AT={r['attacking_threat']:.0f} CC={r['chance_creation']:.0f} "
                f"BP={r['ball_progression']:.0f} DA={r['defensive_actions']:.0f} "
                f"PS={r['possession_security']:.0f} PI={r['physical_impact']:.0f}"
            )

    return frame

df_out = compute_global_axes(df_out)

# ── 6. Blue Lock + floor + grades + ego ───────────────────────────────────────
print("\n[6/7] Blue Lock scores, floor, grades, ego map (FW)...")

def compute_bluelock(f: pd.DataFrame) -> pd.DataFrame:
    frame = f.copy()

    for col in list(P90_COLS.keys()) + ["passing_accuracy_rate","crossing_accuracy_rate"]:
        src = frame[col] if col in frame.columns else pd.Series(0.0, index=frame.index)
        frame[f"{col}_pct"] = pct_rank(to_num(src))

    def p(c): return f"{c}_pct"

    frame["shoot_raw"] = w_sum(frame, [
        (p("goals_p90"),              0.50),
        (p("xg_p90"),                 0.30),
        (p("attempt_on_target_p90"),  0.15),
        (p("attempt_inside_box_p90"), 0.05),
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

    debug_player(frame, "Messi",   "RAW (before normalization)")
    debug_player(frame, "Haaland", "RAW (before normalization)")
    debug_player(frame, "Rahimi",  "RAW (before normalization)")

    for cat in BL_CATS:
        frame[cat] = mm_norm(frame[f"{cat}_raw"])

    frame["overall_raw"]   = sum(frame[cat] * w for cat, w in BL_OVERALL_WEIGHTS.items())
    frame["overall_score"] = mm_norm(frame["overall_raw"])
    frame["overall_grade"] = percentile_grade(frame["overall_score"])


    debug_player(frame, "Messi",   "NORMALIZED (before BL floor)")
    debug_player(frame, "Haaland", "NORMALIZED (before BL floor)")
    debug_player(frame, "Rahimi",  "NORMALIZED (before BL floor)")


    frame = apply_bl_grade_floor(frame, BL_CATS)

    debug_player(frame, "Messi",   "AFTER BL FLOOR (pre-renorm)")
    debug_player(frame, "Haaland", "AFTER BL FLOOR (pre-renorm)")
    debug_player(frame, "Rahimi",  "AFTER BL FLOOR (pre-renorm)")

    for cat in BL_CATS:
        frame[cat] = mm_norm(frame[cat])

    debug_player(frame, "Messi",   "POST-FLOOR NORMALIZED")
    debug_player(frame, "Haaland", "POST-FLOOR NORMALIZED")
    debug_player(frame, "Rahimi",  "POST-FLOOR NORMALIZED")


    frame["overall_raw"]   = sum(frame[cat] * w for cat, w in BL_OVERALL_WEIGHTS.items())
    frame["overall_score"] = mm_norm(frame["overall_raw"])
    frame["overall_grade"] = percentile_grade(frame["overall_score"])

    for cat in BL_CATS:
        frame[f"grade_{cat}"] = percentile_grade(frame[cat])

    debug_player(frame, "Messi",   "FINAL BL SCORE")
    debug_player(frame, "Haaland", "FINAL BL SCORE")
    debug_player(frame, "Rahimi",  "FINAL BL SCORE")


    print("\n  Key players (BL after floor):")
    for name in ["Messi","Ronaldo","Haaland","Mbappe","Kane","Rahimi"]:
        match = frame[frame["player_name"].str.contains(name, case=False, na=False)]
        if len(match) > 0:
            r = match.iloc[0]
            print(
                f"  {r['player_name']:<22} {r['overall_grade']:<4}"
                f" SHO={r['shoot']:.0f} OFF={r['offense']:.0f}"
                f" DRI={r['dribble']:.0f} PAS={r['pass']:.0f}"
                f" SPD={r['speed']:.0f} DEF={r['defense']:.0f}"
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

# ── 7. Save ────────────────────────────────────────────────────────────────────
print("\n[7/7] Saving...")

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
] + GLOBAL_AXES

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
v6.0 complete
  Outfield: {len(df_out)}  FW: {len(df_fw)}
  Global axis floor: percentile-tiered (95th=50, 85th=42, 70th=34, 50th=25, 25th=15, else=8)
  BL grade floor: S+=55, S=48, A=40, B=32, C=22, D/E=12, F=8, G=5
""")