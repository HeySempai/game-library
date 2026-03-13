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
      className="group text-left w-full cursor-pointer transition-all duration-200 hover:-translate-y-1"
    >
      <div className="bg-[#f2f3f5] rounded-xl sm:rounded-2xl p-3 sm:p-4 pb-3 sm:pb-4 transition-colors duration-200 group-hover:bg-[#e8e9ec]">
        {/* Image container */}
        <div className="relative aspect-[4/3] flex items-center justify-center">
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={game.nombre}
              className="max-w-full max-h-full object-contain transition-[filter] duration-200 group-hover:[filter:drop-shadow(6px_10px_10px_rgba(0,0,0,0.35))_drop-shadow(2px_4px_5px_rgba(0,0,0,0.2))]"
              style={{
                filter: "drop-shadow(4px 6px 6px rgba(0,0,0,0.25)) drop-shadow(1px 2px 3px rgba(0,0,0,0.15))",
              }}
            />
          ) : (
            <span className="text-6xl opacity-20">🎲</span>
          )}
          {/* Expansion count circle */}
          {expCount > 0 && (
            <span className="absolute bottom-1 right-1 w-7 h-7 flex items-center justify-center text-[10px] font-bold rounded-full bg-orange-500 text-white shadow-sm">
              +{expCount}
            </span>
          )}
        </div>

        {/* Info */}
        <div className="pt-3">
          {/* Category pill */}
          {category && (
            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full text-white mb-1.5 ${categoryColors[category]}`}>
              {category}
            </span>
          )}
          <h3 className="font-semibold text-sm text-gray-900 truncate leading-snug">
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
          {/* Owner avatars */}
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
    </button>
  );
}
