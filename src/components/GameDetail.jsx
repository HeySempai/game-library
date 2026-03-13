import { useState, useEffect } from "react";
import { X, Users, Clock, Building2, User, Pencil, History, Plus, Trophy, Calendar } from "lucide-react";
import { ownersData } from "../data/owners";
import { loadGameSessions, loadSessionParticipants } from "../utils/storage";
import LogSessionForm from "./LogSessionForm";

const avatarMap = {};
ownersData.forEach((o) => { avatarMap[o.nombre] = o.avatar; });

const tipoBadge = { "Juego Base": "bg-orange-500", Ampliacion: "bg-amber-500", Expansion: "bg-sky-500" };

const categoryColors = {
  "Party Game": "bg-pink-500", "Estrategia": "bg-emerald-500", "Deducción Social": "bg-red-500",
  "Cooperativo": "bg-cyan-500", "Aventura": "bg-orange-500", "Card Game": "bg-indigo-500",
};

const VICTORY_LABELS = {
  score_descending: "Puntaje ↓", score_ascending: "Puntaje ↑", absolute_winner: "Ganador",
  team_winner: "Equipos", cooperative: "Cooperativo", no_winner: "Sin ganador",
};

export default function GameDetail({ game, expansions, allGames, category, onClose, onEdit, gameConfig, players, onSessionCreated }) {
  if (!game) return null;

  const [sessions, setSessions] = useState([]);
  const [participantsMap, setParticipantsMap] = useState({});
  const [showLogForm, setShowLogForm] = useState(false);

  const parent = game.parentId ? allGames.find((g) => g.id === game.parentId) : null;
  const victoryType = gameConfig?.victoryType || "absolute_winner";

  useEffect(() => {
    const load = async () => {
      const s = await loadGameSessions(game.id);
      setSessions(s);
      if (s.length > 0) {
        const pm = await loadSessionParticipants(s.map((x) => x.id));
        setParticipantsMap(pm);
      }
    };
    load();
  }, [game.id]);

  const handleSessionSaved = async ({ session, participants }) => {
    const { createGameSession } = await import("../utils/storage");
    await createGameSession(session, participants);
    setShowLogForm(false);
    // Reload sessions
    const s = await loadGameSessions(game.id);
    setSessions(s);
    if (s.length > 0) {
      const pm = await loadSessionParticipants(s.map((x) => x.id));
      setParticipantsMap(pm);
    }
    if (onSessionCreated) onSessionCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Cover */}
        <div className="relative bg-gray-50 p-5 sm:p-8 flex justify-center rounded-t-2xl">
          <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
            {onEdit && (
              <button onClick={onEdit} className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 transition-colors cursor-pointer shadow-sm">
                <Pencil size={16} />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 transition-colors cursor-pointer shadow-sm">
              <X size={18} />
            </button>
          </div>
          {game.imageUrl ? (
            <img src={game.imageUrl} alt={game.nombre} className="max-h-48 sm:max-h-72 w-auto rounded-lg block"
              style={{ boxShadow: "4px 6px 20px rgba(0,0,0,0.15), 2px 3px 8px rgba(0,0,0,0.08)" }} />
          ) : (
            <div className="w-48 aspect-[3/4] bg-gray-200 rounded-lg flex items-center justify-center"
              style={{ boxShadow: "4px 6px 20px rgba(0,0,0,0.15)" }}>
              <span className="text-8xl opacity-20">🎲</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-gray-900">{game.nombre}</h2>
            {category && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${categoryColors[category]}`}>{category}</span>
            )}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-200 text-gray-500">
              {VICTORY_LABELS[victoryType]}
            </span>
          </div>

          {parent && (
            <p className="text-sm text-gray-400 mt-1">Requiere: <span className="text-orange-500 font-medium">{parent.nombre}</span></p>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Users size={16} className="mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">{game.jugadoresDisplay}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Jugadores</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Clock size={16} className="mx-auto text-orange-500 mb-1" />
              <p className="text-lg font-bold text-gray-900">{game.duracion}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">Duración</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <Building2 size={16} className="mx-auto text-orange-500 mb-1" />
              <p className="text-xs font-bold text-gray-900 leading-tight">{game.developer}</p>
              <p className="text-[10px] text-gray-400 uppercase tracking-wide mt-0.5">Developer</p>
            </div>
          </div>

          {/* Owners */}
          <div className="mt-6">
            <h4 className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-1">
              <User size={12} /> Owners
            </h4>
            <div className="flex flex-wrap gap-3">
              {game.owners.map((owner, i) => (
                <div key={i} className="group/owner relative flex flex-col items-center">
                  {avatarMap[owner] ? (
                    <img src={avatarMap[owner]} alt={owner}
                      className="w-14 h-14 rounded-full object-cover border-2 border-gray-100 hover:border-orange-300 transition-colors shadow-sm" loading="eager" width={56} height={56} decoding="async" />
                  ) : (
                    <span className="w-14 h-14 rounded-full bg-gray-200 text-lg font-bold flex items-center justify-center text-gray-500">{owner.charAt(0)}</span>
                  )}
                  <span className="absolute -bottom-6 text-[10px] text-gray-500 opacity-0 group-hover/owner:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{owner}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Expansions */}
          {expansions && expansions.length > 0 && (
            <div className="mt-8">
              <h4 className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Expansiones y Ampliaciones ({expansions.length})</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {expansions.map((exp) => (
                  <div key={exp.id} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center text-center">
                    {exp.imageUrl ? (
                      <img src={exp.imageUrl} alt={exp.nombre} className="h-28 w-auto object-contain mb-2"
                        style={{ filter: "drop-shadow(3px 4px 4px rgba(0,0,0,0.2))" }} />
                    ) : (
                      <div className="h-28 w-20 bg-gray-200 rounded-lg flex items-center justify-center mb-2"><span className="text-3xl opacity-20">🎲</span></div>
                    )}
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded text-white mb-1 ${tipoBadge[exp.tipo]}`}>
                      {exp.tipo === "Ampliacion" ? "AMP" : "EXP"}
                    </span>
                    <p className="text-xs font-medium text-gray-700 leading-tight">{exp.nombre}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{exp.jugadoresDisplay}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Session History */}
          {game.tipo === "Juego Base" && (
            <div className="mt-8">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                  <History size={12} /> Historial de Partidas ({sessions.length})
                </h4>
                <button onClick={() => setShowLogForm(true)}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 cursor-pointer font-semibold">
                  <Plus size={12} /> Registrar
                </button>
              </div>

              {sessions.length === 0 ? (
                <p className="text-center text-gray-300 py-4 text-sm">No hay partidas registradas.</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {sessions.slice(0, 10).map((s) => {
                    const parts = participantsMap[s.id] || [];
                    const winners = parts.filter((p) => p.is_winner);
                    return (
                      <div key={s.id} className="bg-gray-50 rounded-xl p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1.5">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {s.date}</span>
                          {s.duration_minutes && <span className="flex items-center gap-1"><Clock size={10} /> {s.duration_minutes}min</span>}
                        </div>
                        {s.victory_type === "cooperative" && s.cooperative_win !== null && (
                          <p className={`text-xs font-semibold mb-1 ${s.cooperative_win ? "text-emerald-500" : "text-red-500"}`}>
                            {s.cooperative_win ? "🎉 Victoria" : "💀 Derrota"}
                          </p>
                        )}
                        {parts.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {parts.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity)).map((p) => (
                              <span key={p.id} className={`text-[11px] px-2 py-0.5 rounded-full ${
                                p.is_winner ? "bg-amber-100 text-amber-700 font-semibold" : "bg-gray-200 text-gray-500"
                              }`}>
                                {p.is_winner && "🏆 "}{p.player_name}{p.score !== null ? `: ${p.score}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        {s.notes && <p className="text-[10px] text-gray-400 italic mt-1">"{s.notes}"</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showLogForm && (
        <LogSessionForm
          game={game}
          victoryType={victoryType}
          teamMode={gameConfig?.teamMode || null}
          players={players || []}
          allGames={allGames}
          onSave={handleSessionSaved}
          onClose={() => setShowLogForm(false)}
        />
      )}
    </div>
  );
}
