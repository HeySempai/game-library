import { useState, useEffect, useRef } from "react";
import { X, Users, Clock, Building2, Pencil, History, Plus, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
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

function ExpansionCarousel({ expansions, tipoBadge, onExpansionClick }) {
  const [currentIdx, setCurrentIdx] = useState(0);

  if (!expansions || expansions.length === 0) return null;

  const goNext = () => setCurrentIdx((prev) => (prev + 1) % expansions.length);
  const goPrev = () => setCurrentIdx((prev) => (prev - 1 + expansions.length) % expansions.length);
  const exp = expansions[currentIdx];

  return (
    <div className="mt-6 w-full">
      <p className="text-[9px] font-medium text-gray-300 uppercase tracking-widest mb-3">
        {expansions.length} expansion{expansions.length !== 1 ? "es" : ""}
      </p>
      <div className="flex items-center gap-2">
        {/* Left arrow */}
        {expansions.length > 1 && (
          <button onClick={goPrev} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
            <ChevronLeft size={16} />
          </button>
        )}

        {/* Expansion card — clickable */}
        <button
          onClick={() => onExpansionClick(exp)}
          className="flex-1 flex items-center gap-3 py-2.5 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left group min-w-0"
        >
          {exp.imageUrl ? (
            <img src={exp.imageUrl} alt={exp.nombre} className="h-20 w-auto object-contain shrink-0 transition-transform duration-200 group-hover:scale-105"
              style={{ filter: "drop-shadow(2px 4px 6px rgba(0,0,0,0.15))" }} />
          ) : (
            <div className="h-20 w-14 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center"><span className="text-2xl opacity-15">🎲</span></div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded text-white ${tipoBadge[exp.tipo]}`}>
                {exp.tipo === "Ampliacion" ? "AMP" : "EXP"}
              </span>
              <span className="text-[9px] text-gray-300">{exp.jugadoresDisplay}</span>
            </div>
            <p className="text-xs font-medium text-gray-700 leading-snug">{exp.nombre}</p>
            {exp.tipo === "Ampliacion" && (
              <p className="text-[9px] text-orange-400 mt-1 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Plus size={9} /> Registrar partida
              </p>
            )}
          </div>
        </button>

        {/* Right arrow */}
        {expansions.length > 1 && (
          <button onClick={goNext} className="shrink-0 p-1 rounded-full hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer">
            <ChevronRight size={16} />
          </button>
        )}
      </div>
      {/* Dots */}
      {expansions.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mt-2">
          {expansions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIdx(i)}
              className={`w-1.5 h-1.5 rounded-full transition-colors cursor-pointer ${i === currentIdx ? "bg-gray-400" : "bg-gray-200"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function GameDetail({ game, expansions, allGames, category, onClose, onEdit, gameConfig, players, onSessionCreated }) {
  if (!game) return null;

  const [sessions, setSessions] = useState([]);
  const [participantsMap, setParticipantsMap] = useState({});
  const [showLogForm, setShowLogForm] = useState(false);
  const [logFormExpansion, setLogFormExpansion] = useState(null);
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
    setLogFormExpansion(null);
    const s = await loadGameSessions(game.id);
    setSessions(s);
    if (s.length > 0) {
      const pm = await loadSessionParticipants(s.map((x) => x.id));
      setParticipantsMap(pm);
    }
    if (onSessionCreated) onSessionCreated();
  };

  const openLogBase = () => {
    setLogFormExpansion(null);
    setShowLogForm(true);
  };

  const openLogWithExpansion = (exp) => {
    if (exp.tipo === "Ampliacion") {
      setLogFormExpansion(exp);
      setShowLogForm(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/25 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[1000px] max-h-[85vh] overflow-hidden shadow-2xl flex flex-col sm:flex-row"
        onClick={(e) => e.stopPropagation()}
      >
        {/* LEFT — Cover + Expansions Carousel */}
        <div className="sm:w-[340px] md:w-[380px] shrink-0 p-6 sm:p-8 flex flex-col items-center overflow-y-auto">
          {/* Cover — large with box shadow */}
          <div
            className="relative cursor-pointer group"
            onMouseEnter={() => setCoverHovered(true)}
            onMouseLeave={() => setCoverHovered(false)}
            onClick={openLogBase}
          >
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.nombre}
                className="max-h-72 md:max-h-80 w-auto block transition-all duration-300 group-hover:scale-[1.02] group-hover:-translate-y-1"
                style={{
                  filter: coverHovered
                    ? "drop-shadow(0 20px 30px rgba(0,0,0,0.3)) drop-shadow(0 8px 10px rgba(0,0,0,0.15))"
                    : "drop-shadow(0 12px 20px rgba(0,0,0,0.2)) drop-shadow(0 4px 6px rgba(0,0,0,0.1))",
                  transition: "filter 0.3s, transform 0.3s",
                }}
              />
            ) : (
              <div className="w-44 aspect-[3/4] bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-7xl opacity-10">🎲</span>
              </div>
            )}
            {/* Hover overlay */}
            {game.tipo === "Juego Base" && (
              <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${coverHovered ? "opacity-100" : "opacity-0"}`}>
                <div className="w-12 h-12 rounded-full bg-white/90 shadow-lg flex items-center justify-center backdrop-blur-sm transition-transform duration-200 group-hover:scale-110">
                  <Plus size={22} className="text-orange-500" strokeWidth={2.5} />
                </div>
              </div>
            )}
          </div>

          {/* Expansion carousel */}
          <ExpansionCarousel
            expansions={expansions}
            tipoBadge={tipoBadge}
            onExpansionClick={openLogWithExpansion}
          />
        </div>

        {/* RIGHT — Details + History */}
        <div className="flex-1 border-l border-gray-100 p-6 sm:p-8 overflow-y-auto min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-5">
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

          {/* Meta — compact inline */}
          <div className="flex items-center gap-5 text-sm text-gray-400 mb-4">
            <span className="flex items-center gap-1.5">
              <Users size={14} className="text-orange-400" />
              <span className="text-gray-700 font-semibold">{game.jugadoresDisplay}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Clock size={14} className="text-orange-400" />
              <span className="text-gray-700 font-semibold">{game.duracion}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Building2 size={14} className="text-orange-400" />
              <span className="text-gray-500 text-xs">{game.developer}</span>
            </span>
          </div>

          {/* Owners */}
          <div className="flex items-center gap-2 mb-6">
            <div className="flex items-center">
              {game.owners.map((owner, i) => (
                <div key={i} className="group/owner relative" style={{ marginLeft: i > 0 ? "-8px" : 0 }}>
                  {avatarMap[owner] ? (
                    <img src={avatarMap[owner]} alt={owner}
                      className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm hover:z-10 hover:scale-110 transition-transform" loading="eager" width={36} height={36} decoding="async" />
                  ) : (
                    <span className="w-9 h-9 rounded-full bg-gray-200 text-xs font-bold flex items-center justify-center text-gray-400 border-2 border-white">{owner.charAt(0)}</span>
                  )}
                  <span className="absolute -bottom-5 left-1/2 -translate-x-1/2 text-[9px] text-gray-400 opacity-0 group-hover/owner:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20">{owner}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-100 mb-5" />

          {/* Session History */}
          {game.tipo === "Juego Base" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xs font-semibold text-gray-900 flex items-center gap-1.5">
                  <History size={13} className="text-gray-300" />
                  Historial
                  <span className="text-gray-300 font-normal">({sessions.length})</span>
                </h4>
                <button onClick={openLogBase}
                  className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 cursor-pointer font-medium transition-colors">
                  <Plus size={13} /> Registrar
                </button>
              </div>

              {sessions.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-gray-300">Sin partidas registradas</p>
                  <button onClick={openLogBase} className="text-xs text-orange-400 hover:text-orange-500 mt-2 cursor-pointer font-medium">
                    Registrar la primera
                  </button>
                </div>
              ) : (
                <div className="space-y-0 max-h-80 overflow-y-auto pr-1">
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
          onClose={() => { setShowLogForm(false); setLogFormExpansion(null); }}
          selectedExpansion={logFormExpansion}
        />
      )}
    </div>
  );
}
