# Data Dictionary — WC26 Hybrid Analytics

## Source
Kaggle: `fifa_world_cup_2026_player_performance.csv`
1,248 players · 75 features · one row per player per match

## players table
| Column | Source | Notes |
|---|---|---|
| kaggle_player_id | player_id | Unique per player |
| name | player_name | |
| nationality | nationality | Used for flag display |
| position | position | "FW", "MF", "DF", "GK" |
| total_minutes_tournament | sum(minutes_played) | Filter threshold >= 5 |
| total_goals_tournament | total_goals_tournament | Direct column |
| total_assists_tournament | total_assists_tournament | Direct column |
| tournament_rating | mean(tournament_rating) | Display only, not in ML |

## player_stats_global table
All per-90 stats use total_minutes_tournament as denominator.
All 6 axis scores are percentile-ranked 0-100 across outfield players >= 5 min.
GK excluded from axis computation.

### 6-Axis Derivations
| Axis | Key Inputs |
|---|---|
| attacking_threat | goals_p90 (0.30), shots_on_target_p90 (0.25), xg_p90 (0.25), clutch (0.10), total_goals_norm (0.10) |
| chance_creation | key_passes_p90 (0.25), xa_p90 (0.25), creativity_score (0.20), assists_p90 (0.15), crosses (0.10), total_assists_norm (0.05) |
| ball_progression | successful_dribbles_p90 (0.25), pass_accuracy (0.20), successful_passes_p90 (0.20), possession_impact (0.15), dribbles_attempted_p90 (0.15), progressive proxy (0.05) |
| defensive_actions | tackles_p90 (0.22), interceptions_p90 (0.22), defensive_actions_p90 (0.18), clearances_p90 (0.12), recoveries_p90 (0.12), aerial_duels_won_p90 (0.08), blocks_p90 (0.06) |
| possession_security | pass_accuracy (0.35), successful_passes_p90 (0.25), pressure_resistance (0.25), fouls_suffered_p90 (0.10), aerial_duels_won_p90 (0.05) |
| physical_impact | distance_p90 (0.22), sprint_distance_p90 (0.22), top_speed_kmh (0.18), stamina_score (0.18), accelerations_p90 (0.12), total_aerial_contests_p90 (0.08) |

## player_stats_bluelock table
FW position only. >= 5 minutes played.
All category scores normalized 0-100 within FW subset.

### Grade Bands
| Score | Grade |
|---|---|
| 0-29 | G |
| 30-39 | F |
| 40-49 | E |
| 50-59 | D |
| 60-69 | C |
| 70-79 | B |
| 80-89 | A |
| 90-99 | S |
| 100 | S+ |

### Ego Map Axes
| Axis | Left/Bottom | Right/Top |
|---|---|---|
| X | Holistic / World-Style (key passes, assists, pass accuracy) | Self-Style / Individualistic (shots, dribbles, offensive contribution) |
| Y | Restrictive (pass accuracy, successful passes, pressure resistance) | Freedom (dribble attempts, shots, fouls suffered, creativity_score) |
