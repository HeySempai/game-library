import { supabase } from "@/integrations/supabase/client";
import { ownersData } from "../data/owners";

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

export async function loadPlayers() {
  const ownerNames = ownersData.map((o) => o.nombre);
  const { data, error } = await supabase
    .from("session_participants")
    .select("player_name");
  if (error) { console.error("Error loading players:", error); return ownerNames; }
  const allNames = new Set(ownerNames);
  data.forEach((p) => allNames.add(p.player_name));
  return [...allNames];
}

// Game Config
export async function loadGameConfigs() {
  const { data, error } = await supabase.from("game_config").select("*");
  if (error) { console.error("Error loading game configs:", error); return {}; }
  const map = {};
  data.forEach((c) => {
    map[c.game_id] = {
      victoryType: c.victory_type,
      teamMode: c.team_mode,
      rngDisabled: c.rng_disabled,
      category: c.category,
      owners: c.owners,
      customNombre: c.custom_nombre,
      imageUrl: c.image_url,
      isCustom: c.is_custom,
      tipo: c.tipo,
      duracion: c.duracion,
      minJugadores: c.min_jugadores,
      maxJugadores: c.max_jugadores,
      jugadoresDisplay: c.jugadores_display,
      developer: c.developer,
      parentId: c.parent_id,
    };
  });
  return map;
}

export async function loadRngDisabled() {
  const { data, error } = await supabase.from("game_config").select("game_id").eq("rng_disabled", true);
  if (error) { console.error("Error loading rng disabled:", error); return new Set(); }
  return new Set(data.map((r) => r.game_id));
}

export async function saveRngDisabled(gameId, disabled) {
  // Try update first (existing row)
  const { data } = await supabase.from("game_config").update({ rng_disabled: disabled }).eq("game_id", gameId).select();
  if (!data || data.length === 0) {
    // No existing row — insert with defaults
    const { error } = await supabase.from("game_config").insert({
      game_id: gameId, victory_type: "absolute_winner", rng_disabled: disabled,
    });
    if (error) console.error("Error saving rng disabled:", error);
  }
}

export async function saveCategory(gameId, category) {
  const { data } = await supabase.from("game_config").update({ category: category || null }).eq("game_id", gameId).select();
  if (!data || data.length === 0) {
    const { error } = await supabase.from("game_config").insert({
      game_id: gameId, victory_type: "absolute_winner", category: category || null,
    });
    if (error) console.error("Error saving category:", error);
  }
}

// Game overrides (owners, name, image for hardcoded games)
export async function saveGameOverride(gameId, { owners, nombre, imageUrl }) {
  const updates = {};
  if (owners !== undefined) updates.owners = owners;
  if (nombre !== undefined) updates.custom_nombre = nombre || null;
  if (imageUrl !== undefined) updates.image_url = imageUrl || null;
  // Try update first to avoid NOT NULL violation on upsert
  const { data } = await supabase.from("game_config").update(updates).eq("game_id", gameId).select();
  if (!data || data.length === 0) {
    // No existing row — insert with defaults
    const { error } = await supabase.from("game_config").insert({
      game_id: gameId, victory_type: "absolute_winner", ...updates,
    });
    if (error) console.error("Error saving game override:", error);
  }
}

// Custom games (user-created, not in hardcoded catalog)
export async function saveCustomGame(game) {
  const { error } = await supabase.from("game_config").upsert({
    game_id: game.id,
    is_custom: true,
    custom_nombre: game.nombre,
    tipo: game.tipo,
    duracion: game.duracion || null,
    min_jugadores: game.minJugadores || null,
    max_jugadores: game.maxJugadores || null,
    jugadores_display: game.jugadoresDisplay || null,
    developer: game.developer || null,
    parent_id: game.parentId || null,
    owners: game.owners || [],
    image_url: game.imageUrl || null,
  }, { onConflict: "game_id" });
  if (error) console.error("Error saving custom game:", error);
}

// Owner titles
export async function loadOwnerTitles() {
  const { data, error } = await supabase.from("owner_config").select("*");
  if (error) { console.error("Error loading owner titles:", error); return {}; }
  const map = {};
  data.forEach((o) => { map[o.owner_id] = o.title; });
  return map;
}

export async function saveOwnerTitle(ownerId, title) {
  const { error } = await supabase.from("owner_config").upsert({
    owner_id: ownerId, title,
  }, { onConflict: "owner_id" });
  if (error) console.error("Error saving owner title:", error);
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
    is_official: session.isOfficial ?? true,
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

export async function updateGameSession(sessionId, session, participants) {
  const { error } = await supabase.from("game_sessions").update({
    date: session.date,
    duration_minutes: session.durationMinutes || null,
    victory_type: session.victoryType,
    cooperative_win: session.cooperativeWin ?? null,
    notes: session.notes || null,
    is_official: session.isOfficial ?? true,
  }).eq("id", sessionId);
  if (error) { console.error("Error updating session:", error); return; }

  // Replace participants: delete old, insert new
  await supabase.from("session_participants").delete().eq("session_id", sessionId);
  if (participants.length > 0) {
    const rows = participants.map((p) => ({
      session_id: sessionId,
      player_name: p.playerName,
      score: p.score ?? null,
      is_winner: p.isWinner || false,
      team: p.team || null,
    }));
    const { error: pErr } = await supabase.from("session_participants").insert(rows);
    if (pErr) console.error("Error updating participants:", pErr);
  }
}

export async function deleteGameSession(sessionId) {
  const { error } = await supabase.from("game_sessions").delete().eq("id", sessionId);
  if (error) console.error("Error deleting session:", error);
}

// FAQ
export async function loadGameFaq(gameId) {
  const { data, error } = await supabase.from("game_faq").select("*").eq("game_id", gameId).order("created_at", { ascending: true });
  if (error) { console.error("Error loading FAQ:", error); return []; }
  return data;
}

export async function addFaqEntry(entry) {
  const { data, error } = await supabase.from("game_faq").insert({
    game_id: entry.gameId, question: entry.question, answer: entry.answer, is_house_rule: entry.isHouseRule || false,
  }).select().single();
  if (error) { console.error("Error adding FAQ:", error); return null; }
  return data;
}

export async function deleteFaqEntry(id) {
  const { error } = await supabase.from("game_faq").delete().eq("id", id);
  if (error) console.error("Error deleting FAQ:", error);
}

export async function generateFaqAnswer(question, gameIds, bookletNames = null, houseRules = []) {
  const { data, error } = await supabase.functions.invoke("generate-faq-answer", {
    body: { question, game_ids: gameIds, booklet_names: bookletNames, house_rules: houseRules },
  });
  if (error) throw error;
  if (data.error) throw new Error(data.error);
  return data.answer;
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
