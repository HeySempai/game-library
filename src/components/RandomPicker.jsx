import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { X, Dices, Users, Clock, RotateCcw, Route, Package, ArrowLeft } from "lucide-react";
import { parseDuration } from "../utils/storage";
import { categoryMap, allCategories } from "../data/categories";
import { loadRngDisabled } from "./SettingsPanel";
import { playClick, playTick, playSuccess, playPop } from "../utils/sounds";

const categoryColors = {
  "Party Game": { bg: "bg-pink-500", inactive: "bg-gray-200 text-gray-400", active: "bg-pink-500 text-white" },
  "Estrategia": { bg: "bg-emerald-500", inactive: "bg-gray-200 text-gray-400", active: "bg-emerald-500 text-white" },
  "Deducción Social": { bg: "bg-red-500", inactive: "bg-gray-200 text-gray-400", active: "bg-red-500 text-white" },
  "Cooperativo": { bg: "bg-cyan-500", inactive: "bg-gray-200 text-gray-400", active: "bg-cyan-500 text-white" },
  "Aventura": { bg: "bg-orange-500", inactive: "bg-gray-200 text-gray-400", active: "bg-orange-500 text-white" },
  "Card Game": { bg: "bg-indigo-500", inactive: "bg-gray-200 text-gray-400", active: "bg-indigo-500 text-white" },
};

const CONFETTI_COLORS = [
  "#ec4899", "#10b981", "#ef4444", "#06b6d4", "#f97316", "#6366f1",
  "#facc15", "#a855f7", "#f43f5e", "#14b8a6",
];

const playerOptions = [2, 3, 4, 5, 6, "7+"];

function getAllExpansions(game, allGames) {
  return allGames.filter((g) => g.parentId === game.id);
}

function getEffectiveMax(game, allGames) {
  const amps = allGames.filter((g) => g.parentId === game.id && g.tipo === "Ampliacion");
  let max = game.maxJugadores;
  amps.forEach((a) => {
    if (a.maxJugadores && a.maxJugadores > max) max = a.maxJugadores;
  });
  return max;
}

function filterEligible(games, playerCount, activeCategories, rngDisabled) {
  const baseGames = games.filter((g) => g.tipo === "Juego Base");
  return baseGames.filter((game) => {
    if (rngDisabled.has(game.id)) return false;
    if (playerCount) {
      const effectiveMax = getEffectiveMax(game, games);
      if (playerCount >= 7) {
        if (effectiveMax < 7) return false;
      } else {
        if (game.minJugadores > playerCount || effectiveMax < playerCount) return false;
      }
    }
    if (activeCategories.size > 0) {
      const cat = categoryMap[game.id];
      if (!cat || !activeCategories.has(cat)) return false;
    }
    return true;
  });
}

