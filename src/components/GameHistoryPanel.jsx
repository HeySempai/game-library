import { useState, useEffect } from "react";
import { X, Plus, Trophy, Clock, Users, Calendar, Trash2, History } from "lucide-react";
import { loadGameSessions, loadSessionParticipants, deleteGameSession } from "../utils/storage";
import LogSessionForm from "./LogSessionForm";

const VICTORY_LABELS = {
  score_descending: "Puntaje ↓",
  score_ascending: "Puntaje ↑",
  absolute_winner: "Ganador",
  team_winner: "Equipos",
  cooperative: "Cooperativo",
  no_winner: "Sin ganador",
};

export default function GameHistoryPanel({ games, players, gameConfigs, onClose, initialGameId }) {
  const [sessions, setSessions] = useState([]);
  const [participantsMap, setParticipantsMap] = useState({});
  const [filterGameId, setFilterGameId] = useState(initialGameId || "");
  const [showLogForm, setShowLogForm] = useState(false);
  const [logGame, setLogGame] = useState(null);
  const [loading, setLoading] = useState(true);

  const baseGames = games.filter((g) => g.tipo === "Juego Base");

  const loadData = async () => {
    setLoading(true);
    const s = await loadGameSessions(filterGameId || null);
    setSessions(s);
    if (s.length > 0) {
      const pm = await loadSessionParticipants(s.map((x) => x.id));
      setParticipantsMap(pm);
    } else {
      setParticipantsMap({});
    }
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [filterGameId]);

  const handleLogSession = (gameId) => {
    const game = games.find((g) => g.id === gameId);
    if (game) { setLogGame(game); setShowLogForm(true); }
  };

  const handleDeleteSession = async (id) => {
    await deleteGameSession(id);
    loadData();
  };

  const getGameName = (id) => games.find((g) => g.id === id)?.nombre || id;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <History size={20} className="text-orange-500" /> Historial de Partidas
          </h2>
          <div className="flex gap-2">
            <button onClick={() => {
              if (filterGameId) { handleLogSession(filterGameId); }
            }} className={`p-1.5 rounded-lg text-white cursor-pointer ${filterGameId ? "bg-orange-500 hover:bg-orange-400" : "bg-gray-300 cursor-not-allowed"}`}
              disabled={!filterGameId} title="Registrar partida">
              <Plus size={16} />
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Game filter */}
          <select value={filterGameId} onChange={(e) => setFilterGameId(e.target.value)}
            className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-700 text-sm focus:border-orange-400 focus:outline-none">
            <option value="">Todos los juegos</option>
            {baseGames.map((g) => <option key={g.id} value={g.id}>{g.nombre}</option>)}
          </select>

          {/* Quick log button when game is selected */}
          {filterGameId && (
            <button onClick={() => handleLogSession(filterGameId)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 text-sm font-semibold transition-colors cursor-pointer border border-orange-200">
              <Plus size={14} /> Registrar nueva partida de {getGameName(filterGameId)}
            </button>
          )}

          {/* Sessions list */}
          {loading ? (
            <p className="text-center text-gray-400 py-8">Cargando...</p>
          ) : sessions.length === 0 ? (
            <p className="text-center text-gray-400 py-8">No hay partidas registradas{filterGameId ? " para este juego" : ""}.</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => {
                const parts = participantsMap[s.id] || [];
                const winners = parts.filter((p) => p.is_winner);
                const game = games.find((g) => g.id === s.game_id);
                return (
                  <div key={s.id} className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-900">{game?.nombre || s.game_id}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className="flex items-center gap-1"><Calendar size={11} /> {s.date}</span>
                          {s.duration_minutes && <span className="flex items-center gap-1"><Clock size={11} /> {s.duration_minutes} min</span>}
                          <span className="px-1.5 py-0.5 rounded bg-gray-200 text-gray-500 text-[10px] font-semibold">
                            {VICTORY_LABELS[s.victory_type] || s.victory_type}
                          </span>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteSession(s.id)} className="p-1.5 text-gray-300 hover:text-red-400 cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Cooperative result */}
                    {s.victory_type === "cooperative" && s.cooperative_win !== null && (
                      <p className={`text-xs font-semibold ${s.cooperative_win ? "text-emerald-500" : "text-red-500"}`}>
                        {s.cooperative_win ? "🎉 Victoria cooperativa" : "💀 Derrota"}
                      </p>
                    )}

                    {/* Participants */}
                    {parts.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {parts.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity)).map((p) => (
                          <span key={p.id} className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            p.is_winner ? "bg-amber-100 text-amber-700 font-semibold" : "bg-gray-200 text-gray-600"
                          }`}>
                            {p.is_winner && <Trophy size={10} />}
                            {p.player_name}
                            {p.score !== null && <span className="font-bold ml-0.5">{p.score}</span>}
                            {p.team && <span className="text-[10px] opacity-60">({p.team})</span>}
                          </span>
                        ))}
                      </div>
                    )}

                    {s.notes && <p className="text-xs text-gray-400 italic">"{s.notes}"</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showLogForm && logGame && (
        <LogSessionForm
          game={logGame}
          victoryType={gameConfigs[logGame.id]?.victoryType || "absolute_winner"}
          teamMode={gameConfigs[logGame.id]?.teamMode || null}
          players={players}
          onSave={async ({ session, participants }) => {
            const { createGameSession } = await import("../utils/storage");
            await createGameSession(session, participants);
            setShowLogForm(false);
            setLogGame(null);
            loadData();
          }}
          onClose={() => { setShowLogForm(false); setLogGame(null); }}
        />
      )}
    </div>
  );
}
