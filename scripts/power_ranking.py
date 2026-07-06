"""
power_ranking.py - WC26 Analytics
Rank-tier scaling module.

Applies small multiplicative boosts/shrinks to raw axis scores
BEFORE normalization. This keeps all final scores in 0-100 range
while ensuring elite players rank higher and low players rank lower.

Import this and call apply_rank_tier_scaling() in derive_features.py
after computing raw axis scores but BEFORE calling mm_norm().
"""

import pandas as pd
import numpy as np

# Tier multipliers — small, intentional, non-inflationary
# Applied to raw weighted sums before normalization
GLOBAL_RANK_TIERS = [
    (10,  0.08),   # top 10  → +8%
    (30,  0.04),   # top 30  → +4%
    (50,  0.01),   # top 50  → +1%
    (100, 0.00),   # top 100 → neutral
]
GLOBAL_SHRINK = -0.03   # rank 100+ → -3%

BL_RANK_TIERS = [
    (5,   0.08),   # top 5   → +8%
    (15,  0.05),   # top 15  → +5%
    (30,  0.03),   # top 30  → +3%
    (60,  0.01),   # top 60  → +1%
    (100, 0.00),   # top 100 → neutral
]
BL_SHRINK = -0.03


def compute_global_rank(frame: pd.DataFrame, axis_cols: list[str]) -> pd.Series:
    """
    Global rank = rank by sum of all axis scores.
    Rank 1 = best player (highest combined score).
    Uses preliminary raw scores — called before normalization.
    """
    combined = frame[axis_cols].sum(axis=1)
    return combined.rank(ascending=False, method="min", na_option="bottom").astype(int)


def get_tier_multiplier(rank: int, tiers: list, shrink: float) -> float:
    """Return the scaling multiplier for a given rank."""
    for threshold, multiplier in tiers:
        if rank <= threshold:
            return multiplier
    return shrink


def apply_global_tier_scaling(
    frame: pd.DataFrame,
    axis_cols: list[str],
    rank_series: pd.Series,
) -> pd.DataFrame:
    """
    Scale raw global axis scores by rank tier.
    Must be called BEFORE mm_norm().
    """
    f = frame.copy()
    for idx in f.index:
        rank       = int(rank_series.loc[idx])
        multiplier = get_tier_multiplier(rank, GLOBAL_RANK_TIERS, GLOBAL_SHRINK)
        if multiplier != 0:
            for col in axis_cols:
                f.at[idx, col] = f.at[idx, col] * (1 + multiplier)
    return f


def apply_bl_tier_scaling(
    frame: pd.DataFrame,
    cat_cols: list[str],
    rank_series: pd.Series,
) -> pd.DataFrame:
    """
    Scale raw BL category scores by BL rank tier.
    Must be called BEFORE mm_norm().
    rank_series should be the striker_global_rank (1 = best).
    """
    f = frame.copy()
    for idx in f.index:
        rank       = int(rank_series.loc[idx])
        multiplier = get_tier_multiplier(rank, BL_RANK_TIERS, BL_SHRINK)
        if multiplier != 0:
            for col in cat_cols:
                f.at[idx, col] = f.at[idx, col] * (1 + multiplier)
    return f


def compute_striker_global_score(frame: pd.DataFrame, cat_cols: list[str]) -> pd.Series:
    """
    Striker global score = weighted sum of BL categories.
    Used as a cross-validation metric alongside the BL rank.
    """
    weights = {
        "shoot":   0.30,
        "offense": 0.25,
        "dribble": 0.15,
        "pass":    0.12,
        "speed":   0.10,
        "defense": 0.08,
    }
    score = pd.Series(0.0, index=frame.index)
    for cat, w in weights.items():
        if cat in frame.columns:
            score += frame[cat] * w
    return score


def compute_striker_global_rank(score_series: pd.Series) -> pd.Series:
    """Rank 1 = highest striker_global_score."""
    return score_series.rank(ascending=False, method="min", na_option="bottom").astype(int)