function ConfettiParticles() {
  const particles = useRef(
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 1.5,
      duration: 1.5 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      isSquare: Math.random() > 0.5,
      rotation: Math.random() * 360,
    }))
  ).current;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            left: `${p.left}%`,
            top: "-20px",
            width: `${p.size}px`,
            height: p.isSquare ? `${p.size}px` : `${p.size * 0.6}px`,
            backgroundColor: p.color,
            borderRadius: p.isSquare ? "2px" : "50%",
            transform: `rotate(${p.rotation}deg)`,
            animation: `confettiFall ${p.duration}s ${p.delay}s ease-in both`,
            opacity: 0,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg); }
          100% { opacity: 0; transform: translateY(90vh) rotate(720deg); }
        }
      `}</style>
    </div>
  );
}

function GameCover({ game, size = "lg" }) {
  const dims = size === "lg" ? "w-20 h-24" : "w-10 h-12";
  const radius = size === "lg" ? "rounded-lg" : "rounded-md";
  return game.imageUrl ? (
    <img src={game.imageUrl} alt={game.nombre} className={`${dims} ${radius} object-contain bg-gray-100 shrink-0`} />
  ) : (
    <div className={`${dims} ${radius} bg-gray-200 flex items-center justify-center shrink-0`}>
      <Dices size={size === "lg" ? 20 : 12} className="text-gray-400" />
    </div>
  );
}

function buildMarathon(eligible, games, playerCount) {
  const TARGET_MIN = 240;
  const TARGET_MAX = 300;
  const route = [];
  let totalTime = 0;
  const pool = [...eligible];

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const playerMin = playerCount || 1;

  const pickExpansions = (game) => {
    const allExp = getAllExpansions(game, games);
    const ampliaciones = allExp.filter((e) => e.tipo === "Ampliacion");
    const expansiones = allExp.filter((e) => e.tipo === "Expansion");

    const needsAmpliacion = game.maxJugadores < playerMin;
    const requiredAmps = needsAmpliacion
      ? ampliaciones.filter((a) => a.maxJugadores && a.maxJugadores >= playerMin)
      : [];

    if (needsAmpliacion && requiredAmps.length === 0) return null;

    const selectedAmps = needsAmpliacion
      ? [requiredAmps[Math.floor(Math.random() * requiredAmps.length)]]
      : ampliaciones.length > 0 && Math.random() > 0.6
        ? [ampliaciones[Math.floor(Math.random() * ampliaciones.length)]]
        : [];

    const selectedExps = expansiones.filter(() => Math.random() > 0.5);
    return [...selectedAmps, ...selectedExps];
  };

  for (const game of pool) {
    if (totalTime >= TARGET_MAX) break;
    const dur = parseDuration(game.duracion);
    const gameDur = dur.max || dur.min || 30;
    if (totalTime + gameDur > TARGET_MAX + 60) continue;

    const exps = pickExpansions(game);
    if (exps === null) continue;

    route.push({ game, expansions: exps, duration: gameDur });
    totalTime += gameDur;
    if (totalTime >= TARGET_MIN) break;
  }

  if (totalTime < TARGET_MIN) {
    for (const game of pool) {
      if (totalTime >= TARGET_MIN) break;
      if (route.some((r) => r.game.id === game.id)) continue;
      const dur = parseDuration(game.duracion);
      const gameDur = dur.max || dur.min || 30;
      const exps = pickExpansions(game);
      if (exps === null) continue;
      route.push({ game, expansions: exps, duration: gameDur });
      totalTime += gameDur;
    }
  }

  return { route, totalTime };
}

export default function RandomPicker({ games, onClose }) {
  // Steps: 1=players, 2=categories, 3=spinning, 4=results
  const [step, setStep] = useState(1);
  const [playerCount, setPlayerCount] = useState(null);
  const [deactivated, setDeactivated] = useState(new Set());
  const [spinning, setSpinning] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [marathon, setMarathon] = useState(null);
  const spinIntervalRef = useRef(null);
  const rngDisabled = useMemo(() => loadRngDisabled(), []);

  const activeCategories = useMemo(
    () => new Set(allCategories.filter((cat) => !deactivated.has(cat))),
    [deactivated]
  );

  const eligible = useMemo(
    () => filterEligible(games, playerCount, activeCategories, rngDisabled),
    [games, playerCount, activeCategories, rngDisabled]
  );

  const toggleCategory = (cat) => {
    playClick();
    setDeactivated((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const selectPlayerCount = (count) => {
    playClick();
    setPlayerCount(count);
    setStep(2);
  };

  const goBack = () => {
    if (step === 2) {
      setStep(1);
      setPlayerCount(null);
      setDeactivated(new Set());
    }
  };

  const resetAll = () => {
    setStep(1);
    setPlayerCount(null);
    setDeactivated(new Set());
    setSpinning(false);
    setCurrentName("");
    setMarathon(null);
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
  };

  const startGeneration = useCallback(() => {
    if (eligible.length === 0) return;
    setStep(3);
    setSpinning(true);
    setMarathon(null);

    let count = 0;
    const totalTicks = 30;

    spinIntervalRef.current = setInterval(() => {
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      setCurrentName(pick.nombre);
      playTick();
      count++;

      if (count >= totalTicks) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;

        const result = buildMarathon(eligible, games, playerCount);
        setMarathon(result);
        setSpinning(false);
        setStep(4);
        playSuccess();
        setTimeout(() => playPop(), 450);
      }
    }, 80);
  }, [eligible, games, playerCount]);

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const headerTitle = {
    1: "¿Cuántos jugadores?",
    2: "¿Qué tipo de juegos?",
    3: "Armando maratón...",
    4: "🎉 ¡Tu Maratón!",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {step === 4 && <ConfettiParticles />}

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0 relative z-10">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button onClick={goBack} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Route size={20} className="text-orange-500" />
              {headerTitle[step]}
            </h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto relative z-10">
          {/* Step 1 — Player count */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {playerOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => selectPlayerCount(typeof count === "number" ? count : 7)}
                  className="w-full h-20 rounded-xl bg-gray-50 hover:bg-orange-50 border-2 border-gray-100 hover:border-orange-300 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span className="text-3xl font-bold text-gray-700">{count}</span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 — Categories (toggle OFF) */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-xs text-gray-400 text-center">
                Toca una categoría para desactivarla
              </p>
              <div className="grid grid-cols-2 gap-3">
                {allCategories.map((cat) => {
                  const isActive = !deactivated.has(cat);
                  const colors = categoryColors[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`w-full h-20 rounded-xl transition-all flex items-center justify-center cursor-pointer text-sm font-bold ${
                        isActive ? `${colors.bg} text-white shadow-md` : colors.inactive
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-400 text-center">
                {eligible.length} juego{eligible.length !== 1 ? "s" : ""} disponible{eligible.length !== 1 ? "s" : ""}
              </p>

              <button
                onClick={startGeneration}
                disabled={eligible.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-lg"
              >
                <Route size={20} /> ¡Generar Maratón!
              </button>
            </div>
          )}

          {/* Step 3 — Spinning animation */}
          {step === 3 && spinning && (
            <div className="py-16 text-center">
              <Route size={40} className="text-orange-500 mx-auto mb-4 animate-pulse" />
              <p className="text-2xl font-bold text-gray-700 animate-pulse truncate px-4">
                {currentName}
              </p>
              <p className="text-sm text-gray-400 mt-2">Eligiendo juegos...</p>
            </div>
          )}

          {/* Step 4 — Results */}
          {step === 4 && marathon && (
            <>
              <div className="space-y-3">
                {marathon.route.map((entry, idx) => {
                  const category = categoryMap[entry.game.id];
                  return (
                    <div
                      key={entry.game.id}
                      className="bg-gray-50 rounded-xl p-3 border border-gray-100 animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s`, animationFillMode: "both" }}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-bold text-orange-400 w-6 text-center shrink-0">
                          {idx + 1}
                        </span>
                        <GameCover game={entry.game} size="lg" />
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 truncate">{entry.game.nombre}</p>
                          <div className="flex items-center gap-3 mt-0.5 text-xs text-gray-400">
                            <span className="flex items-center gap-1">
                              <Users size={12} />
                              {entry.game.jugadoresDisplay}
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock size={12} />
                              ~{entry.duration} min
                            </span>
                          </div>
                          {category && (
                            <span
                              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
                                categoryColors[category]?.bg || "bg-gray-400"
                              }`}
                            >
                              {category}
                            </span>
                          )}
                        </div>
                      </div>

                      {entry.expansions.length > 0 && (
                        <div className="mt-2 ml-9 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0 flex items-center gap-1">
                            <Package size={10} /> Incluye:
                          </span>
                          <div className="flex gap-1.5 overflow-x-auto">
                            {entry.expansions.map((exp) => (
                              <div key={exp.id} className="flex flex-col items-center gap-0.5 shrink-0">
                                <GameCover game={exp} size="sm" />
                                <span className="text-[9px] text-gray-400 max-w-[48px] truncate text-center">
                                  {exp.nombre}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Total */}
              <div className="flex items-center justify-between bg-orange-50 rounded-xl px-4 py-3">
                <span className="text-sm font-semibold text-orange-700">Tiempo total estimado</span>
                <span className="text-lg font-bold text-orange-600">
                  {Math.floor(marathon.totalTime / 60)}h {marathon.totalTime % 60}min
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setMarathon(null);
                    startGeneration();
                  }}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <RotateCcw size={18} /> Regenerar
                </button>
                <button
                  onClick={resetAll}
                  className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Route size={18} /> Nuevo
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
