import json
from pathlib import Path
from collections import Counter

RAW_DIR = Path("data/raw_fifa")

football_stats = Counter()

print("=" * 80)
print("Scanning FIFA files")
print("=" * 80)

for file in sorted(RAW_DIR.glob("*.json")):

    print(f"Scanning {file.name}")

    with open(file, encoding="utf-8") as f:
        pages = json.load(f)

    for page in pages:

        actors = page.get("actors", [])

        for actor in actors:

            for tag in actor.get("tags", []):

                name = tag["name"]

                if name.startswith("urn:gd:tag:football:stats:"):

                    stat = name.replace(
                        "urn:gd:tag:football:stats:",
                        ""
                    )

                    football_stats[stat] += 1

print()
print("=" * 80)
print("UNIQUE FIFA STATS")
print("=" * 80)

for stat in sorted(football_stats):

    print(stat)

print()
print(f"TOTAL UNIQUE STATS: {len(football_stats)}")