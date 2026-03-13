import { useState, useEffect, useMemo, useCallback } from "react";
import {
  Plus,
  Trophy,
  Search,
  Users as UsersIcon,
  Clock,
  X,
  UserCircle,
  Shapes,
  Zap,
  Route,
} from "lucide-react";
import { initialGames } from "./data/games";
import { imageMap } from "./data/images";
import { categoryMap, allCategories } from "./data/categories";
import { ownersData } from "./data/owners";
import {
  loadGames,
  saveGames,
  loadVictories,
  addVictory,
  loadPlayers,
  savePlayers,
  parseDuration,
} from "./utils/storage";
import GameCard from "./components/GameCard";
import GameDetail from "./components/GameDetail";
import AddGameForm from "./components/AddGameForm";
import QuickPicker from "./components/QuickPicker";
import RandomPicker from "./components/RandomPicker";
import Leaderboard from "./components/Leaderboard";
import OwnersPanel from "./components/OwnersPanel";


function App() {
  const [games, setGames] = useState(() => {
    const stored = loadGames();
    if (stored) {
      return stored.map((g) => ({
        ...g,
        imageUrl: g.imageUrl || imageMap[g.id] || "",
      }));
    }
    return initialGames;
  });
  const [victories, setVictories] = useState([]);
  const [players, setPlayers] = useState(() => loadPlayers());

  const [selectedGame, setSelectedGame] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showMarathon, setShowMarathon] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOwners, setShowOwners] = useState(false);

  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterCategories, setFilterCategories] = useState(new Set());
  const [filterPlayerRange, setFilterPlayerRange] = useState("all");
  const [filterTime, setFilterTime] = useState(0);

  useEffect(() => saveGames(games), [games]);
  useEffect(() => savePlayers(players), [players]);

  // Load victories from DB on mount
  useEffect(() => {
    loadVictories().then((v) => setVictories(v));
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const baseGames = useMemo(() => games.filter((g) => g.tipo === "Juego Base"), [games]);

  const getExpansions = (gameId) => games.filter((g) => g.parentId === gameId);

  const hasActiveFilters =
    filterOwner !== "all" ||
    filterCategories.size > 0 ||
    filterPlayerRange !== "all" ||
    filterTime !== 0;

  const toggleCategory = (cat) => {
    setFilterCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const playerRanges = [
    { label: "1-2", min: 1, max: 2 },
    { label: "3-4", min: 3, max: 4 },
    { label: "5-6", min: 5, max: 6 },
    { label: "6+", min: 6, max: 99 },
  ];

  const filteredGames = useMemo(() => {
    return baseGames.filter((game) => {
      const q = searchQuery.toLowerCase();
      if (q && !game.nombre.toLowerCase().includes(q) && !game.developer.toLowerCase().includes(q)) return false;
      if (filterOwner !== "all" && !game.owners.includes(filterOwner)) return false;
      if (filterCategories.size > 0) {
        const cat = categoryMap[game.id] || "Sin clasificar";
        if (!filterCategories.has(cat)) return false;
      }
      if (filterPlayerRange !== "all") {
        const range = playerRanges.find((r) => r.label === filterPlayerRange);
        if (range) {
          const amps = games.filter((g) => g.parentId === game.id && g.tipo === "Ampliacion");
          let effectiveMax = game.maxJugadores;
          amps.forEach((a) => { if (a.maxJugadores > effectiveMax) effectiveMax = a.maxJugadores; });
          const overlaps = game.minJugadores <= range.max && effectiveMax >= range.min;
          if (!overlaps) return false;
        }
      }
      if (filterTime > 0 && filterTime !== 180) {
        const dur = parseDuration(game.duracion);
        if (dur.min > filterTime) return false;
      }
      return true;
    });
  }, [baseGames, searchQuery, filterOwner, filterCategories, filterPlayerRange, filterTime]);

  const navigateGame = useCallback((dir) => {
    if (!selectedGame) return;
    const idx = filteredGames.findIndex((g) => g.id === selectedGame.id);
    if (idx === -1) return;
    const next = idx + dir;
    if (next >= 0 && next < filteredGames.length) {
      setSelectedGame(filteredGames[next]);
    }
  }, [selectedGame, filteredGames]);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (selectedGame) setSelectedGame(null);
        else if (showAddForm) setShowAddForm(false);
        else if (showQuickPicker) setShowQuickPicker(false);
        else if (showMarathon) setShowMarathon(false);
        else if (showLeaderboard) setShowLeaderboard(false);
        else if (showOwners) setShowOwners(false);
      }
      if (selectedGame) {
        if (e.key === "ArrowLeft") navigateGame(-1);
        if (e.key === "ArrowRight") navigateGame(1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedGame, showAddForm, showQuickPicker, showMarathon, showLeaderboard, showOwners, navigateGame]);

  const handleAddGame = (newGame) => {
    setGames((prev) => [...prev, newGame]);
    newGame.owners.forEach((owner) => {
      if (!players.includes(owner)) setPlayers((prev) => [...prev, owner]);
    });
  };

  const handleAddVictory = async (victory) => {
    const saved = await addVictory(victory);
    if (saved) {
      setVictories((prev) => [saved, ...prev]);
    }
  };

  const allOwners = useMemo(() => {
    const set = new Set();
    games.forEach((g) => g.owners.forEach((o) => set.add(o)));
    return Array.from(set).sort();
  }, [games]);

  const clearFilters = () => {
    setFilterOwner("all");
    setFilterCategories(new Set());
    setFilterPlayerRange("all");
    setFilterTime(0);
  };

  const categoryColors = {
    "Party Game": { bg: "bg-pink-500", inactive: "bg-pink-100 text-pink-600" },
    "Estrategia": { bg: "bg-emerald-500", inactive: "bg-emerald-100 text-emerald-600" },
    "Deducción Social": { bg: "bg-red-500", inactive: "bg-red-100 text-red-600" },
    "Cooperativo": { bg: "bg-cyan-500", inactive: "bg-cyan-100 text-cyan-600" },
    "Aventura": { bg: "bg-orange-500", inactive: "bg-orange-100 text-orange-600" },
    "Card Game": { bg: "bg-indigo-500", inactive: "bg-indigo-100 text-indigo-600" },
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Header */}
      <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "bg-white/70 backdrop-blur-md border-b border-gray-100 shadow-sm" : "bg-transparent border-b border-transparent"}`}>
        <div className="max-w-[90rem] mx-auto px-5 py-3">
          {/* Search + Actions */}
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar"
                className="w-full max-w-md bg-gray-200/70 rounded-full pl-11 pr-5 py-3 text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-300 focus:outline-none transition-all"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={() => setShowOwners(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Owners">
                <UsersIcon size={18} />
              </button>
              <button onClick={() => setShowQuickPicker(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Quick Game">
                <Zap size={18} />
              </button>
              <button onClick={() => setShowMarathon(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Maratón">
                <Route size={18} />
              </button>
              <button onClick={() => setShowLeaderboard(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Leaderboard">
                <Trophy size={18} />
              </button>
              <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors cursor-pointer">
                <Plus size={16} />
                <span className="hidden sm:inline">Agregar</span>
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-nowrap items-center gap-x-6 gap-y-3 mt-3 pt-3 border-t border-gray-100 overflow-x-auto">
            {/* Owner avatars */}
            <div className="flex items-center gap-2.5 shrink-0">
              <UserCircle size={15} className="text-gray-400 shrink-0" />
              <div className="flex items-center gap-2">
                {ownersData.map((o) => (
                  <button
                    key={o.id}
                    onClick={() => setFilterOwner(filterOwner === o.nombre ? "all" : o.nombre)}
                    className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                      filterOwner === o.nombre
                        ? "border-orange-500 scale-110 shadow-md"
                        : filterOwner === "all"
                        ? "border-gray-200 hover:border-gray-300"
                        : "border-gray-200 opacity-40 hover:opacity-70"
                    }`}
                    title={o.nombre}
                  >
                    <img src={o.avatar} alt={o.nombre} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200 shrink-0" />

            {/* Category pills */}
            <div className="flex items-center gap-2">
              <Shapes size={15} className="text-gray-400 shrink-0" />
              {allCategories.map((cat) => {
                const active = filterCategories.has(cat);
                const colors = categoryColors[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      active
                        ? `${colors.bg} text-white shadow-sm`
                        : `${colors.inactive} opacity-60 hover:opacity-100`
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Player range pills */}
            <div className="flex items-center gap-2">
              <UsersIcon size={15} className="text-gray-400 shrink-0" />
              {playerRanges.map((r) => (
                <button
                  key={r.label}
                  onClick={() => setFilterPlayerRange(filterPlayerRange === r.label ? "all" : r.label)}
                  className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                    filterPlayerRange === r.label
                      ? "bg-orange-500 text-white shadow-sm"
                      : filterPlayerRange === "all"
                      ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      : "bg-gray-100 text-gray-400 opacity-50 hover:opacity-80"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>

            {/* Separator */}
            <div className="w-px h-6 bg-gray-200" />

            {/* Time pills */}
            <div className="flex items-center gap-2">
              <Clock size={15} className="text-gray-400 shrink-0" />
              {[15, 30, 60, 180].map((t, i) => {
                const label = t === 180 ? "180+" : `${t}`;
                return (
                  <button
                    key={t}
                    onClick={() => setFilterTime(filterTime === t ? 0 : t)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer ${
                      filterTime === t
                        ? "bg-orange-500 text-white shadow-sm"
                        : filterTime === 0
                        ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        : "bg-gray-100 text-gray-400 opacity-50 hover:opacity-80"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 cursor-pointer ml-auto shrink-0">
                <X size={12} /> Limpiar
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="max-w-[90rem] mx-auto px-5 py-3">
        <div className="flex items-center gap-4 text-xs text-gray-400 tracking-wide uppercase">
          <span>
            {filteredGames.length === baseGames.length
              ? `${baseGames.length} juegos`
              : `${filteredGames.length} de ${baseGames.length}`}
          </span>
          <span>·</span>
          <span>{games.length - baseGames.length} expansiones</span>
          <span>·</span>
          <span>{victories.length} partidas</span>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-[90rem] mx-auto px-5 pb-10">
        {filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4 opacity-30">🎲</p>
            <p className="text-lg text-gray-400">No se encontraron juegos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredGames.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                allGames={games}
                expansions={getExpansions(game.id)}
                category={categoryMap[game.id]}
                onClick={() => setSelectedGame(game)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {selectedGame && (
        <GameDetail game={selectedGame} expansions={getExpansions(selectedGame.id)} allGames={games} category={categoryMap[selectedGame.id]} onClose={() => setSelectedGame(null)} />
      )}
      {showAddForm && <AddGameForm games={games} players={players} onAdd={handleAddGame} onClose={() => setShowAddForm(false)} />}
      {showQuickPicker && <QuickPicker games={games} onClose={() => setShowQuickPicker(false)} />}
      {showMarathon && <RandomPicker games={games} onClose={() => setShowMarathon(false)} />}
      {showLeaderboard && <Leaderboard victories={victories} games={games} players={players} onAddVictory={handleAddVictory} onClose={() => setShowLeaderboard(false)} />}
      {showOwners && <OwnersPanel ownersData={ownersData} games={games} victories={victories} onClose={() => setShowOwners(false)} />}
    </div>
  );
}

export default App;
