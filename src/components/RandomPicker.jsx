import { useState, useMemo } from "react";
import { X, Dices, Users, Clock, RotateCcw, Route, Package } from "lucide-react";
import { parseDuration } from "../utils/storage";
import { categoryMap, allCategories } from "../data/categories";
import { loadRngDisabled } from "./SettingsPanel";

const categoryColors = {
  "Party Game": { active: "bg-pink-500 text-white", inactive: "bg-pink-100 text-pink-600" },
  "Estrategia": { active: "bg-emerald-500 text-white", inactive: "bg-emerald-100 text-emerald-600" },
  "Deducción Social": { active: "bg-red-500 text-white", inactive: "bg-red-100 text-red-600" },
  "Cooperativo": { active: "bg-cyan-500 text-white", inactive: "bg-cyan-100 text-cyan-600" },
  "Aventura": { active: "bg-orange-500 text-white", inactive: "bg-orange-100 text-orange-600" },
  "Card Game": { active: "bg-indigo-500 text-white", inactive: "bg-indigo-100 text-indigo-600" },
};

const playerRanges = [
  { label: "1-2", min: 1, max: 2 },
  { label: "3-4", min: 3, max: 4 },
  { label: "5-6", min: 5, max: 6 },
  { label: "6+", min: 6, max: 99 },
];

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

