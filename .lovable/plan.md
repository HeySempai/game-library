

## Plan: Game History & Victory Logic System

### Problem
Currently there's only a simple "victories" table tracking winner + game + date. The real world is more nuanced: some games have scores (descending wins), some have an absolute winner, some are team-based, some are party/storytelling with no winner at all.

### Design

**Victory Logic Types** (stored per game in a new `game_config` table):
- `score_descending` — Highest score wins (e.g. 7 Wonders, Wingspan)
- `score_ascending` — Lowest score wins (rare but possible)
- `absolute_winner` — Just pick a winner, no scores (e.g. Catan, Exploding Kittens)
- `team_winner` — Team-based, pick winning team (e.g. Saboteur, Betrayal)
- `cooperative` — All win or all lose (e.g. Hogwarts Battle, Cuphead)
- `no_winner` — Pure fun, no winner (e.g. Wavelength, Vantage)

**Database Changes:**

1. **`game_config` table** — Per-game settings
   - `game_id` (text, PK) — matches the game ID from the app
   - `victory_type` (text) — one of the types above
   - `team_mode` (text, nullable) — `random_teams`, `one_vs_all`, `fixed_teams`, or null

2. **`game_sessions` table** — Full match history
   - `id` (uuid, PK)
   - `game_id` (text)
   - `date` (date)
   - `duration_minutes` (integer, nullable)
   - `victory_type` (text) — snapshot of config at play time
   - `notes` (text, nullable)
   - `created_at` (timestamptz)

3. **`session_participants` table** — Players and results per session
   - `id` (uuid, PK)
   - `session_id` (uuid, FK → game_sessions)
   - `player_name` (text)
   - `score` (integer, nullable) — only for score-based games
   - `is_winner` (boolean, default false)
   - `team` (text, nullable) — team name/label for team games

All tables with public RLS policies (no auth currently).

### UI Changes

1. **EditGameForm** — Add a "Lógica de Victoria" selector with the 6 types, and optional team mode. Saves to `game_config` table.

2. **GameDetail** — Show a "Historial de Partidas" section at the bottom with past sessions for that game.

3. **New `GameHistoryPanel` component** — Full match history browser (accessible from header or GameDetail):
   - Log a new session: select game → form adapts based on victory type:
     - `score_descending/ascending`: add players + scores, winner auto-calculated
     - `absolute_winner`: select players, pick winner
     - `team_winner`: define teams, pick winning team
     - `cooperative`: select players, mark win/loss
     - `no_winner`: just log players and duration
   - Session list with filters by game/player/date

4. **Leaderboard** — Updated to pull from `game_sessions` + `session_participants` instead of the old `victories` table. Keeps backward compatibility by also reading existing victories.

### Migration Strategy
- Keep the existing `victories` table as-is for now
- New sessions go to `game_sessions`
- Leaderboard reads from both sources
- Seed `game_config` with known victory types for existing games via SQL insert

### Files to Create/Modify
- **New migration**: Create `game_config`, `game_sessions`, `session_participants` tables + RLS
- **New migration (data)**: Seed game_config for all existing games
- **New**: `src/components/GameHistoryPanel.jsx` — main history UI
- **New**: `src/components/LogSessionForm.jsx` — adaptive form for logging sessions
- **Modify**: `src/components/EditGameForm.jsx` — add victory type selector
- **Modify**: `src/components/GameDetail.jsx` — show session history section
- **Modify**: `src/components/Leaderboard.jsx` — read from new tables
- **Modify**: `src/utils/storage.js` — add CRUD functions for sessions and game config
- **Modify**: `src/App.jsx` — add state/handlers for game history, wire up new panel

