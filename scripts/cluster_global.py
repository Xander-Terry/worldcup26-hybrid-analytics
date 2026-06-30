"""
cluster_global.py - WC26 Analytics
Reads:  player_stats_global from Supabase
Runs:   K-means (k=6) on 6 axis scores
        UMAP 2D projection
Writes: cluster_results_global to Supabase

Archetype labels are assigned after inspecting cluster centroids.
Run this script, check the centroid printout, then update
ARCHETYPE_LABELS below to match what each cluster actually represents.
"""

import os
import sys
import numpy as np
import pandas as pd
from pathlib import Path
from supabase import create_client, Client
from dotenv import load_dotenv
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
import umap

load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local")
SUPABASE_URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
if not SUPABASE_URL or not SUPABASE_KEY:
    print("ERROR: Missing Supabase env vars")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# -- Config --------------------------------------------------------------------
K = 6
RANDOM_STATE = 42
UMAP_NEIGHBORS = 15
UMAP_MIN_DIST  = 0.1

# The 6 axis columns used as the clustering feature vector
AXIS_COLS = [
    "attacking_threat",
    "chance_creation",
    "ball_progression",
    "defensive_actions",
    "possession_security",
    "physical_impact",
]

# Update these AFTER first run - inspect centroid printout to label clusters
# Keys are cluster IDs 0-5, values are the archetype names
ARCHETYPE_LABELS = {
    0: "Box Threat",
    1: "Press Engine",
    2: "Playmaker",
    3: "Ball Winner",
    4: "Wide Carrier",
    5: "Defensive Shield",
}

# -- Load from Supabase --------------------------------------------------------
print("\n[1/5] Loading player_stats_global from Supabase...")

# Supabase returns max 1000 rows per request - paginate
all_rows = []
page = 0
page_size = 1000
while True:
    result = (
        supabase.table("player_stats_global")
        .select("player_id," + ",".join(AXIS_COLS))
        .range(page * page_size, (page + 1) * page_size - 1)
        .execute()
    )
    rows = result.data
    if not rows:
        break
    all_rows.extend(rows)
    if len(rows) < page_size:
        break
    page += 1

df = pd.DataFrame(all_rows)
print(f"  Loaded {len(df)} outfield players")

# Drop any rows with null axis scores
df = df.dropna(subset=AXIS_COLS)
print(f"  After dropping nulls: {len(df)} players")

if len(df) < K:
    print(f"ERROR: Not enough players ({len(df)}) for k={K} clusters")
    sys.exit(1)

# -- Scale ---------------------------------------------------------------------
print("\n[2/5] Scaling features...")
X = df[AXIS_COLS].values
scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

# -- K-means -------------------------------------------------------------------
print(f"\n[3/5] Running K-means (k={K})...")
kmeans = KMeans(n_clusters=K, random_state=RANDOM_STATE, n_init=20)
cluster_ids = kmeans.fit_predict(X_scaled)
df["cluster_id"] = cluster_ids

sil = silhouette_score(X_scaled, cluster_ids)
print(f"  Silhouette score: {sil:.4f}  (> 0.2 is acceptable)")

# Print centroids so you can assign meaningful archetype labels
print("\n  Cluster centroids (original scale - higher = stronger on that axis):")
centroids_original = scaler.inverse_transform(kmeans.cluster_centers_)
centroid_df = pd.DataFrame(centroids_original, columns=AXIS_COLS)
centroid_df.index.name = "cluster_id"
print(centroid_df.round(1).to_string())

print("\n  Cluster sizes:")
for cid, count in pd.Series(cluster_ids).value_counts().sort_index().items():
    label = ARCHETYPE_LABELS.get(cid, f"Cluster {cid}")
    print(f"  Cluster {cid} ({label}): {count} players")

# -- UMAP ----------------------------------------------------------------------
print(f"\n[4/5] Running UMAP (neighbors={UMAP_NEIGHBORS}, min_dist={UMAP_MIN_DIST})...")
reducer = umap.UMAP(
    n_components=2,
    n_neighbors=UMAP_NEIGHBORS,
    min_dist=UMAP_MIN_DIST,
    random_state=RANDOM_STATE,
)
embedding = reducer.fit_transform(X_scaled)
df["umap_x"] = embedding[:, 0]
df["umap_y"] = embedding[:, 1]

print(f"  UMAP complete")
print(f"  umap_x range: {df['umap_x'].min():.2f} - {df['umap_x'].max():.2f}")
print(f"  umap_y range: {df['umap_y'].min():.2f} - {df['umap_y'].max():.2f}")

# -- Upsert to Supabase --------------------------------------------------------
print("\n[5/5] Upserting cluster_results_global...")
df["archetype_label"] = df["cluster_id"].map(ARCHETYPE_LABELS).fillna("Unknown")

records = []
for _, row in df.iterrows():
    records.append({
        "player_id":      str(row["player_id"]),
        "cluster_id":     int(row["cluster_id"]),
        "archetype_label":str(row["archetype_label"]),
        "umap_x":         round(float(row["umap_x"]), 4),
        "umap_y":         round(float(row["umap_y"]), 4),
    })

for i in range(0, len(records), 100):
    chunk = records[i:i+100]
    supabase.table("cluster_results_global").upsert(
        chunk, on_conflict="player_id"
    ).execute()
    print(f"  cluster_results_global: {i+1}-{min(i+100, len(records))}")

print(f"""
âœ… Global clustering complete!
   Players clustered: {len(df)}
   Clusters (k):      {K}
   Silhouette score:  {sil:.4f}

ACTION REQUIRED:
   Review the centroid printout above.
   Update ARCHETYPE_LABELS in this script to reflect real cluster meanings.
   Re-run to update labels in Supabase.

Next: python cluster_bluelock.py
""")