function filterEligible(games, playerRange, activeCategories, rngDisabled) {
  const baseGames = games.filter((g) => g.tipo === "Juego Base");
  return baseGames.filter((game) => {
    if (rngDisabled.has(game.id)) return false;
    if (playerRange) {
      const effectiveMax = getEffectiveMax(game, games);
      const fitsRange = game.minJugadores <= playerRange.max && effectiveMax >= playerRange.min;
      if (!fitsRange) return false;
    }
    if (activeCategories.size > 0) {
      const cat = categoryMap[game.id];
      if (!cat || !activeCategories.has(cat)) return false;
    }
    return true;
  });
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

export default function RandomPicker({ games, onClose }) {
  const [playerRange, setPlayerRange] = useState(null);
  const [activeCategories, setActiveCategories] = useState(new Set());
  const [marathon, setMarathon] = useState(null);
  const rngDisabled = useMemo(() => loadRngDisabled(), []);

  const eligible = useMemo(
    () => filterEligible(games, playerRange, activeCategories, rngDisabled),
    [games, playerRange, activeCategories, rngDisabled]
  );

  const toggleCategory = (cat) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const togglePlayerRange = (range) => {
    setPlayerRange((prev) => (prev?.label === range.label ? null : range));
  };

  const generateMarathon = () => {
    if (eligible.length === 0) return;
    const TARGET_MIN = 240;
    const TARGET_MAX = 300;
    const route = [];
    let totalTime = 0;
    const pool = [...eligible];

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    const playerMax = playerRange?.max || 99;
    const playerMin = playerRange?.min || 1;

    for (const game of pool) {
      if (totalTime >= TARGET_MAX) break;
      const dur = parseDuration(game.duracion);
      const gameDur = dur.max || dur.min || 30;
      if (totalTime + gameDur > TARGET_MAX + 60) continue;

      // Get all expansions for this game
      const allExpansions = getAllExpansions(game, games);
      const ampliaciones = allExpansions.filter((e) => e.tipo === "Ampliacion");
      const expansiones = allExpansions.filter((e) => e.tipo === "Expansion");

      // Check if ampliaciones are required for player count
      const needsAmpliacion = game.maxJugadores < playerMin;
      const requiredAmps = needsAmpliacion
        ? ampliaciones.filter((a) => a.maxJugadores && a.maxJugadores >= playerMin)
        : [];

      // If we need an ampliacion but none fits, skip this game
      if (needsAmpliacion && requiredAmps.length === 0) continue;

      // Pick required ampliacion (random from qualifying ones)
      const selectedAmps = needsAmpliacion
        ? [requiredAmps[Math.floor(Math.random() * requiredAmps.length)]]
        : ampliaciones.length > 0 && Math.random() > 0.6
          ? [ampliaciones[Math.floor(Math.random() * ampliaciones.length)]]
          : [];

      // Randomly include some expansions (50% chance each)
      const selectedExps = expansiones.filter(() => Math.random() > 0.5);

      const selectedAddons = [...selectedAmps, ...selectedExps];

      route.push({ game, expansions: selectedAddons, duration: gameDur });
      totalTime += gameDur;
      if (totalTime >= TARGET_MIN) break;
    }

    // If still short, add more from remaining pool
    if (totalTime < TARGET_MIN) {
      for (const game of pool) {
        if (totalTime >= TARGET_MIN) break;
        if (route.some((r) => r.game.id === game.id)) continue;
        const dur = parseDuration(game.duracion);
        const gameDur = dur.max || dur.min || 30;

        const allExpansions = getAllExpansions(game, games);
        const ampliaciones = allExpansions.filter((e) => e.tipo === "Ampliacion");
        const expansiones = allExpansions.filter((e) => e.tipo === "Expansion");
        const needsAmpliacion = game.maxJugadores < playerMin;
        const requiredAmps = needsAmpliacion
          ? ampliaciones.filter((a) => a.maxJugadores && a.maxJugadores >= playerMin)
          : [];
        if (needsAmpliacion && requiredAmps.length === 0) continue;

        const selectedAmps = needsAmpliacion
          ? [requiredAmps[Math.floor(Math.random() * requiredAmps.length)]]
          : [];
        const selectedExps = expansiones.filter(() => Math.random() > 0.5);

        route.push({ game, expansions: [...selectedAmps, ...selectedExps], duration: gameDur });
        totalTime += gameDur;
      }
    }

    setMarathon({ route, totalTime });
  };

  const renderFilters = () => (
    <div className="space-y-3">
      <div>
        <label className="text-xs text-gray-400 flex items-center gap-1 mb-2 uppercase tracking-wide">
          <Users size={12} /> Jugadores
        </label>
        <div className="flex gap-2">
          {playerRanges.map((r) => (
            <button
              key={r.label}
              onClick={() => togglePlayerRange(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                playerRange?.label === r.label
                  ? "bg-orange-500 text-white"
                  : "bg-gray-100 text-gray-500 hover:bg-gray-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs text-gray-400 mb-2 uppercase tracking-wide block">Categoría</label>
        <div className="flex flex-wrap gap-1.5">
          {allCategories.map((cat) => {
            const colors = categoryColors[cat];
            const isActive = activeCategories.has(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-2.5 py-1 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                  isActive ? colors.active : colors.inactive
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-gray-400 text-center">
        {eligible.length} juego{eligible.length !== 1 ? "s" : ""} disponible{eligible.length !== 1 ? "s" : ""}
      </p>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Route size={20} className="text-orange-500" /> Maratón
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {renderFilters()}

          {!marathon ? (
            <button
              onClick={generateMarathon}
              disabled={eligible.length === 0}
              className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Route size={18} /> Generar Maratón
            </button>
          ) : (
            <>
              {/* Marathon route */}
              <div className="space-y-3">
                {marathon.route.map((entry, idx) => {
                  const runningTotal = marathon.route
                    .slice(0, idx + 1)
                    .reduce((sum, e) => sum + e.duration, 0);
                  const category = categoryMap[entry.game.id];
                  return (
                    <div
                      key={entry.game.id}
                      className="bg-gray-50 rounded-xl p-3 border border-gray-100"
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
                              {entry.game.duracion}
                            </span>
                          </div>
                          {category && (
                            <span
                              className={`inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${
                                categoryColors[category]?.active.split(" ")[0] || "bg-gray-400"
                              }`}
                            >
                              {category}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 shrink-0 text-right">
                          {runningTotal} min
                        </span>
                      </div>

                      {/* Expansions row */}
                      {entry.expansions.length > 0 && (
                        <div className="mt-2 ml-9 flex items-center gap-2">
                          <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0">
                            Expansiones:
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

              {/* Regenerate */}
              <button
                onClick={generateMarathon}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw size={18} /> Regenerar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
