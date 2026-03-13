import { supabase } from "@/integrations/supabase/client";

const GAMES_KEY = "boardgamehub_games";
const PLAYERS_KEY = "boardgamehub_players";

export function loadGames() {
  const stored = localStorage.getItem(GAMES_KEY);
  return stored ? JSON.parse(stored) : null;
}

export function saveGames(games) {
  localStorage.setItem(GAMES_KEY, JSON.stringify(games));
}

// Victories now use the database
export async function loadVictories() {
  const { data, error } = await supabase
    .from("victories")
    .select("*")
    .order("date", { ascending: false });
  if (error) {
    console.error("Error loading victories:", error);
    return [];
  }
  return data.map((v) => ({
    id: v.id,
    gameId: v.game_id,
    winner: v.winner,
    date: v.date,
  }));
}

export async function addVictory(victory) {
  const { data, error } = await supabase
    .from("victories")
    .insert({
      game_id: victory.gameId,
      winner: victory.winner,
      date: victory.date,
    })
    .select()
    .single();
  if (error) {
    console.error("Error adding victory:", error);
    return null;
  }
  return { id: data.id, gameId: data.game_id, winner: data.winner, date: data.date };
}

export function loadPlayers() {
  const stored = localStorage.getItem(PLAYERS_KEY);
  return stored ? JSON.parse(stored) : [
    "Ernesto Aguirre",
    "Dante Cabrera",
    "Christian Garcia",
    "Javier Yuriar",
    "Kevin Guerrero",
    "Adrian Garza",
  ];
}

export function savePlayers(players) {
  localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));
}

// Game Config
export async function loadGameConfigs() {
  const { data, error } = await supabase.from("game_config").select("*");
  if (error) { console.error("Error loading game configs:", error); return {}; }
  const map = {};
  data.forEach((c) => { map[c.game_id] = { victoryType: c.victory_type, teamMode: c.team_mode }; });
  return map;
}

export async function saveGameConfig(gameId, victoryType, teamMode = null) {
  const { error } = await supabase.from("game_config").upsert({
    game_id: gameId, victory_type: victoryType, team_mode: teamMode,
  }, { onConflict: "game_id" });
  if (error) console.error("Error saving game config:", error);
}

// Game Sessions
export async function loadGameSessions(gameId = null) {
  let query = supabase.from("game_sessions").select("*").order("date", { ascending: false });
  if (gameId) query = query.eq("game_id", gameId);
  const { data, error } = await query;
  if (error) { console.error("Error loading sessions:", error); return []; }
  return data;
}

export async function loadSessionParticipants(sessionIds) {
  if (!sessionIds.length) return {};
  const { data, error } = await supabase.from("session_participants").select("*").in("session_id", sessionIds);
  if (error) { console.error("Error loading participants:", error); return {}; }
  const map = {};
  data.forEach((p) => {
    if (!map[p.session_id]) map[p.session_id] = [];
    map[p.session_id].push(p);
  });
  return map;
}

export async function createGameSession(session, participants) {
  const { data, error } = await supabase.from("game_sessions").insert({
    game_id: session.gameId,
    date: session.date,
    duration_minutes: session.durationMinutes || null,
    victory_type: session.victoryType,
    cooperative_win: session.cooperativeWin ?? null,
    notes: session.notes || null,
  }).select().single();
  if (error) { console.error("Error creating session:", error); return null; }

  if (participants.length > 0) {
    const rows = participants.map((p) => ({
      session_id: data.id,
      player_name: p.playerName,
      score: p.score ?? null,
      is_winner: p.isWinner || false,
      team: p.team || null,
    }));
    const { error: pErr } = await supabase.from("session_participants").insert(rows);
    if (pErr) console.error("Error adding participants:", pErr);
  }
  return data;
}

export async function deleteGameSession(sessionId) {
  const { error } = await supabase.from("game_sessions").delete().eq("id", sessionId);
  if (error) console.error("Error deleting session:", error);
}

export function parseDuration(duracion) {
  if (!duracion) return { min: 0, max: 999 };
  const nums = duracion.match(/\d+/g);
  if (!nums) return { min: 0, max: 999 };
  if (nums.length === 1) return { min: parseInt(nums[0]), max: parseInt(nums[0]) };
  return { min: parseInt(nums[0]), max: parseInt(nums[1]) };
}

export function getEffectivePlayerRange(game, allGames) {
  if (game.tipo === "Juego Base") {
    const ampliaciones = allGames.filter(
      (g) => g.parentId === game.id && g.tipo === "Ampliacion"
    );
    let maxPlayers = game.maxJugadores;
    ampliaciones.forEach((a) => {
      if (a.maxJugadores && a.maxJugadores > maxPlayers) {
        maxPlayers = a.maxJugadores;
      }
    });
    return { min: game.minJugadores, max: maxPlayers };
  }
  if (game.tipo === "Expansion" && game.parentId) {
    const parent = allGames.find((g) => g.id === game.parentId);
    if (parent) return { min: parent.minJugadores, max: parent.maxJugadores };
  }
  return { min: game.minJugadores, max: game.maxJugadores };
}
