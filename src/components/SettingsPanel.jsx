import { useState, useEffect } from "react";
import { X, Settings } from "lucide-react";

const RNG_KEY = "boardgamehub_rng_disabled";

export function loadRngDisabled() {
  const stored = localStorage.getItem(RNG_KEY);
  return stored ? new Set(JSON.parse(stored)) : new Set();
}

export function saveRngDisabled(disabledSet) {
  localStorage.setItem(RNG_KEY, JSON.stringify([...disabledSet]));
}

export default function SettingsPanel({ games, onClose }) {
  const baseGames = games.filter((g) => g.tipo === "Juego Base").sort((a, b) => a.nombre.localeCompare(b.nombre));
  const [disabled, setDisabled] = useState(() => loadRngDisabled());

  useEffect(() => {
    saveRngDisabled(disabled);
  }, [disabled]);

  const toggle = (id) => {
    setDisabled((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const enabledCount = baseGames.length - disabled.size;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Settings size={20} className="text-orange-500" /> Configuración RNG
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="px-5 pt-3 pb-2 shrink-0">
          <p className="text-xs text-gray-400">
            {enabledCount} de {baseGames.length} juegos activos en la ruleta
          </p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          <div className="space-y-1">
            {baseGames.map((game) => {
              const isEnabled = !disabled.has(game.id);
              return (
                <button
                  key={game.id}
                  onClick={() => toggle(game.id)}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  {game.imageUrl ? (
                    <img src={game.imageUrl} alt="" className="w-8 h-10 object-contain rounded shrink-0" />
                  ) : (
                    <div className="w-8 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0 text-gray-400 text-xs">🎲</div>
                  )}
                  <span className={`flex-1 text-sm truncate ${isEnabled ? "text-gray-900" : "text-gray-400 line-through"}`}>
                    {game.nombre}
                  </span>
                  <div
                    className={`w-10 h-6 rounded-full transition-colors relative ${
                      isEnabled ? "bg-orange-500" : "bg-gray-200"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        isEnabled ? "translate-x-[18px]" : "translate-x-0.5"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
