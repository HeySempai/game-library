import { X, Users, Clock, Building2, User } from "lucide-react";
import { ownersData } from "../data/owners";

const avatarMap = {};
ownersData.forEach((o) => {
  avatarMap[o.nombre] = o.avatar;
});

const tipoBadge = {
  "Juego Base": "bg-orange-500",
  Ampliacion: "bg-amber-500",
  Expansion: "bg-sky-500",
};

const categoryColors = {
  "Party Game": "bg-pink-500",
  "Estrategia": "bg-emerald-500",
  "Deducción Social": "bg-red-500",
  "Cooperativo": "bg-cyan-500",
  "Aventura": "bg-orange-500",
  "Card Game": "bg-indigo-500",
};

export default function GameDetail({ game, expansions, allGames, category, onClose }) {
  if (!game) return null;

  const parent = game.parentId ? allGames.find((g) => g.id === game.parentId) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Cover */}
        <div className="relative bg-gray-50 p-5 sm:p-8 flex justify-center rounded-t-2xl">
          <button onClick={onClose} className="absolute top-3 right-3 p-2 rounded-full bg-white/80 hover:bg-white text-gray-500 transition-colors cursor-pointer z-10 shadow-sm">
            <X size={18} />
          </button>
          {game.imageUrl ? (
            <img
              src={game.imageUrl}
              alt={game.nombre}
              className="max-h-48 sm:max-h-72 w-auto rounded-lg block"
              style={{ boxShadow: "4px 6px 20px rgba(0,0,0,0.15), 2px 3px 8px rgba(0,0,0,0.08)" }}
            />
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
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${categoryColors[category]}`}>
                {category}
              </span>
            )}
          </div>

          {parent && (
            <p className="text-sm text-gray-400 mt-1">
              Requiere: <span className="text-orange-500 font-medium">{parent.nombre}</span>
            </p>
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
                    <span className="w-14 h-14 rounded-full bg-gray-200 text-lg font-bold flex items-center justify-center text-gray-500">
                      {owner.charAt(0)}
                    </span>
                  )}
                  <span className="absolute -bottom-6 text-[10px] text-gray-500 opacity-0 group-hover/owner:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                    {owner}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Expansions & Ampliaciones with covers */}
          {expansions && expansions.length > 0 && (
            <div className="mt-8">
              <h4 className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">
                Expansiones y Ampliaciones ({expansions.length})
              </h4>
              <div className="grid grid-cols-4 gap-3">
                {expansions.map((exp) => (
                  <div key={exp.id} className="bg-gray-50 rounded-xl p-3 flex flex-col items-center text-center">
                    {exp.imageUrl ? (
                      <img
                        src={exp.imageUrl}
                        alt={exp.nombre}
                        className="h-28 w-auto object-contain mb-2"
                        style={{ filter: "drop-shadow(3px 4px 4px rgba(0,0,0,0.2))" }}
                      />
                    ) : (
                      <div className="h-28 w-20 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-3xl opacity-20">🎲</span>
                      </div>
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
        </div>
      </div>
    </div>
  );
}
