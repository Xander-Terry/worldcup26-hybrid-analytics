import pandas as pd
from pathlib import Path
import re

INPUT_FILE = Path("data/processed/master_fifa_stats.csv")
OUTPUT_FILE = Path("data/processed/master_fifa_clean.csv")


# -----------------------------
# Helpers
# -----------------------------

def clean_xg_efficiency(val):
    """
    Converts values like:
    '1.24x', '0x', '3.1x' → float
    """
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        return float(val)

    val = str(val).replace("x", "").strip()

    try:
        return float(val)
    except:
        return None


def resolve_duplicate_columns(df):
    """
    Merge FIFA duplicate columns like assists_x / assists_y
    Keeps first non-null value.
    """

    pairs = [
        ("assists_x", "assists_y"),
        ("goals_x", "goals_y"),
    ]

    for a, b in pairs:
        if a in df.columns and b in df.columns:
            df[a.replace("_x", "")] = df[a].combine_first(df[b])
            df.drop(columns=[a, b], inplace=True)

    return df

def coerce_numeric_columns(df, meta_cols):
    """
    Convert all stat columns to numeric safely.
    Non-convertible values become NaN.
    """

    for col in df.columns:
        if col in meta_cols:
            continue

        df[col] = pd.to_numeric(df[col], errors="coerce")

    return df

# -----------------------------
# Main cleaning
# -----------------------------

def main():

    print("Loading master dataset...")
    df = pd.read_csv(INPUT_FILE)

    meta_cols = [
        "player_id",
        "team_id",
        "player_name",
        "team",
        "position"
    ]

    print("Initial shape:", df.shape)

    # -----------------------------
    # Step 1: Fix duplicate columns
    # -----------------------------
    df = resolve_duplicate_columns(df)

    # -----------------------------
    # Step 2: Clean xG efficiency
    # -----------------------------
    if "xg_goal_effiency_rate" in df.columns:
        df["xg_goal_effiency_rate"] = df["xg_goal_effiency_rate"].apply(
            clean_xg_efficiency
        )

    # -----------------------------
    # Step 3: Convert numeric stats
    # -----------------------------
    df = coerce_numeric_columns(df, meta_cols)

    # -----------------------------
    # Step 4: Remove duplicate players
    # -----------------------------
    if "player_id" in df.columns:
        before = len(df)
        df = df.drop_duplicates(subset=["player_id"])
        after = len(df)

        print(f"Removed duplicates: {before - after}")

    # -----------------------------
    # Step 5: Sort for readability
    # -----------------------------
    df = df.sort_values(by=["team", "position", "player_name"])

    # -----------------------------
    # Step 6: Reorder columns
    # -----------------------------
    ordered_cols = meta_cols + [
        c for c in df.columns if c not in meta_cols
    ]

    df = df[ordered_cols]

    # -----------------------------
    # Step 7: Final report
    # -----------------------------
    print("\nCLEANING REPORT")
    print("Shape:", df.shape)
    print("Players:", df["player_id"].nunique() if "player_id" in df.columns else "N/A")
    print("Columns:", len(df.columns))

    # -----------------------------
    # Step 8: Save
    # -----------------------------
    df.to_csv(OUTPUT_FILE, index=False)

    print("\nSaved ->", OUTPUT_FILE)


if __name__ == "__main__":
    main()