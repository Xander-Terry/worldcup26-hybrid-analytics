import pandas as pd
from pathlib import Path
from functools import reduce

PROCESSED_DIR = Path("data/processed")
OUTPUT_FILE = PROCESSED_DIR / "master_fifa_stats.csv"

# Metadata columns we want to preserve from the FIRST CSV only
META_COLUMNS = ["player_id", "team_id", "player_name", "team", "position"]

# Columns that appear in multiple CSVs and MUST be dropped globally
DROP_COLS = ["source_tab", "story_id", "classification"]

# Load all CSVs except the final outputs
csv_files = [
    f for f in PROCESSED_DIR.glob("*.csv")
    if f.name not in ["all_players_combined.csv", "master_fifa_stats.csv"]
    and not f.name.startswith("master_fifa")
]

dfs = []

for idx, file in enumerate(csv_files):
    print(f"loading {file.name}")
    df = pd.read_csv(file)

    # Ensure merge keys have consistent types
    df["player_id"] = df["player_id"].astype(str)
    df["team_id"] = df["team_id"].astype(str)

    # Ensure FDH rows have a position column
    if "position" not in df.columns:
        df["position"] = None

    # Drop junk columns from ALL CSVs
    df = df.drop(columns=[c for c in DROP_COLS if c in df.columns])

    if idx == 0:
        # FIRST CSV keeps metadata
        stat_columns = [c for c in df.columns if c not in META_COLUMNS]
        df = df[META_COLUMNS + stat_columns]
    else:
        # ALL OTHER CSVs drop metadata except player_id
        stat_columns = [c for c in df.columns if c not in META_COLUMNS]
        df = df[["player_id"] + stat_columns]

    dfs.append(df)

# Merge everything on player_id only
master = reduce(
    lambda left, right: pd.merge(left, right, on="player_id", how="outer"),
    dfs
)

# Rebuild metadata columns from the FIRST CSV
first_df = dfs[0]

for col in META_COLUMNS:
    master[col] = master[col].combine_first(first_df[col])

# Reorder columns so metadata comes first
master = master[META_COLUMNS + [c for c in master.columns if c not in META_COLUMNS]]

# Save final merged dataset
master.to_csv(OUTPUT_FILE, index=False)

print("\nDONE")
print(f"PLAYERS: {len(master)}")
print(f"COLUMNS: {len(master.columns)}")
print(f"Saved -> {OUTPUT_FILE}")
