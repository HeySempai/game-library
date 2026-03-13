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
  Dices,
  Menu,
  SlidersHorizontal,
  ChevronDown,
  Settings,
  Eye,
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
import DiceRoller from "./components/DiceRoller";
import EditGameForm from "./components/EditGameForm";
import SettingsPanel from "./components/SettingsPanel";

function App() {
  const [games, setGames] = useState(() => {
    const stored = loadGames();
    if (stored) {
      // Build a map of canonical names from initialGames
      const nameMap = {};
      initialGames.forEach((g) => { nameMap[g.id] = g.nombre; });
      return stored.map((g) => ({
        ...g,
        nombre: nameMap[g.id] || g.nombre,
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
  const [showDice, setShowDice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterCategories, setFilterCategories] = useState(new Set());
  const [filterPlayerRange, setFilterPlayerRange] = useState("all");
  const [filterTime, setFilterTime] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

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

  const displayableGames = useMemo(() => {
    return showAll ? games : baseGames;
  }, [games, baseGames, showAll]);

  const filteredGames = useMemo(() => {
    return displayableGames.filter((game) => {
      const q = searchQuery.toLowerCase();
      if (q && !game.nombre.toLowerCase().includes(q) && !game.developer.toLowerCase().includes(q)) return false;
      if (filterOwner !== "all" && !game.owners.includes(filterOwner)) return false;
      if (filterCategories.size > 0) {
        const cat = categoryMap[game.id] || (game.parentId ? categoryMap[game.parentId] : null) || "Sin clasificar";
        if (!filterCategories.has(cat)) return false;
      }
      if (filterPlayerRange !== "all" && game.tipo === "Juego Base") {
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
  }, [displayableGames, searchQuery, filterOwner, filterCategories, filterPlayerRange, filterTime, showAll]);

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
        if (editingGame) setEditingGame(null);
        else if (selectedGame) setSelectedGame(null);
        else if (showAddForm) setShowAddForm(false);
        else if (showQuickPicker) setShowQuickPicker(false);
        else if (showMarathon) setShowMarathon(false);
        else if (showLeaderboard) setShowLeaderboard(false);
        else if (showOwners) setShowOwners(false);
        else if (showDice) setShowDice(false);
        else if (showSettings) setShowSettings(false);
      }
      if (selectedGame) {
        if (e.key === "ArrowLeft") navigateGame(-1);
        if (e.key === "ArrowRight") navigateGame(1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedGame, editingGame, showAddForm, showQuickPicker, showMarathon, showLeaderboard, showOwners, showSettings, navigateGame]);

  const handleAddGame = (newGame) => {
    setGames((prev) => [...prev, newGame]);
    newGame.owners.forEach((owner) => {
      if (!players.includes(owner)) setPlayers((prev) => [...prev, owner]);
    });
  };
  const handleEditGame = (gameId, { owners, category }) => {
    setGames((prev) =>
      prev.map((g) => (g.id === gameId ? { ...g, owners } : g))
    );
    // Update categoryMap dynamically (it's imported but we store overrides in localStorage)
    if (category) {
      categoryMap[gameId] = category;
    } else {
      delete categoryMap[gameId];
    }
    // Update selected game if open
    if (selectedGame?.id === gameId) {
      setSelectedGame((prev) => ({ ...prev, owners }));
    }
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
        <div className="max-w-[90rem] mx-auto px-3 sm:px-5 py-2 sm:py-3">
          {/* Search + Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar"
                className="w-full sm:max-w-md bg-gray-200/70 rounded-full pl-11 pr-5 py-2.5 sm:py-3 text-sm text-gray-900 placeholder-gray-500 focus:bg-white focus:ring-2 focus:ring-orange-300 focus:outline-none transition-all"
              />
            </div>

            {/* Mobile: filter toggle + hamburger + add */}
            <div className="flex items-center gap-1.5 sm:hidden">
              <button
                onClick={() => { setShowMobileFilters((v) => !v); setShowMobileMenu(false); }}
                className={`p-2 rounded-xl transition-colors cursor-pointer relative ${showMobileFilters ? "text-orange-500 bg-orange-50" : "text-gray-500 hover:bg-gray-100"}`}
                title="Filtros"
              >
                <SlidersHorizontal size={18} />
                {hasActiveFilters && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full" />
                )}
              </button>
              <button
                onClick={() => { setShowMobileMenu((v) => !v); setShowMobileFilters(false); }}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${showMobileMenu ? "text-orange-500 bg-orange-50" : "text-gray-500 hover:bg-gray-100"}`}
                title="Menú"
              >
                <Menu size={18} />
              </button>
              <button onClick={() => setShowAddForm(true)} className="p-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white transition-colors cursor-pointer">
                <Plus size={16} />
              </button>
            </div>

            {/* Desktop: all action buttons */}
            <div className="hidden sm:flex items-center gap-1.5">
              <button onClick={() => setShowOwners(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Owners">
                <UsersIcon size={18} />
              </button>
              <button onClick={() => setShowQuickPicker(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Quick Game">
                <Zap size={18} />
              </button>
              <button onClick={() => setShowMarathon(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Maratón">
                <Route size={18} />
              </button>
              <button onClick={() => setShowDice(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Dados">
                <Dices size={18} />
              </button>
              <button onClick={() => setShowLeaderboard(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Leaderboard">
                <Trophy size={18} />
              </button>
              <button onClick={() => setShowSettings(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Configuración">
                <Settings size={18} />
              </button>
              <button onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors cursor-pointer">
                <Plus size={16} />
                <span>Agregar</span>
              </button>
            </div>
          </div>

          {/* Mobile hamburger menu dropdown */}
          {showMobileMenu && (
            <div className="sm:hidden mt-2 bg-white rounded-xl border border-gray-100 shadow-lg overflow-hidden">
              {[
                { label: "Owners", icon: UsersIcon, action: () => { setShowOwners(true); setShowMobileMenu(false); } },
                { label: "Quick Game", icon: Zap, action: () => { setShowQuickPicker(true); setShowMobileMenu(false); } },
                { label: "Maratón", icon: Route, action: () => { setShowMarathon(true); setShowMobileMenu(false); } },
                { label: "Dados", icon: Dices, action: () => { setShowDice(true); setShowMobileMenu(false); } },
                { label: "Leaderboard", icon: Trophy, action: () => { setShowLeaderboard(true); setShowMobileMenu(false); } },
                { label: "Configuración", icon: Settings, action: () => { setShowSettings(true); setShowMobileMenu(false); } },
              ].map((item, i) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`flex items-center gap-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer ${i > 0 ? "border-t border-gray-50" : ""}`}
                >
                  <item.icon size={16} className="text-gray-400" />
                  {item.label}
                </button>
              ))}
            </div>
          )}

          {/* Mobile compact filters panel */}
          {showMobileFilters && (
            <div className="sm:hidden mt-2 space-y-3 pb-1">
              {/* Owner avatars */}
              <div className="flex items-center gap-2">
                <UserCircle size={14} className="text-gray-400 shrink-0" />
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ownersData.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => setFilterOwner(filterOwner === o.nombre ? "all" : o.nombre)}
                      className={`w-7 h-7 rounded-full overflow-hidden border-2 transition-all cursor-pointer ${
                        filterOwner === o.nombre
                          ? "border-orange-500 scale-110 shadow-md"
                          : filterOwner === "all"
                          ? "border-gray-200"
                          : "border-gray-200 opacity-40"
                      }`}
                      title={o.nombre}
                    >
                      <img src={o.avatar} alt={o.nombre} className="w-full h-full object-cover" loading="eager" width={28} height={28} decoding="async" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Categories wrapping */}
              <div className="flex items-start gap-2">
                <Shapes size={14} className="text-gray-400 shrink-0 mt-1" />
                <div className="flex flex-wrap gap-1.5">
                  {allCategories.map((cat) => {
                    const active = filterCategories.has(cat);
                    const colors = categoryColors[cat];
                    return (
                      <button
                        key={cat}
                        onClick={() => toggleCategory(cat)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer whitespace-nowrap ${
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
              </div>

              {/* Players + Time in one row */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <UsersIcon size={14} className="text-gray-400 shrink-0" />
                  {playerRanges.map((r) => (
                    <button
                      key={r.label}
                      onClick={() => setFilterPlayerRange(filterPlayerRange === r.label ? "all" : r.label)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                        filterPlayerRange === r.label
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
                <div className="w-px h-4 bg-gray-200" />
                <div className="flex items-center gap-1.5">
                  <Clock size={14} className="text-gray-400 shrink-0" />
                  {[15, 30, 60, 180].map((t) => (
                    <button
                      key={t}
                      onClick={() => setFilterTime(filterTime === t ? 0 : t)}
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                        filterTime === t
                          ? "bg-orange-500 text-white shadow-sm"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {t === 180 ? "180+" : t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear button */}
              {hasActiveFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 cursor-pointer">
                  <X size={12} /> Limpiar filtros
                </button>
              )}
            </div>
          )}

          {/* Desktop filters - single line */}
          <div className="hidden sm:flex items-center gap-x-5 mt-3 pt-3 border-t border-gray-100">
            {/* Owner avatars */}
            <div className="flex items-center gap-2 shrink-0">
              <UserCircle size={15} className="text-gray-400 shrink-0" />
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
                  <img src={o.avatar} alt={o.nombre} className="w-full h-full object-cover" loading="eager" width={32} height={32} decoding="async" />
                </button>
              ))}
            </div>

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* Category pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Shapes size={15} className="text-gray-400 shrink-0 mr-0.5" />
              {allCategories.map((cat) => {
                const active = filterCategories.has(cat);
                const colors = categoryColors[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => toggleCategory(cat)}
                    className={`text-[11px] font-semibold px-2.5 py-1 rounded-full transition-all cursor-pointer whitespace-nowrap ${
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

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* Player range pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <UsersIcon size={15} className="text-gray-400 shrink-0 mr-0.5" />
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

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {/* Time pills */}
            <div className="flex items-center gap-1.5 shrink-0">
              <Clock size={15} className="text-gray-400 shrink-0 mr-0.5" />
              {[15, 30, 60, 180].map((t) => {
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
      <div className="max-w-[90rem] mx-auto px-3 sm:px-5 py-2 sm:py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4 text-[10px] sm:text-xs text-gray-400 tracking-wide uppercase">
            <span>
              {filteredGames.length === displayableGames.length
                ? `${displayableGames.length} ${showAll ? "items" : "juegos"}`
                : `${filteredGames.length} de ${displayableGames.length}`}
            </span>
            <span>·</span>
            <span>{games.length - baseGames.length} expansiones</span>
            <span>·</span>
            <span>{victories.length} partidas</span>
          </div>
          <button
            onClick={() => setShowAll((v) => !v)}
            className={`flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold px-3 py-1.5 rounded-full transition-colors cursor-pointer ${
              showAll
                ? "bg-orange-500 text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            <Eye size={12} />
            {showAll ? "Mostrando todo" : "Mostrar todo"}
          </button>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-[90rem] mx-auto px-3 sm:px-5 pb-10">
        {filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4 opacity-30">🎲</p>
            <p className="text-lg text-gray-400">No se encontraron juegos</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
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
        <GameDetail
          game={selectedGame}
          expansions={getExpansions(selectedGame.id)}
          allGames={games}
          category={categoryMap[selectedGame.id]}
          onClose={() => setSelectedGame(null)}
          onEdit={() => setEditingGame(selectedGame)}
        />
      )}
      {editingGame && (
        <EditGameForm
          game={editingGame}
          players={players}
          onSave={(changes) => handleEditGame(editingGame.id, changes)}
          onClose={() => setEditingGame(null)}
        />
      )}
      {showAddForm && <AddGameForm games={games} players={players} onAdd={handleAddGame} onClose={() => setShowAddForm(false)} />}
      {showQuickPicker && <QuickPicker games={games} onClose={() => setShowQuickPicker(false)} />}
      {showMarathon && <RandomPicker games={games} onClose={() => setShowMarathon(false)} />}
      {showLeaderboard && <Leaderboard victories={victories} games={games} players={players} onAddVictory={handleAddVictory} onClose={() => setShowLeaderboard(false)} />}
      {showOwners && (
        <OwnersPanel
          ownersData={ownersData}
          games={games}
          victories={victories}
          players={players}
          onClose={() => setShowOwners(false)}
          onAddGame={(game, action, preloadOwner) => {
            if (action === "update" && game) {
              setGames((prev) => prev.map((g) => g.id === game.id ? game : g));
            } else if (action === "new") {
              setShowOwners(false);
              setShowAddForm(true);
              // Store preload owner in sessionStorage for AddGameForm
              if (preloadOwner) sessionStorage.setItem("preloadOwner", preloadOwner);
            }
          }}
        />
      )}
      {showDice && <DiceRoller onClose={() => setShowDice(false)} />}
      {showSettings && <SettingsPanel games={games} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
