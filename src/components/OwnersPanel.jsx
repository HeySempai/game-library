import { useState } from "react";
import { X, Cake, MapPin, Star, Gamepad2, Trophy, List, LayoutGrid, RefreshCw, Plus } from "lucide-react";

const RANDOM_TITLES = [
  "El Estratega Silencioso", "El Soñador Impulsivo", "El Táctico Implacable",
  "El Explorador Nocturno", "El Retador Intrépido", "El Coleccionista Nato",
  "El Destructor de Mesas", "El Rey del Bluff", "El Eterno Segundo",
  "El Campeón Inesperado", "El Saboteador Profesional", "El Diplomático Traidor",
  "El Maestro del Caos", "El Arquitecto del Dolor", "El Señor de los Dados",
  "El Último en Pie", "El Acumulador Silencioso", "El Franco Tirador",
  "El Negociador Despiadado", "El Constructor Paciente", "El Pirata del Tablero",
  "El Guardián del Turno", "El Genio Incomprendido", "El Terror de la Mesa",
  "El Sobreviviente Eterno", "El Oráculo del RNG", "El Mercader Astuto",
  "El Verdugo Sonriente", "El Fantasma del Leaderboard", "El Devorador de Reglas",
  "El Lobo Solitario", "El Aliado Temporal", "El Provocador Nato",
  "El Vikingo de Cartón", "El Hechicero del Meeple", "El Barón del VP",
];

function getRandomTitle(currentTitle) {
  const filtered = RANDOM_TITLES.filter((t) => t !== currentTitle);
  return filtered[Math.floor(Math.random() * filtered.length)];
}

