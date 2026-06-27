import json
import pandas as pd
from pathlib import Path

RAW_DIR = Path("data/raw_fifa")
OUT_DIR = Path("data/processed")
OUT_DIR.mkdir(parents=True, exist_ok=True)


# -----------------------------
# Helpers
# -----------------------------

def extract_tag(tags, prefix):
    """Return first matching tag value by prefix"""
    for t in tags:
        if t["name"].startswith(prefix):
            return t["value"]
    return None


def extract_stats(tags):
    """Extract all FIFA stats into flat dict"""
    stats = {}

    for t in tags:
        name = t["name"]

        if name.startswith("urn:gd:tag:football:stats:"):
            key = name.replace("urn:gd:tag:football:stats:", "")
            stats[key] = t["value"]

    return stats


def extract_player(actor):
    """
    Build clean player row
    """
    key = actor.get("key", {})
    name = actor.get("name", {})
    tags = actor.get("tags", [])

    player_id = key.get("_externalSportsPersonId")
    team_id = key.get("_externalTeamId")

    # ONLY ENGLISH FIELDS (important requirement)
    player_name = name.get("eng")

    team_name = extract_tag(tags, "urn:gd:tag:story:team:name:eng")

    position = extract_tag(tags, "urn:gd:tag:story:staff:position")

    row = {
        "player_id": player_id,
        "team_id": team_id,
        "player_name": player_name,
        "team": team_name,
        "position": position,
    }

    # add stats
    row.update(extract_stats(tags))

    return row


# -----------------------------
# Parse one file
# -----------------------------
def parse_file(path: Path):
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)

    rows = []

    # each object in the file is already a story page
    for page in data:

        actors = page.get("actors", [])

        for actor in actors:
            row = extract_player(actor)

            row["source_tab"] = path.stem

            # useful metadata for debugging
            row["story_id"] = page.get("_externalId")
            row["classification"] = page.get("classification")

            rows.append(row)

    df = pd.DataFrame(rows)

    if "player_id" in df.columns:
        df = df.drop_duplicates(subset=["player_id"])

    return df

# -----------------------------
# Main runner
# -----------------------------

def main():
    all_dfs = []

    for file in RAW_DIR.glob("*.json"):
        print(f"\nParsing {file.name}...")

        df = parse_file(file)

        out_file = OUT_DIR / f"{file.stem}.csv"
        df.to_csv(out_file, index=False)

        print(f"Saved {out_file} → {len(df)} players")

        all_dfs.append(df)

    combined = pd.concat(all_dfs, ignore_index=True)
    combined.to_csv(OUT_DIR / "all_players_combined.csv", index=False)

    print("\nDONE")
    print(f"Total players (combined rows): {len(combined)}")


if __name__ == "__main__":
    main()