import { useState, useEffect, useMemo } from "react";
import { X, ListOrdered, ArrowUpDown, Clock, Dices } from "lucide-react";
import { loadGameSessions, loadRngDisabled, saveRngDisabled } from "../utils/storage";

export default function GameTracker({ games, onClose }) {
  const baseGames = games.filter((g) => g.tipo === "Juego Base");
  const [sessions, setSessions] = useState([]);
  const [rngDisabled, setRngDisabled] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("least"); // "least" | "most" | "name"

  useEffect(() => {
    (async () => {
      const [s, rng] = await Promise.all([loadGameSessions(), loadRngDisabled()]);
      setSessions(s);
      setRngDisabled(rng);
      setLoading(false);
    })();
  }, []);

  const toggleRng = (id) => {
    const next = new Set(rngDisabled);
    const nowDisabled = !next.has(id);
    if (nowDisabled) next.add(id);
    else next.delete(id);
    setRngDisabled(next);
    saveRngDisabled(id, nowDisabled);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const gameStats = useMemo(() => {
    // Last played date and play count per game
    const lastPlayed = {};
    const playCount = {};
    sessions.forEach((s) => {
      playCount[s.game_id] = (playCount[s.game_id] || 0) + 1;
      if (!lastPlayed[s.game_id] || s.date > lastPlayed[s.game_id]) {
        lastPlayed[s.game_id] = s.date;
      }
    });

    return baseGames.map((g) => {
      const last = lastPlayed[g.id];
      let daysSince = null;
      if (last) {
        const [y, m, d] = last.split("-");
        const lastDate = new Date(y, m - 1, d);
        daysSince = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
      }
      return {
        ...g,
        lastPlayed: last || null,
        daysSince,
        playCount: playCount[g.id] || 0,
        rngEnabled: !rngDisabled.has(g.id),
      };
    });
  }, [baseGames, sessions, rngDisabled]);

  const sorted = useMemo(() => {
    const list = [...gameStats];
    if (sortBy === "least") {
      // Never played first, then most days since
      list.sort((a, b) => {
        if (a.daysSince === null && b.daysSince === null) return a.nombre.localeCompare(b.nombre);
        if (a.daysSince === null) return -1;
        if (b.daysSince === null) return 1;
        return b.daysSince - a.daysSince;
      });
    } else if (sortBy === "most") {
      list.sort((a, b) => {
        if (a.daysSince === null && b.daysSince === null) return a.nombre.localeCompare(b.nombre);
        if (a.daysSince === null) return 1;
        if (b.daysSince === null) return -1;
        return a.daysSince - b.daysSince;
      });
    } else {
      list.sort((a, b) => a.nombre.localeCompare(b.nombre));
    }
    return list;
  }, [gameStats, sortBy]);

  const enabledCount = gameStats.filter((g) => g.rngEnabled).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <ListOrdered size={20} className="text-orange-500" /> Game Tracker
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><X size={20} /></button>
        </div>

        <div className="px-5 pt-3 pb-2 shrink-0 flex items-center justify-between">
          <p className="text-xs text-gray-400">
            {loading ? "Cargando..." : `${enabledCount} de ${baseGames.length} activos en RNG`}
          </p>
          <div className="flex gap-1">
            {[
              { key: "least", label: "Menos jugados" },
              { key: "most", label: "Más jugados" },
              { key: "name", label: "A-Z" },
            ].map((s) => (
              <button key={s.key} onClick={() => setSortBy(s.key)}
                className={`text-[10px] px-2 py-1 rounded-full font-semibold transition-colors cursor-pointer ${
                  sortBy === s.key ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                }`}>{s.label}</button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {loading ? (
            <p className="text-center text-gray-300 py-8">Cargando...</p>
          ) : (
            <div className="space-y-1">
              {sorted.map((g) => (
                <div key={g.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors">
                  {g.imageUrl ? (
                    <img src={g.imageUrl} alt="" className="w-8 h-10 object-contain rounded shrink-0" />
                  ) : (
                    <div className="w-8 h-10 bg-gray-200 rounded flex items-center justify-center shrink-0 text-gray-400 text-xs">🎲</div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm truncate ${g.rngEnabled ? "text-gray-900" : "text-gray-400"}`}>{g.nombre}</p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                      {g.daysSince !== null ? (
                        <>
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            {g.daysSince === 0 ? "Hoy" : g.daysSince === 1 ? "Ayer" : `${g.daysSince}d`}
                          </span>
                          <span>· {g.playCount} partida{g.playCount !== 1 ? "s" : ""}</span>
                        </>
                      ) : (
                        <span className="text-orange-400 font-medium">Sin jugar</span>
                      )}
                    </div>
                  </div>

                  {/* RNG toggle */}
                  <button onClick={() => toggleRng(g.id)} className="cursor-pointer shrink-0" title={g.rngEnabled ? "Activo en RNG" : "Desactivado en RNG"}>
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${g.rngEnabled ? "bg-orange-500" : "bg-gray-200"}`}>
                      <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${g.rngEnabled ? "translate-x-[18px]" : "translate-x-0.5"}`} />
                    </div>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
