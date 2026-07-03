"""
cluster_bluelock.py - WC26 Analytics
Reads:  player_stats_bluelock from Supabase (FW only)
Runs:   K-means (k=4) on 6 BL category scores
Writes: cluster_results_bluelock to Supabase

k=4 because the FW population (~273 players) is smaller.
Archetype labels are Blue Lock-themed - update after inspecting centroids.
"""
import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from dotenv import load_dotenv
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import requests

# Load local env only if present
env_path = Path(__file__).parent.parent / ".env.local"
if env_path.exists():
    load_dotenv(env_path)

SUPABASE_URL = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase env vars")
    sys.exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "resolution=merge-duplicates"
}


# -- Config --------------------------------------------------------------------
K = 4
RANDOM_STATE = 42

BL_COLS = ["shoot", "offense", "dribble", "pass", "speed", "defense"]

# Update after inspecting centroids below
ARCHETYPE_LABELS = {
    0: "Ego Monster",
    1: "Phantom Striker",
    2: "Team Weapon",
    3: "Shadow Nine",
}

# -- Load ----------------------------------------------------------------------
print("\n[1/4] Loading player_stats_bluelock from Supabase...")

all_rows = []
page = 0
page_size = 1000
while True:
    url = f"{SUPABASE_URL}/rest/v1/player_stats_bluelock"
    params = {
        "select": "player_id," + ",".join(BL_COLS),
        "offset": page * page_size,
        "limit": page_size
    }

    resp = requests.get(url, headers=HEADERS, params=params)
    rows = resp.json()

    if not rows:
        break
    all_rows.extend(rows)
    if len(rows) < page_size:
        break
    page += 1

df = pd.DataFrame(all_rows)
print(f"  Loaded {len(df)} forwards")

df = df.dropna(subset=BL_COLS)
print(f"  After dropping nulls: {len(df)} forwards")

if len(df) < K:
    print(f"ERROR: Not enough players ({len(df)}) for k={K}")
    sys.exit(1)

# -- Scale + cluster -----------------------------------------------------------
print(f"\n[2/4] Scaling and running K-means (k={K})...")
X = df[BL_COLS].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

kmeans = KMeans(n_clusters=K, random_state=RANDOM_STATE, n_init=20)
cluster_ids = kmeans.fit_predict(X_scaled)
df["cluster_id"] = cluster_ids

sil = silhouette_score(X_scaled, cluster_ids)
print(f"  Silhouette score: {sil:.4f}")

# Centroid inspection
print("\n  Cluster centroids (original scale):")
centroids = scaler.inverse_transform(kmeans.cluster_centers_)
centroid_df = pd.DataFrame(centroids, columns=BL_COLS)
centroid_df.index.name = "cluster_id"
print(centroid_df.round(1).to_string())

print("\n  Cluster sizes + tentative labels:")
for cid, count in pd.Series(cluster_ids).value_counts().sort_index().items():
    label = ARCHETYPE_LABELS.get(cid, f"Cluster {cid}")
    print(f"  Cluster {cid} ({label}): {count} forwards")

# -- Fetch player names for spot-checking --------------------------------------
print("\n[3/4] Spot-checking clusters against known players...")
player_ids = df["player_id"].tolist()

# Fetch names in batches
name_map = {}
for i in range(0, len(player_ids), 100):
    batch = player_ids[i:i+100]
    url = f"{SUPABASE_URL}/rest/v1/players"
    params = {
        "select": "id,name,team",
        "id": f"in.({','.join(batch)})"
    }

    resp = requests.get(url, headers=HEADERS, params=params)
    rows = resp.json()
    for p in rows:
        name_map[p["id"]] = f"{p['name']} ({p['team']})"

df["player_name"] = df["player_id"].map(name_map)

print("\n  Sample players per cluster:")
for cid in range(K):
    cluster_players = df[df["cluster_id"] == cid]["player_name"].dropna()
    sample = cluster_players.head(8).tolist()
    label = ARCHETYPE_LABELS.get(cid, f"Cluster {cid}")
    print(f"\n  Cluster {cid} - {label}:")
    for p in sample:
        print(f"    {p}")

# -- Upsert --------------------------------------------------------------------
print("\n[4/4] Upserting cluster_results_bluelock...")
df["archetype_label"] = df["cluster_id"].map(ARCHETYPE_LABELS).fillna("Unknown")

records = []
for _, row in df.iterrows():
    records.append({
        "player_id":      str(row["player_id"]),
        "cluster_id":     int(row["cluster_id"]),
        "archetype_label":str(row["archetype_label"]),
    })

for i in range(0, len(records), 100):
    chunk = records[i:i+100]
    url = f"{SUPABASE_URL}/rest/v1/cluster_results_bluelock"
    resp = requests.post(
        url,
        headers=HEADERS,
        json=chunk,
        params={"on_conflict": "player_id"}
    )
    if resp.status_code >= 300:
        print("ERROR:", resp.text)
        sys.exit(1)

    print(f"  cluster_results_bluelock: {i+1}-{min(i+100, len(records))}")

print(f"""
   Blue Lock clustering complete!
   Forwards clustered: {len(df)}
   Clusters (k):       {K}
   Silhouette score:   {sil:.4f}

ACTION REQUIRED:
   Review centroid printout and player samples above.
   Update ARCHETYPE_LABELS in this script to match real cluster meanings.
   Re-run to push updated labels to Supabase.

Slice 4 + 5 complete. Move to Slice 6 - Frontend.
""")
