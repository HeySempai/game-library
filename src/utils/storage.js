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
