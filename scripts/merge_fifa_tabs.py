import pandas as pd
from pathlib import Path
from functools import reduce

#Paths

PROCESSED_DIR = Path("data/processed")
OUTPUT_FILE = PROCESSED_DIR / "master_fifa_stats.csv"

#Metadata cols

META_COLUMNS = [
    "player_id",
    "team_id",
    "player_name",
    "team",
    "position"
]

#Loading the csv

csv_files = [
    f for f in PROCESSED_DIR.glob("*.csv")
    if f.name != "all_players_combined.csv" and f.name != "master_fifa_stats.csv" and not f.name.startswith("master_fifa")
]

dfs = []

for file in csv_files:

    print(f"loading {file.name}")

    df = pd.read_csv(file)

    #remove the duplicate metadata cols

    stat_columns = [
        c for c in df.columns
            if c not in META_COLUMNS and c not in ["source_tab","story_id","classification"]
    ]

    df = df[META_COLUMNS + stat_columns]

    dfs.append(df)

#merging everything

master = reduce(
    lambda left, right:
        pd.merge(
            left,
            right,
            on=META_COLUMNS,
            how="outer"
        ),
    dfs
)

master.to_csv(OUTPUT_FILE, index=False)

print()
print("DONE")
print(f"PLAYERS: {len(master)}")
print(f"COLUMNS: {len(master.columns)}")
print(f"Saved -> {OUTPUT_FILE}")