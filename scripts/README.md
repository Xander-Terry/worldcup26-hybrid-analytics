# WC26 Analytics — Data Pipeline

## Full pipeline (run in order)
python download_fifa_stats.py   # fetch raw JSON from FIFA API

python parse_fifa_tabs.py       # JSON -> per-tab CSVs

python merge_fifa_tabs.py       # merge tabs -> master_fifa_stats.csv

python clean_master_dataset.py  # clean -> master_fifa_clean.csv

python derive_features.py       # per-90s + axis scores + BL grades

python ingest.py                # upsert everything to Supabase

python cluster_global.py        # K-means + UMAP -> cluster_results_global

python cluster_bluelock.py      # K-means -> cluster_results_bluelock

## Refresh data after new matches
python download_fifa_stats.py   # re-scrape FIFA (cached 6h)

python parse_fifa_tabs.py

python merge_fifa_tabs.py

python clean_master_dataset.py

python derive_features.py

python ingest.py                # upserts are safe to re-run
Clustering scripts only need re-running if you want updated archetypes.

## Setup
cd scripts

python -m venv venv

.\venv\Scripts\Activate.ps1     # Windows

pip install -r requirements.txt

## Notes
- FIFA token expires — download_fifa_stats.py fetches a fresh one each run
- Cache TTL is 6 hours — delete scripts/cache/ to force re-fetch
- Prior strength: FW=45min, Outfield=90min (set in derive_features.py)
- BL weights: shoot=0.45, offense=0.35 (striker-first philosophy)