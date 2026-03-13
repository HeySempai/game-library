
-- Game config table for victory logic per game
CREATE TABLE public.game_config (
  game_id TEXT PRIMARY KEY,
  victory_type TEXT NOT NULL DEFAULT 'absolute_winner',
  team_mode TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.game_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read game_config" ON public.game_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert game_config" ON public.game_config FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update game_config" ON public.game_config FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

-- Game sessions table
CREATE TABLE public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER,
  victory_type TEXT NOT NULL DEFAULT 'absolute_winner',
  cooperative_win BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read game_sessions" ON public.game_sessions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert game_sessions" ON public.game_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update game_sessions" ON public.game_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete game_sessions" ON public.game_sessions FOR DELETE TO anon, authenticated USING (true);

-- Session participants table
CREATE TABLE public.session_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.game_sessions(id) ON DELETE CASCADE NOT NULL,
  player_name TEXT NOT NULL,
  score INTEGER,
  is_winner BOOLEAN DEFAULT false,
  team TEXT
);

ALTER TABLE public.session_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read session_participants" ON public.session_participants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Allow public insert session_participants" ON public.session_participants FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Allow public update session_participants" ON public.session_participants FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow public delete session_participants" ON public.session_participants FOR DELETE TO anon, authenticated USING (true);
