import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
  History,
  ListOrdered,
  LayoutGrid,
  List,
  ArrowUpDown,
} from "lucide-react";
import { initialGames } from "./data/games";
import { imageMap } from "./data/images";
import { categoryMap, allCategories } from "./data/categories";
import { ownersData } from "./data/owners";
import {
  loadVictories,
  addVictory,
  loadPlayers,
  parseDuration,
  loadGameConfigs,
  saveCategory,
  saveGameOverride,
  saveCustomGame,
  saveGameConfig,
  loadGameSessions,
  loadRngDisabled,
  saveRngDisabled,
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
import GameHistoryPanel from "./components/GameHistoryPanel";

function ListRow({ children, onClick }) {
  const ref = useRef(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [hovered, setHovered] = useState(false);
  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);
  return (
    <button onClick={onClick} className="group text-left w-full cursor-pointer transition-all duration-300">
      <div ref={ref} onMouseMove={handleMouseMove} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
        className="relative rounded-xl p-[1.5px] overflow-hidden transition-all duration-300"
        style={{
          background: hovered ? undefined : '#f2f3f5',
          boxShadow: hovered ? '0 0 12px 2px rgba(255,140,0,0.2), 0 0 4px 1px rgba(255,180,80,0.15)' : 'none',
        }}>
        <div className="absolute inset-[-50%] transition-opacity duration-300 pointer-events-none blur-[3px]"
          style={{
            opacity: hovered ? 1 : 0,
            background: 'conic-gradient(from 0deg, #ff8c00, #fff4e0, #ff6b00, #ffffff, #ffaa33, #fff8ee, #ff5500, #ffe0b2, #ff8c00)',
            animation: hovered ? 'spin-border 5s linear infinite' : 'none',
          }} />
        <div className="absolute inset-0 rounded-xl transition-opacity duration-300 pointer-events-none"
          style={{
            opacity: hovered ? 1 : 0,
            background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.95), rgba(255,150,40,0.6) 35%, transparent 65%)`,
          }} />
        <div className="relative bg-[#f2f3f5] rounded-[9px] transition-colors duration-300 overflow-hidden">
          <div className="absolute inset-0 opacity-0 transition-opacity duration-300 pointer-events-none"
            style={{
              opacity: hovered ? 1 : 0,
              background: `radial-gradient(400px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,140,0,0.04), transparent 60%)`,
            }} />
          <div className="relative grid grid-cols-[100px_1fr_120px_100px_80px_60px_110px_140px] items-center gap-4 px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </button>
  );
}

function App() {
  const [games, setGames] = useState(initialGames);
  const [victories, setVictories] = useState([]);
  const [gameConfigs, setGameConfigs] = useState({});
  const [players, setPlayers] = useState(() => ownersData.map((o) => o.nombre));

  const [selectedGame, setSelectedGame] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addFormPreloadOwner, setAddFormPreloadOwner] = useState(null);
  const [showQuickPicker, setShowQuickPicker] = useState(false);
  const [showMarathon, setShowMarathon] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showOwners, setShowOwners] = useState(false);
  const [showDice, setShowDice] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"
  const [listSort, setListSort] = useState({ key: "days", asc: false }); // days desc = most days first
  const [allSessions, setAllSessions] = useState([]);
  const [rngDisabled, setRngDisabled] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [filterOwner, setFilterOwner] = useState("all");
  const [filterCategories, setFilterCategories] = useState(new Set(allCategories));
  const [filterPlayerRange, setFilterPlayerRange] = useState("all");
  const [filterTime, setFilterTime] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Load all data from Supabase on mount
  useEffect(() => {
    loadVictories().then((v) => setVictories(v));
    loadPlayers().then((p) => setPlayers(p));
    loadGameConfigs().then((configs) => {
      setGameConfigs(configs);
      // Merge DB data into games
      const customGames = [];
      Object.entries(configs).forEach(([id, cfg]) => {
        if (cfg.category) categoryMap[id] = cfg.category;
        if (cfg.isCustom && cfg.customNombre) {
          customGames.push({
            id,
            tipo: cfg.tipo || "Juego Base",
            nombre: cfg.customNombre,
            duracion: cfg.duracion || "",
            minJugadores: cfg.minJugadores,
            maxJugadores: cfg.maxJugadores,
            jugadoresDisplay: cfg.jugadoresDisplay || "",
            developer: cfg.developer || "",
            owners: cfg.owners || [],
            parentId: cfg.parentId || null,
            imageUrl: cfg.imageUrl || imageMap[id] || "",
          });
        }
      });
      setGames((prev) => {
        // Merge overrides into hardcoded games
        const merged = prev.map((g) => {
          const cfg = configs[g.id];
          if (!cfg) return g;
          return {
            ...g,
            owners: cfg.owners || g.owners,
            nombre: cfg.customNombre || g.nombre,
            imageUrl: cfg.imageUrl || imageMap[g.id] || g.imageUrl || "",
          };
        });
        // Add custom games not in hardcoded catalog
        const existingIds = new Set(merged.map((g) => g.id));
        const newCustom = customGames.filter((g) => !existingIds.has(g.id));
        return [...merged, ...newCustom];
      });
    });
    loadGameSessions().then((s) => setAllSessions(s));
    loadRngDisabled().then((r) => setRngDisabled(r));
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
    filterCategories.size < allCategories.length ||
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
      if (filterCategories.size < allCategories.length) {
        const cat = categoryMap[game.id] || (game.parentId ? categoryMap[game.parentId] : null);
        if (!cat || !filterCategories.has(cat)) return false;
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

  // Game stats for list view
  const today = useMemo(() => { const d = new Date(); d.setHours(0,0,0,0); return d; }, []);
  const gameStats = useMemo(() => {
    const lastPlayed = {};
    const playCount = {};
    allSessions.forEach((s) => {
      // Count base game
      playCount[s.game_id] = (playCount[s.game_id] || 0) + 1;
      if (!lastPlayed[s.game_id] || s.date > lastPlayed[s.game_id]) lastPlayed[s.game_id] = s.date;
      // Count expansions used in this session
      (s.expansions || []).forEach((expId) => {
        playCount[expId] = (playCount[expId] || 0) + 1;
        if (!lastPlayed[expId] || s.date > lastPlayed[expId]) lastPlayed[expId] = s.date;
      });
    });
    const map = {};
    games.forEach((g) => {
      const last = lastPlayed[g.id];
      let daysSince = null;
      if (last) {
        const [y, m, d] = last.split("-");
        daysSince = Math.floor((today - new Date(y, m - 1, d)) / 86400000);
      }
      map[g.id] = { lastPlayed: last, daysSince, playCount: playCount[g.id] || 0 };
    });
    return map;
  }, [allSessions, games, today]);

  const toggleListSort = (key) => {
    setListSort((prev) => prev.key === key ? { key, asc: !prev.asc } : { key, asc: key === "name" });
  };

  const sortedFilteredGames = useMemo(() => {
    if (viewMode !== "list") return filteredGames;
    const list = [...filteredGames];
    const { key, asc } = listSort;
    list.sort((a, b) => {
      let cmp = 0;
      if (key === "name") {
        cmp = a.nombre.localeCompare(b.nombre);
      } else if (key === "days") {
        const da = gameStats[a.id]?.daysSince;
        const db = gameStats[b.id]?.daysSince;
        if (da === null && db === null) cmp = a.nombre.localeCompare(b.nombre);
        else if (da === null) cmp = 1;
        else if (db === null) cmp = -1;
        else cmp = da - db;
      } else if (key === "count") {
        cmp = (gameStats[a.id]?.playCount || 0) - (gameStats[b.id]?.playCount || 0);
      }
      return asc ? cmp : -cmp;
    });
    return list;
  }, [filteredGames, viewMode, listSort, gameStats]);

  const toggleRng = (id) => {
    const next = new Set(rngDisabled);
    const nowDisabled = !next.has(id);
    if (nowDisabled) next.add(id); else next.delete(id);
    setRngDisabled(next);
    saveRngDisabled(id, nowDisabled);
  };

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
        else if (showHistory) setShowHistory(false);
      }
      if (selectedGame) {
        if (e.key === "ArrowLeft") navigateGame(-1);
        if (e.key === "ArrowRight") navigateGame(1);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [selectedGame, editingGame, showAddForm, showQuickPicker, showMarathon, showLeaderboard, showOwners, showSettings, showHistory, navigateGame]);

  const handleConfigChange = (gameId, config) => {
    setGameConfigs((prev) => ({ ...prev, [gameId]: config }));
  };

  const handleAddGame = (newGame) => {
    setGames((prev) => [...prev, newGame]);
    newGame.owners.forEach((owner) => {
      if (!players.includes(owner)) setPlayers((prev) => [...prev, owner]);
    });
    saveCustomGame(newGame);
    if (newGame.category) {
      categoryMap[newGame.id] = newGame.category;
      saveCategory(newGame.id, newGame.category);
    }
    if (newGame.victoryType) {
      saveGameConfig(newGame.id, newGame.victoryType);
      setGameConfigs((prev) => ({ ...prev, [newGame.id]: { victoryType: newGame.victoryType } }));
    }
  };
  const handleEditGame = (gameId, { nombre, tipo, owners, category, imageUrl, duracion, minJugadores, maxJugadores }) => {
    let jugadoresDisplay;
    if (tipo === "Expansion") {
      jugadoresDisplay = "= Base";
    } else if (tipo === "Ampliacion" && minJugadores && maxJugadores) {
      jugadoresDisplay = `→ ${minJugadores}-${maxJugadores}`;
    } else if (minJugadores && maxJugadores) {
      jugadoresDisplay = `${minJugadores}-${maxJugadores}`;
    }
    setGames((prev) =>
      prev.map((g) => {
        if (g.id !== gameId) return g;
        return {
          ...g,
          nombre: nombre || g.nombre,
          ...(tipo ? { tipo } : {}),
          owners,
          ...(imageUrl !== undefined ? { imageUrl } : {}),
          ...(duracion !== undefined ? { duracion } : {}),
          ...(minJugadores !== undefined ? { minJugadores } : {}),
          ...(maxJugadores !== undefined ? { maxJugadores } : {}),
          ...(jugadoresDisplay ? { jugadoresDisplay } : {}),
        };
      })
    );
    if (category) {
      categoryMap[gameId] = category;
    } else {
      delete categoryMap[gameId];
    }
    saveCategory(gameId, category || null);
    saveGameOverride(gameId, { owners, nombre, imageUrl, duracion, minJugadores, maxJugadores, tipo });
    if (selectedGame?.id === gameId) {
      setSelectedGame((prev) => ({
        ...prev, nombre: nombre || prev.nombre, owners,
        ...(tipo ? { tipo } : {}),
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(duracion !== undefined ? { duracion } : {}),
        ...(minJugadores !== undefined ? { minJugadores } : {}),
        ...(maxJugadores !== undefined ? { maxJugadores } : {}),
        ...(jugadoresDisplay ? { jugadoresDisplay } : {}),
      }));
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
    setFilterCategories(new Set(allCategories));
    setFilterPlayerRange("all");
    setFilterTime(0);
  };

  const categoryColors = {
    "Party Game": { bg: "bg-pink-500", inactive: "bg-pink-100 text-pink-600" },
    "Estrategia": { bg: "bg-emerald-500", inactive: "bg-emerald-100 text-emerald-600" },
    "Política": { bg: "bg-red-500", inactive: "bg-red-100 text-red-600" },
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
              <button onClick={() => setShowHistory(true)} className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer" title="Historial">
                <History size={18} />
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
                { label: "Historial", icon: History, action: () => { setShowHistory(true); setShowMobileMenu(false); } },
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
                            : "bg-gray-100 text-gray-300 opacity-40 hover:opacity-70"
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
                        : "bg-gray-100 text-gray-300 opacity-40 hover:opacity-70"
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
          </div>
          <div className="flex items-center gap-2">
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
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "grid" ? "bg-white shadow-sm text-orange-500" : "text-gray-400 hover:text-gray-600"}`}>
                <LayoutGrid size={14} />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${viewMode === "list" ? "bg-white shadow-sm text-orange-500" : "text-gray-400 hover:text-gray-600"}`}>
                <List size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid / List */}
      <main className="max-w-[90rem] mx-auto px-3 sm:px-5 pb-10">
        {filteredGames.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4 opacity-30">🎲</p>
            <p className="text-lg text-gray-400">No se encontraron juegos</p>
          </div>
        ) : viewMode === "grid" ? (
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
        ) : (
          <div className="space-y-2">
            {/* List header */}
            <div className="grid grid-cols-[100px_1fr_120px_100px_80px_60px_110px_140px] items-center gap-4 px-6 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
              <div />
              <button onClick={() => toggleListSort("name")} className="flex items-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">
                JUEGO {listSort.key === "name" && <ArrowUpDown size={11} className="text-orange-500" />}
              </button>
              <div className="text-center">JUGADORES</div>
              <div className="text-center">DURACIÓN</div>
              <button onClick={() => toggleListSort("days")} className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">
                JUGADO HACE {listSort.key === "days" && <ArrowUpDown size={11} className="text-orange-500" />}
              </button>
              <button onClick={() => toggleListSort("count")} className="flex items-center justify-center gap-1.5 cursor-pointer hover:text-gray-600 transition-colors">
                VECES {listSort.key === "count" && <ArrowUpDown size={11} className="text-orange-500" />}
              </button>
              <div className="text-center">CATEGORÍA</div>
              <div className="text-center">OWNERS</div>
            </div>
            {/* List rows */}
            {sortedFilteredGames.map((game) => {
              const stats = gameStats[game.id] || {};
              const cat = categoryMap[game.id];
              const catColorMap = {
                "Party Game": "bg-pink-100 text-pink-600",
                "Estrategia": "bg-emerald-100 text-emerald-600",
                "Política": "bg-red-100 text-red-600",
                "Aventura": "bg-orange-100 text-orange-600",
                "Card Game": "bg-indigo-100 text-indigo-600",
              };
              const ampliaciones = games.filter((g) => g.parentId === game.id && g.tipo === "Ampliacion");
              let extendedMax = game.maxJugadores;
              ampliaciones.forEach((a) => { if (a.maxJugadores > extendedMax) extendedMax = a.maxJugadores; });
              const hasExtended = extendedMax > game.maxJugadores;
              return (
                <ListRow key={game.id} onClick={() => setSelectedGame(game)}>
                  {/* Cover */}
                  <div className="flex items-center justify-center h-20">
                    {game.imageUrl ? (
                      <img src={game.imageUrl} alt={game.nombre}
                        className="max-h-20 max-w-[90px] object-contain transition-all duration-300 group-hover:scale-110 group-hover:rotate-[-2deg] group-hover:[filter:drop-shadow(8px_14px_14px_rgba(0,0,0,0.45))_drop-shadow(3px_6px_8px_rgba(0,0,0,0.3))]"
                        style={{ filter: "drop-shadow(3px 5px 5px rgba(0,0,0,0.2))" }} />
                    ) : (
                      <div className="w-16 h-20 bg-gray-200 rounded-lg flex items-center justify-center text-2xl opacity-30">🎲</div>
                    )}
                  </div>
                  {/* Name */}
                  <div className="min-w-0">
                    <p className="text-base font-bold text-gray-900 truncate">{game.nombre}</p>
                  </div>
                  {/* Players */}
                  <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
                    <UsersIcon size={14} className="text-gray-400" />
                    <span>{game.jugadoresDisplay}</span>
                    {hasExtended && <span className="text-amber-500 font-bold">→{extendedMax}</span>}
                  </div>
                  {/* Duration */}
                  <div className="flex items-center justify-center gap-1.5 text-sm text-gray-500">
                    <Clock size={14} className="text-gray-400" />
                    <span>{game.duracion}</span>
                  </div>
                  {/* Days since */}
                  <div className="text-center">
                    {stats.daysSince !== null && stats.daysSince !== undefined ? (
                      <span className={`text-base font-bold ${stats.daysSince <= 7 ? "text-emerald-500" : stats.daysSince <= 30 ? "text-gray-600" : "text-orange-500"}`}>
                        {stats.daysSince === 0 ? "Hoy" : stats.daysSince === 1 ? "Ayer" : `${stats.daysSince}d`}
                      </span>
                    ) : (
                      <span className="text-sm text-orange-400 font-bold">Nunca</span>
                    )}
                  </div>
                  {/* Play count */}
                  <div className="text-center">
                    <span className="text-base font-bold text-gray-600">{stats.playCount || 0}</span>
                  </div>
                  {/* Category */}
                  <div className="flex justify-center">
                    {cat ? (
                      <span className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ${catColorMap[cat] || "bg-gray-100 text-gray-500"}`}>{cat}</span>
                    ) : (
                      <span className="text-xs text-gray-300">—</span>
                    )}
                  </div>
                  {/* Owners */}
                  <div className="flex justify-center">
                    <div className="flex items-center -space-x-2.5">
                      {game.owners.slice(0, 4).map((owner, i) => {
                        const ownerData = ownersData.find((o) => o.nombre === owner);
                        return ownerData?.avatar ? (
                          <img key={i} src={ownerData.avatar} alt={owner} title={owner}
                            className="w-10 h-10 rounded-full object-cover border-[3px] border-orange-400 shadow-sm" />
                        ) : (
                          <span key={i} title={owner}
                            className="w-10 h-10 rounded-full bg-gray-200 border-[3px] border-orange-400 flex items-center justify-center text-sm font-bold text-gray-400">
                            {owner.charAt(0)}
                          </span>
                        );
                      })}
                      {game.owners.length > 4 && (
                        <span className="w-10 h-10 rounded-full bg-gray-100 border-[3px] border-orange-400 flex items-center justify-center text-xs font-bold text-gray-400">
                          +{game.owners.length - 4}
                        </span>
                      )}
                    </div>
                  </div>
                </ListRow>
              );
            })}
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
          gameConfig={gameConfigs[selectedGame.id]}
          players={players}
          onClose={() => setSelectedGame(null)}
          onEdit={() => setEditingGame(selectedGame)}
        />
      )}
      {editingGame && (
        <EditGameForm
          game={editingGame}
          players={players}
          gameConfig={gameConfigs[editingGame.id]}
          onSave={(changes) => handleEditGame(editingGame.id, changes)}
          onClose={() => setEditingGame(null)}
          onConfigChange={handleConfigChange}
        />
      )}
      {showAddForm && <AddGameForm games={games} players={players} preloadOwner={addFormPreloadOwner} onAdd={handleAddGame} onClose={() => { setShowAddForm(false); setAddFormPreloadOwner(null); }} />}
      {showQuickPicker && <QuickPicker games={games} onClose={() => setShowQuickPicker(false)} />}
      {showMarathon && <RandomPicker games={games} onClose={() => setShowMarathon(false)} />}
      {showLeaderboard && <Leaderboard victories={victories} games={games} players={players} onAddVictory={handleAddVictory} onClose={() => setShowLeaderboard(false)} />}
      {showHistory && <GameHistoryPanel games={games} players={players} gameConfigs={gameConfigs} onClose={() => setShowHistory(false)} />}
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
              saveGameOverride(game.id, { owners: game.owners });
            } else if (action === "new") {
              setShowOwners(false);
              setAddFormPreloadOwner(preloadOwner || null);
              setShowAddForm(true);
            }
          }}
          onRemoveOwnerFromGame={(gameId, ownerName) => {
            const game = games.find((g) => g.id === gameId);
            if (!game) return;
            const newOwners = game.owners.filter((o) => o !== ownerName);
            setGames((prev) => prev.map((g) => g.id === gameId ? { ...g, owners: newOwners } : g));
            saveGameOverride(gameId, { owners: newOwners });
          }}
        />
      )}
      {showDice && <DiceRoller onClose={() => setShowDice(false)} />}
      {showSettings && <SettingsPanel games={games} onClose={() => setShowSettings(false)} />}
    </div>
  );
}

export default App;
