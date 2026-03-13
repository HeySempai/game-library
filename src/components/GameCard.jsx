import { useRef, useState, useCallback } from "react";
import { Users, Clock } from "lucide-react";
import { ownersData } from "../data/owners";

const avatarMap = {};
ownersData.forEach((o) => {
  avatarMap[o.nombre] = o.avatar;
});

const categoryColors = {
  "Party Game": "bg-pink-500",
  "Estrategia": "bg-emerald-500",
  "Deducción Social": "bg-red-500",
  "Cooperativo": "bg-cyan-500",
  "Aventura": "bg-orange-500",
  "Card Game": "bg-indigo-500",
};

export default function GameCard({ game, allGames, expansions, category, onClick }) {
  const expCount = expansions?.length || 0;
  const cardRef = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  }, []);

  const ampliaciones = allGames.filter(
    (g) => g.parentId === game.id && g.tipo === "Ampliacion"
  );
  let extendedMax = game.maxJugadores;
  ampliaciones.forEach((a) => {
    if (a.maxJugadores && a.maxJugadores > extendedMax) {
      extendedMax = a.maxJugadores;
    }
  });
  const hasExtendedPlayers = extendedMax > game.maxJugadores;

  return (
    <button
      onClick={onClick}
      className="group text-left w-full cursor-pointer transition-all duration-300 hover:-translate-y-1"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="relative rounded-xl sm:rounded-2xl p-[1.5px] overflow-hidden transition-all duration-300"
        style={{
          background: isHovered ? undefined : '#ffffff',
          boxShadow: isHovered ? '0 0 12px 2px rgba(255,140,0,0.2), 0 0 4px 1px rgba(255,180,80,0.15)' : 'none',
        }}
      >
        {/* Animated rotating gradient border */}
        <div
          className="absolute inset-[-50%] transition-opacity duration-300 pointer-events-none blur-[3px]"
          style={{
            opacity: isHovered ? 1 : 0,
            background: 'conic-gradient(from 0deg, #ff8c00, #fff4e0, #ff6b00, #ffffff, #ffaa33, #fff8ee, #ff5500, #ffe0b2, #ff8c00)',
            animation: isHovered ? 'spin-border 5s linear infinite' : 'none',
          }}
        />

        {/* Spotlight radial glow on border */}
        <div
          className="absolute inset-0 rounded-xl sm:rounded-2xl transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: isHovered ? 1 : 0,
            background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.95), rgba(255,150,40,0.6) 35%, transparent 65%)`,
          }}
        />

        {/* Inner card */}
        <div className="relative bg-white rounded-[9px] sm:rounded-[13px] p-3 sm:p-4 pb-3 sm:pb-4 transition-colors duration-300 overflow-hidden">
          {/* Subtle inner spotlight */}
          <div
            className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: isHovered ? 1 : 0,
              background: `radial-gradient(250px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,140,0,0.05), transparent 60%)`,
            }}
          />

          {/* Image container */}
          <div className="relative aspect-[4/3] flex items-center justify-center">
            {game.imageUrl ? (
              <img
                src={game.imageUrl}
                alt={game.nombre}
                className="max-w-full max-h-full object-contain transition-[filter] duration-300 group-hover:[filter:drop-shadow(8px_14px_14px_rgba(0,0,0,0.45))_drop-shadow(3px_6px_8px_rgba(0,0,0,0.3))]"
                style={{
                  filter: "drop-shadow(4px 6px 6px rgba(0,0,0,0.25)) drop-shadow(1px 2px 3px rgba(0,0,0,0.15))",
                }}
              />
            ) : (
              <span className="text-6xl opacity-20">🎲</span>
            )}
            {expCount > 0 && (
              <span className="absolute bottom-1 right-1 w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full bg-orange-500 text-white shadow-sm">
                +{expCount}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="relative pt-3">
            <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
              {game.tipo !== "Juego Base" && (
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${game.tipo === "Ampliacion" ? "bg-amber-500" : "bg-sky-500"}`}>
                  {game.tipo === "Ampliacion" ? "AMP" : "EXP"}
                </span>
              )}
              {category && (
                <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${categoryColors[category]}`}>
                  {category}
                </span>
              )}
            </div>
            <h3 className="font-semibold text-xs sm:text-sm text-gray-900 truncate leading-snug">
              {game.nombre}
            </h3>
            <p className="text-xs text-gray-400 mt-0.5 truncate">{game.developer}</p>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Users size={11} />
                {hasExtendedPlayers ? (
                  <>
                    {game.jugadoresDisplay}
                    <span className="text-amber-500 font-semibold">→{extendedMax}</span>
                  </>
                ) : (
                  game.jugadoresDisplay
                )}
              </span>
              <span className="flex items-center gap-1">
                <Clock size={11} />
                {game.duracion}
              </span>
            </div>
            <div className="flex items-center gap-1 mt-2">
              {game.owners.map((owner, i) => (
                <div key={i} className="group/avatar relative">
                  {avatarMap[owner] ? (
                    <img
                      src={avatarMap[owner]}
                      alt={owner}
                      className="w-5 h-5 rounded-full object-cover border border-gray-200"
                    />
                  ) : (
                    <span className="w-5 h-5 rounded-full bg-gray-300 text-[10px] font-bold flex items-center justify-center text-white">
                      {owner.charAt(0)}
                    </span>
                  )}
                  <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-[9px] bg-gray-800 text-white px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 group-hover/avatar:opacity-100 transition-opacity pointer-events-none z-10">
                    {owner}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
