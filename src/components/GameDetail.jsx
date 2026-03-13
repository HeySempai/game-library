import { useState, useEffect } from "react";
import { X, Users, Clock, Building2, User, Pencil, History, Plus, Calendar } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[960px] max-h-[85vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT — Cover + Expansions */}
        <div className="sm:w-[280px] md:w-[300px] shrink-0 p-6 flex flex-col items-center overflow-y-auto">
          {/* Cover */}
          <div
            className="relative cursor-pointer group"
            onMouseEnter={() => setCoverHovered(true)}
            onMouseLeave={() => setCoverHovered(false)}
            onClick={() => game.tipo === "Juego Base" && setShowLogForm(true)}
          >
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.nombre}
                className="max-h-52 w-auto block transition-all duration-300 group-hover:scale-[1.03]"
                style={{ filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.15))" }}
              />
            ) : (
              <div className="w-36 aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-6xl opacity-15">🎲</span>
              </div>
            )}
            {game.tipo === "Juego Base" && (
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${coverHovered ? "opacity-100" : "opacity-0"}`}>
                <div className="w-11 h-11 rounded-full bg-white/95 shadow-lg flex items-center justify-center backdrop-blur-sm">
                  <Plus size={20} className="text-orange-500" strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>

          {/* Owners inline */}
          <div className="flex items-center gap-[-4px] mt-5">
            {game.owners.map((owner, i) => (
              <div key={i} className="group/owner relative" style={{ marginLeft: i > 0 ? "-6px" : 0 }}>
                {avatarMap[owner] ? (
                  <img src={avatarMap[owner]} alt={owner}
                    className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" loading="eager" width={32} height={32} decoding="async" />
                ) : (
                  <span className="w-8 h-8 rounded-full bg-gray-200 text-xs font-bold flex items-center justify-center text-gray-400 border-2 border-white">{owner.charAt(0)}</span>
                )}
                <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover/owner:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">{owner}</span>
              </div>
            ))}
          </div>

          {/* Expansions */}
          {expansions && expansions.length > 0 && (
            <div className="mt-6 w-full">
              <p className="text-[9px] font-medium text-gray-300 uppercase tracking-widest mb-2">
                {expansions.length} expansion{expansions.length !== 1 ? "es" : ""}
              </p>
              <div className="space-y-1.5">
                {expansions.map((exp) => (
                  <div key={exp.id} className="flex items-center gap-2.5 py-1.5">
                    {exp.imageUrl ? (
                      <img src={exp.imageUrl} alt={exp.nombre} className="h-10 w-auto object-contain shrink-0"
                        style={{ filter: "drop-shadow(1px 2px 3px rgba(0,0,0,0.12))" }} />
                    ) : (
                      <div className="h-10 w-7 bg-gray-100 rounded shrink-0 flex items-center justify-center"><span className="text-sm opacity-20">🎲</span></div>
                    )}
                    <div className="min-w-0">
                      <p className="text-[11px] font-medium text-gray-700 leading-tight truncate">{exp.nombre}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[8px] font-bold px-1 py-px rounded text-white ${tipoBadge[exp.tipo]}`}>
                          {exp.tipo === "Ampliacion" ? "AMP" : "EXP"}
                        </span>
                        <span className="text-[9px] text-gray-300">{exp.jugadoresDisplay}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Details + History */}
        <div className="flex-1 border-l border-gray-100 p-6 overflow-y-auto min-w-0">
          {/* Top bar */}
          <div className="flex items-start justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 leading-tight">{game.nombre}</h2>
              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                {category && (
                  <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full text-white ${categoryColors[category]}`}>{category}</span>
                )}
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-400">
                  {VICTORY_LABELS[victoryType]}
                </span>
              </div>
              {parent && (
                <p className="text-xs text-gray-300 mt-2">Requiere <span className="text-orange-400 font-medium">{parent.nombre}</span></p>
              )}
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              {onEdit && (
                <button onClick={onEdit} className="p-2 rounded-full hover:bg-gray-50 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                  <Pencil size={15} />
                </button>
              )}
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-50 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Meta row — minimal, no cards */}
          <div className="flex items-center gap-6 text-sm text-gray-400 mb-6">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-orange-400" />
              <span className="text-gray-700 font-semibold">{game.jugadoresDisplay}</span>
              <span className="text-gray-300">jugadores</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-orange-400" />
              <span className="text-gray-700 font-semibold">{game.duracion}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-orange-400" />
              <span className="text-gray-500">{game.developer}</span>
            </span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-6" />

          {/* Session History */}
          {game.tipo === "Juego Base" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <History size={13} className="text-gray-300" />
                  Historial
                  <span className="text-gray-300 font-normal">({sessions.length})</span>
                </h4>
                <button onClick={() => setShowLogForm(true)}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 cursor-pointer font-medium transition-colors">
                  <Plus size={13} /> Registrar
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-300">Sin partidas registradas</p>
                  <button onClick={() => setShowLogForm(true)} className="text-xs text-orange-400 hover:text-orange-500 mt-2 cursor-pointer font-medium">
                    Registrar la primera
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {sessions.slice(0, 15).map((s) => {
                    const parts = participantsMap[s.id] || [];
                    return (
                      <div key={s.id} className="py-3 border-b border-gray-50 last:border-0">
                        <div className="flex items-center gap-3 text-[11px] text-gray-300 mb-1.5">
                          <span className="flex items-center gap-1"><Calendar size={10} /> {s.date}</span>
                          {s.duration_minutes && <span className="flex items-center gap-1"><Clock size={10} /> {s.duration_minutes}m</span>}
                        </div>
                        {s.victory_type === "cooperative" && s.cooperative_win !== null && (
                          <p className={`text-xs font-semibold mb-1.5 ${s.cooperative_win ? "text-emerald-500" : "text-red-400"}`}>
                            {s.cooperative_win ? "🎉 Victoria" : "💀 Derrota"}
                          </p>
                        )}
                        {parts.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {parts.sort((a, b) => (b.score ?? -Infinity) - (a.score ?? -Infinity)).map((p) => (
                              <span key={p.id} className={`text-[11px] px-2 py-0.5 rounded-full ${
                                p.is_winner ? "bg-amber-50 text-amber-600 font-medium" : "bg-gray-50 text-gray-400"
                              }`}>
                                {p.is_winner && "🏆 "}{p.player_name}{p.score !== null ? ` · ${p.score}` : ""}
                              </span>
                            ))}
                          </div>
                        )}
                        {s.notes && <p className="text-[10px] text-gray-300 italic mt-1.5">"{s.notes}"</p>}
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
