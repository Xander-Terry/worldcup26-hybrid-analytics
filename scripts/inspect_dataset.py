"""
inspect_dataset.py
Quickly profiles whatever CSV files exist in scripts/data/
and tells us exactly what we have before committing to any pipeline.
Run this before anything else.
"""

import os
import sys
import pandas as pd
from pathlib import Path

DATA_DIR = Path(__file__).parent / "data"

csv_files = list(DATA_DIR.glob("*.csv"))
if not csv_files:
    print("No CSV files found in scripts/data/")
    print("Options:")
    print("  1. Download the real Kaggle WC2026 dataset and place it here")
    print("  2. We will fall back to FBref scraping")
    sys.exit(0)

for csv_path in csv_files:
    print(f"\n{'='*60}")
    print(f"FILE: {csv_path.name}")
    print(f"{'='*60}")

    df = pd.read_csv(csv_path, low_memory=False)
    print(f"Shape: {df.shape[0]} rows x {df.shape[1]} columns")
    print(f"\nColumns ({len(df.columns)}):")
    for c in df.columns:
        print(f"  {c}")

    print(f"\nSample values (first row):")
    print(df.iloc[0].to_string())

    print(f"\nNulls per column:")
    null_pct = (df.isnull().sum() / len(df) * 100).round(1)
    for col, pct in null_pct[null_pct > 0].items():
        print(f"  {col}: {pct}% null")

    # Check if player names look real
    name_col = next((c for c in df.columns if 'name' in c.lower() or c.lower() == 'player'), None)
    if name_col:
        print(f"\nSample player names (from '{name_col}'):")
        for name in df[name_col].dropna().head(15).tolist():
            print(f"  {name}")

    # Check if team names look real
    team_col = next((c for c in df.columns if 'team' in c.lower() or 'squad' in c.lower()), None)
    if team_col:
        print(f"\nUnique teams ({df[team_col].nunique()}):")
        for t in sorted(df[team_col].dropna().unique()):
            print(f"  {t}")

    # Check date range if dates exist
    date_col = next((c for c in df.columns if 'date' in c.lower()), None)
    if date_col:
        try:
            dates = pd.to_datetime(df[date_col], errors='coerce').dropna()
            if len(dates) > 0:
                print(f"\nDate range: {dates.min()} to {dates.max()}")
        except:
            pass

    # Check numeric stat ranges for sanity
    print(f"\nNumeric stat ranges (sanity check):")
    num_cols = df.select_dtypes(include='number').columns.tolist()
    for col in num_cols[:20]:
        mn, mx, med = df[col].min(), df[col].max(), df[col].median()
        print(f"  {col:<35} min={mn:.1f}  max={mx:.1f}  median={med:.1f}")