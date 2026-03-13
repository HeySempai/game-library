import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowLeft, Dices, Users, Clock, RotateCcw } from "lucide-react";
import { categoryMap, allCategories } from "../data/categories";
import { playClick, playTick, playSuccess, playPop } from "../utils/sounds";
import { loadRngDisabled } from "./SettingsPanel";

const categoryColors = {
  "Party Game": { bg: "bg-pink-500", inactive: "bg-gray-200 text-gray-400" },
  "Estrategia": { bg: "bg-emerald-500", inactive: "bg-gray-200 text-gray-400" },
  "Deducción Social": { bg: "bg-red-500", inactive: "bg-gray-200 text-gray-400" },
  "Cooperativo": { bg: "bg-cyan-500", inactive: "bg-gray-200 text-gray-400" },
  "Aventura": { bg: "bg-orange-500", inactive: "bg-gray-200 text-gray-400" },
  "Card Game": { bg: "bg-indigo-500", inactive: "bg-gray-200 text-gray-400" },
};

const CONFETTI_COLORS = [
  "#ec4899", "#10b981", "#ef4444", "#06b6d4", "#f97316", "#6366f1",
  "#facc15", "#a855f7", "#f43f5e", "#14b8a6",
];

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
    // Player count filter
    const effectiveMax = getEffectiveMax(game, games);
    if (playerCount >= 7) {
      // "7+" means min 7
      if (effectiveMax < 7) return false;
    } else {
      if (game.minJugadores > playerCount || effectiveMax < playerCount) return false;
    }
    // Category filter - activeCategories = the ones the user wants
    if (activeCategories.size > 0) {
      const cat = categoryMap[game.id];
      if (!cat || !activeCategories.has(cat)) return false;
    }
    return true;
  });
}

function ConfettiParticles() {
  const particles = useRef(
    Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 2,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 6 + Math.random() * 8,
      isSquare: Math.random() > 0.5,
      rotation: Math.random() * 360,
      swayAmount: -30 + Math.random() * 60,
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
          0% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
          100% {
            opacity: 0;
            transform: translateY(calc(90vh)) rotate(720deg);
          }
        }
      `}</style>
    </div>
  );
}

export default function QuickPicker({ games, onClose }) {
  const [step, setStep] = useState(1);
  const [playerCount, setPlayerCount] = useState(null);
  // All categories start active - deactivating removes them
  const [deactivated, setDeactivated] = useState(new Set());
  const [spinning, setSpinning] = useState(false);
  const [currentName, setCurrentName] = useState("");
  const [result, setResult] = useState(null);
  const spinIntervalRef = useRef(null);

  const activeCategories = new Set(
    allCategories.filter((cat) => !deactivated.has(cat))
  );

  const eligible = filterEligible(games, playerCount, activeCategories);

  const toggleCategory = (cat) => {
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
    setResult(null);
    if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
  };

  const startSpin = useCallback(() => {
    if (eligible.length === 0) return;
    setStep(3);
    setSpinning(true);
    setResult(null);

    let count = 0;
    const totalTicks = 25;

    spinIntervalRef.current = setInterval(() => {
      const pick = eligible[Math.floor(Math.random() * eligible.length)];
      setCurrentName(pick.nombre);
      playTick();
      count++;

      if (count >= totalTicks) {
        clearInterval(spinIntervalRef.current);
        spinIntervalRef.current = null;
        const finalPick = eligible[Math.floor(Math.random() * eligible.length)];
        setCurrentName(finalPick.nombre);
        setResult(finalPick);
        setSpinning(false);
        playSuccess();
        setTimeout(() => playPop(), 450);
      }
    }, 80);
  }, [eligible]);

  const reroll = () => {
    setResult(null);
    setCurrentName("");
    startSpin();
  };

  useEffect(() => {
    return () => {
      if (spinIntervalRef.current) clearInterval(spinIntervalRef.current);
    };
  }, []);

  const playerOptions = [2, 3, 4, 5, 6, "7+"];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                onClick={goBack}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
              >
                <ArrowLeft size={20} />
              </button>
            )}
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Dices size={20} className="text-orange-500" />
              {step === 1 && "¿Cuántos jugadores?"}
              {step === 2 && "¿Qué tipo de juego?"}
              {step === 3 && (spinning ? "Eligiendo..." : "¡A jugar!")}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {/* Step 1 - Player count */}
          {step === 1 && (
            <div className="grid grid-cols-2 gap-3">
              {playerOptions.map((count) => (
                <button
                  key={count}
                  onClick={() => selectPlayerCount(typeof count === "number" ? count : 7)}
                  className="w-full h-20 rounded-xl bg-gray-50 hover:bg-orange-50 border-2 border-gray-100 hover:border-orange-300 transition-all flex items-center justify-center cursor-pointer"
                >
                  <span className="text-3xl font-bold text-gray-700">
                    {count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Step 2 - Categories */}
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
                        isActive
                          ? `${colors.bg} text-white shadow-md`
                          : `${colors.inactive}`
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
                onClick={startSpin}
                disabled={eligible.length === 0}
                className="w-full bg-orange-600 hover:bg-orange-500 disabled:bg-gray-200 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed text-lg"
              >
                <Dices size={20} /> ¡Generar!
              </button>
            </div>
          )}

          {/* Step 3 - Spinning & Result */}
          {step === 3 && (
            <div className="text-center space-y-5">
              {spinning && (
                <div className="py-8">
                  <p className="text-2xl font-bold text-gray-700 animate-pulse truncate px-4">
                    {currentName}
                  </p>
                </div>
              )}

              {result && !spinning && (
                <>
                  <ConfettiParticles />
                  <div className="flex flex-col items-center gap-4 py-4 relative z-10">
                    {result.imageUrl ? (
                      <img
                        src={result.imageUrl}
                        alt={result.nombre}
                        className="w-36 h-44 rounded-xl object-contain bg-gray-100 shadow-lg"
                      />
                    ) : (
                      <div className="w-36 h-44 rounded-xl bg-gray-200 flex items-center justify-center shadow-lg">
                        <Dices size={40} className="text-gray-400" />
                      </div>
                    )}

                    <div>
                      <p className="text-2xl font-bold text-gray-900">{result.nombre}</p>
                      <div className="flex items-center justify-center gap-4 mt-2 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Users size={14} />
                          {result.jugadoresDisplay}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {result.duracion}
                        </span>
                      </div>
                      {result.developer && (
                        <p className="text-xs text-gray-400 mt-1">{result.developer}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 relative z-10">
                    <button
                      onClick={reroll}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <RotateCcw size={18} /> Volver a tirar
                    </button>
                    <button
                      onClick={resetAll}
                      className="flex-1 bg-orange-600 hover:bg-orange-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Dices size={18} /> Nuevo
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