export default function OwnersPanel({ ownersData, games, victories, players, onClose, onAddGame }) {
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [collectionView, setCollectionView] = useState("list");
  const [titles, setTitles] = useState(() => {
    const map = {};
    ownersData.forEach((o) => { map[o.id] = o.titulo; });
    return map;
  });
  const [showAddGame, setShowAddGame] = useState(false);
  const [addForm, setAddForm] = useState(null);

  const getOwnerStats = (ownerName) => {
    const ownedGames = games.filter((g) => g.tipo === "Juego Base" && g.owners.includes(ownerName));
    const wins = victories.filter((v) => v.winner === ownerName).length;
    return { gameCount: ownedGames.length, wins };
  };

  const refreshTitle = (ownerId) => {
    setTitles((prev) => ({ ...prev, [ownerId]: getRandomTitle(prev[ownerId]) }));
  };

  const owner = selectedOwner ? ownersData.find((o) => o.id === selectedOwner) : null;
  const ownerGames = owner ? games.filter((g) => g.tipo === "Juego Base" && g.owners.includes(owner.nombre)) : [];

  // Add existing game to owner
  const handleAddExistingGame = (gameId) => {
    const game = games.find((g) => g.id === gameId);
    if (game && owner && !game.owners.includes(owner.nombre)) {
      onAddGame({ ...game, owners: [...game.owners, owner.nombre] }, "update");
    }
    setShowAddGame(false);
  };

  // Available games the owner doesn't have
  const availableGames = owner
    ? games.filter((g) => g.tipo === "Juego Base" && !g.owners.includes(owner.nombre))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Gamepad2 size={20} className="text-orange-500" />
            {owner ? owner.nombre : "Owners"}
          </h2>
          <div className="flex gap-2">
            {owner && (
              <button onClick={() => { setSelectedOwner(null); setShowAddGame(false); }} className="text-sm text-gray-400 hover:text-gray-600 px-2 py-1 cursor-pointer">Volver</button>
            )}
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><X size={20} /></button>
          </div>
        </div>

        {!owner ? (
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 gap-4">
            {ownersData.map((o) => {
              const stats = getOwnerStats(o.nombre);
              return (
                <button key={o.id} onClick={() => setSelectedOwner(o.id)}
                  className="bg-gray-50 rounded-xl p-5 hover:bg-gray-100 transition-all text-center cursor-pointer group border border-gray-100 hover:border-orange-200">
                  <img src={o.avatar} alt={o.nombre}
                    className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-2 border-gray-100 group-hover:border-orange-300 transition-colors shadow-sm"
                    onError={(e) => { e.target.style.display = "none"; }} />
                  <p className="font-semibold text-gray-900 text-sm">{o.nombre}</p>
                  {titles[o.id] && <p className="text-xs italic text-orange-400 mt-0.5">{titles[o.id]}</p>}
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Gamepad2 size={12} />{stats.gameCount}</span>
                    <span className="flex items-center gap-1"><Trophy size={12} />{stats.wins}</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : showAddGame ? (
          /* Add game sub-view */
          <div className="p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Añadir juego a {owner.nombre}</h3>
            
            {/* Existing games */}
            {availableGames.length > 0 && (
              <div className="mb-4">
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Del catálogo existente</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {availableGames.map((g) => (
                    <button key={g.id} onClick={() => handleAddExistingGame(g.id)}
                      className="w-full flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2 hover:bg-orange-50 hover:border-orange-200 border border-transparent transition-colors cursor-pointer text-left">
                      {g.imageUrl ? (
                        <img src={g.imageUrl} alt={g.nombre} className="w-8 h-10 rounded object-contain shrink-0" />
                      ) : (
                        <div className="w-8 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0 text-xs">🎲</div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{g.nombre}</p>
                        <p className="text-xs text-gray-400">{g.jugadoresDisplay} · {g.duracion}</p>
                      </div>
                      <Plus size={14} className="text-orange-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t border-gray-100 pt-3">
              <button
                onClick={() => onAddGame(null, "new", owner.nombre)}
                className="w-full py-2.5 rounded-xl font-semibold text-sm bg-orange-500 hover:bg-orange-600 text-white transition-colors cursor-pointer"
              >
                + Crear juego nuevo
              </button>
            </div>

            <button onClick={() => setShowAddGame(false)} className="w-full mt-2 py-2 text-sm text-gray-400 hover:text-gray-600 cursor-pointer">
              Cancelar
            </button>
          </div>
        ) : (
          <div className="p-5">
            <div className="flex items-start gap-5 mb-6">
              <img src={owner.avatar} alt={owner.nombre}
                className="w-24 h-24 rounded-full object-cover border-2 border-orange-200 shrink-0 shadow-sm"
                onError={(e) => { e.target.style.display = "none"; }} />
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">{owner.nombre}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  {titles[owner.id] && <p className="text-sm italic text-orange-400">{titles[owner.id]}</p>}
                  <button
                    onClick={() => refreshTitle(owner.id)}
                    className="p-1 rounded-md hover:bg-orange-50 text-orange-300 hover:text-orange-500 transition-colors cursor-pointer"
                    title="Generar título aleatorio"
                  >
                    <RefreshCw size={12} />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Cake size={14} className="text-orange-400" /><span>{owner.cumpleanos}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Star size={14} className="text-orange-400" /><span>{owner.signo}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin size={14} className="text-orange-400" /><span>{owner.ubicacion}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-orange-500">{ownerGames.length}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Juegos</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-2xl font-bold text-amber-500">{victories.filter((v) => v.winner === owner.nombre).length}</p>
                <p className="text-[10px] text-gray-400 uppercase tracking-wide">Victorias</p>
              </div>
            </div>

            {/* Add game button */}
            <button
              onClick={() => setShowAddGame(true)}
              className="w-full mb-4 py-2.5 rounded-xl font-semibold text-sm bg-orange-50 hover:bg-orange-100 text-orange-600 border border-orange-200 transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Añadir juego
            </button>

            <div className="flex items-center justify-between mb-3">
              <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Colección ({ownerGames.length})</h4>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCollectionView("list")}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${collectionView === "list" ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <List size={14} />
                </button>
                <button
                  onClick={() => setCollectionView("grid")}
                  className={`p-1.5 rounded-lg cursor-pointer transition-colors ${collectionView === "grid" ? "bg-orange-500 text-white" : "text-gray-400 hover:bg-gray-100"}`}
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

            {collectionView === "list" ? (
              <div className="space-y-1.5">
                {ownerGames.map((g) => (
                  <div key={g.id} className="flex items-center gap-3 bg-gray-50 rounded-lg px-3 py-2">
                    {g.imageUrl ? (
                      <img src={g.imageUrl} alt={g.nombre} className="w-8 h-10 rounded object-contain shrink-0" />
                    ) : (
                      <div className="w-8 h-10 rounded bg-gray-200 flex items-center justify-center shrink-0 text-xs">🎲</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{g.nombre}</p>
                      <p className="text-xs text-gray-400">{g.jugadoresDisplay} · {g.duracion}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {ownerGames.map((g) => (
                  <div key={g.id} className="flex flex-col items-center text-center">
                    {g.imageUrl ? (
                      <img
                        src={g.imageUrl}
                        alt={g.nombre}
                        className="w-full aspect-square object-contain"
                        style={{ filter: "drop-shadow(3px 4px 4px rgba(0,0,0,0.2))" }}
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <span className="text-3xl opacity-20">🎲</span>
                      </div>
                    )}
                    <p className="text-xs font-medium text-gray-900 mt-1.5 truncate w-full">{g.nombre}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
