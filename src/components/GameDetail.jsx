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
  const [coverHovered, setCoverHovered] = useState(false);

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
    const s = await loadGameSessions(game.id);
    setSessions(s);
    if (s.length > 0) {
      const pm = await loadSessionParticipants(s.map((x) => x.id));
      setParticipantsMap(pm);
    }
    if (onSessionCreated) onSessionCreated();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT COLUMN — Cover + Expansions */}
        <div className="sm:w-[320px] md:w-[360px] shrink-0 bg-gray-50 p-5 sm:p-6 flex flex-col overflow-y-auto border-r border-gray-100">
          {/* Cover image with hover "+ registrar" */}
          <div
            className="relative flex items-center justify-center cursor-pointer group rounded-xl overflow-hidden"
            onMouseEnter={() => setCoverHovered(true)}
            onMouseLeave={() => setCoverHovered(false)}
            onClick={() => game.tipo === "Juego Base" && setShowLogForm(true)}
          >
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.nombre}
                className="max-h-56 sm:max-h-64 w-auto rounded-xl block transition-transform duration-300 group-hover:scale-105"
                style={{ filter: "drop-shadow(4px 6px 16px rgba(0,0,0,0.18))" }}
              />
            ) : (
              <div className="w-44 aspect-[3/4] bg-gray-200 rounded-xl flex items-center justify-center" style={{ boxShadow: "4px 6px 20px rgba(0,0,0,0.15)" }}>
                <span className="text-7xl opacity-20">🎲</span>
              </div>
            )}
            {/* Hover overlay */}
            {game.tipo === "Juego Base" && (
              <div className={`absolute inset-0 bg-black/40 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-opacity duration-200 ${coverHovered ? "opacity-100" : "opacity-0"}`}>
                <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                  <Plus size={24} className="text-orange-500" />
                </div>
                <span className="text-white text-xs font-semibold">Registrar partida</span>
              </div>
            )}
          </div>

          {/* Expansions below cover */}
          {expansions && expansions.length > 0 && (
            <div className="mt-5">
              <h4 className="text-[10px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wider">
                Expansiones ({expansions.length})
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {expansions.map((exp) => (
                  <div key={exp.id} className="bg-white rounded-lg p-2.5 flex flex-col items-center text-center shadow-sm border border-gray-100">
                    {exp.imageUrl ? (
                      <img src={exp.imageUrl} alt={exp.nombre} className="h-20 w-auto object-contain mb-1.5"
                        style={{ filter: "drop-shadow(2px 3px 3px rgba(0,0,0,0.15))" }} />
                    ) : (
                      <div className="h-20 w-14 bg-gray-100 rounded flex items-center justify-center mb-1.5"><span className="text-2xl opacity-20">🎲</span></div>
                    )}
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white mb-0.5 ${tipoBadge[exp.tipo]}`}>
                      {exp.tipo === "Ampliacion" ? "AMP" : "EXP"}
                    </span>
                    <p className="text-[10px] font-medium text-gray-700 leading-tight">{exp.nombre}</p>
                    <p className="text-[9px] text-gray-400">{exp.jugadoresDisplay}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — Details + History */}
        <div className="flex-1 p-5 sm:p-6 overflow-y-auto min-w-0">
          {/* Header with close & edit */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{game.nombre}</h2>
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
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {onEdit && (
                <button onClick={onEdit} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                  <Pencil size={16} />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
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
          <div className="mb-5">
            <h4 className="text-[10px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wider flex items-center gap-1">
              <User size={12} /> Owners
            </h4>
            <div className="flex flex-wrap gap-3">
              {game.owners.map((owner, i) => (
                <div key={i} className="group/owner relative flex flex-col items-center">
                  {avatarMap[owner] ? (
                    <img src={avatarMap[owner]} alt={owner}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-100 hover:border-orange-300 transition-colors shadow-sm" loading="eager" width={48} height={48} decoding="async" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-gray-200 text-base font-bold flex items-center justify-center text-gray-500">{owner.charAt(0)}</span>
                  )}
                  <span className="absolute -bottom-5 text-[10px] text-gray-500 opacity-0 group-hover/owner:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{owner}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session History */}
          {game.tipo === "Juego Base" && (
            <div>
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
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {sessions.slice(0, 10).map((s) => {
                    const parts = participantsMap[s.id] || [];
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
