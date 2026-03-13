import { useState, useMemo } from "react";
import { X, Plus, Trash2, Trophy, Save, Check, Package, Swords, Crown, Shield, Star, UserPlus } from "lucide-react";
import { ownersData } from "../data/owners";
import { getEffectivePlayerRange } from "../utils/storage";

const avatarMap = {};
ownersData.forEach((o) => { avatarMap[o.nombre] = o.avatar; });

const VICTORY_LABELS = {
  score_descending: "Puntaje (Mayor gana)",
  score_ascending: "Puntaje (Menor gana)",
  absolute_winner: "Ganador absoluto",
  team_winner: "Por equipos",
  cooperative: "Cooperativo",
  no_winner: "Sin ganador",
};

// Predefined team configs per game
const TEAM_PRESETS = {
  samurai: {
    label: "Facciones",
    teams: [
      { name: "Ronin", color: "bg-red-500", textColor: "text-white", max: 1, icon: "Swords" },
      { name: "Shogun", color: "bg-amber-400", textColor: "text-amber-900", max: 1, icon: "Crown" },
      { name: "Samurai", color: "bg-amber-400", textColor: "text-amber-900", icon: "SamuraiHelmet" },
      { name: "Ninja", color: "bg-blue-500", textColor: "text-white", icon: "Star" },
    ],
    // Distribution per player count: [Ronin, Shogun, Samurai, Ninja]
    distribution: {
      3: [1, 1, 0, 1],
      4: [1, 1, 0, 2],
      5: [1, 1, 0, 3],
      6: [1, 1, 1, 3],
      7: [1, 1, 2, 3],
    },
    requireAllTeams: false, // Not all teams required at low counts (e.g. 3p has no Samurai)
  },
  "salem-1692": {
    label: "Roles",
    teams: [
      { name: "Bruja", color: "bg-purple-500", textColor: "text-white" },
      { name: "Aldeano", color: "bg-emerald-500", textColor: "text-white" },
    ],
  },
  "con-base": {
    label: "Formato",
    formats: [
      { id: "1v1", name: "1 vs 1", maxPlayers: 2, teams: null },
      { id: "2v2", name: "2 vs 2", maxPlayers: 4, teams: [
        { name: "Equipo 1", color: "bg-sky-500", textColor: "text-white" },
        { name: "Equipo 2", color: "bg-rose-500", textColor: "text-white" },
      ]},
    ],
    requireAllTeams: true,
  },
  betrayal: {
    label: "Modo",
    formats: [
      { id: "1vAll", name: "1 vs Todos", maxPlayers: 6, teams: [
        { name: "Traidor", color: "bg-red-600", textColor: "text-white" },
        { name: "Héroes", color: "bg-sky-500", textColor: "text-white" },
      ]},
      { id: "free", name: "Todos contra todos", maxPlayers: 6, teams: null },
    ],
  },
  saboteur: {
    label: "Facciones",
    teams: [
      { name: "Minero", color: "bg-amber-500", textColor: "text-white" },
      { name: "Saboteador", color: "bg-gray-700", textColor: "text-white" },
    ],
  },
};

export default function LogSessionForm({ game, victoryType, teamMode, players, allGames, onSave, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [cooperativeWin, setCooperativeWin] = useState(null);

  // Expansions
  const expansions = useMemo(() =>
    (allGames || []).filter((g) => g.parentId === game.id && (g.tipo === "Expansion" || g.tipo === "Ampliacion")),
    [game.id, allGames]
  );
  const [selectedExpansions, setSelectedExpansions] = useState([]);

  // Max players calculation (considering selected expansions)
  const maxPlayers = useMemo(() => {
    let max = game.maxJugadores || 99;
    selectedExpansions.forEach((expId) => {
      const exp = expansions.find((e) => e.id === expId);
      if (exp?.maxJugadores && exp.maxJugadores > max) max = exp.maxJugadores;
    });
    return max;
  }, [game, expansions, selectedExpansions]);

  // Team preset
  const preset = TEAM_PRESETS[game.id] || null;
  const [selectedFormat, setSelectedFormat] = useState(preset?.formats?.[0]?.id || null);

  const activeFormat = preset?.formats?.find((f) => f.id === selectedFormat) || null;
  const activeTeams = activeFormat?.teams || preset?.teams || null;
  const effectiveMaxPlayers = activeFormat?.maxPlayers || maxPlayers;

  // Helper: assign team based on index and active teams
  const assignTeam = (index, teams, totalPlayers, presetObj) => {
    if (!teams || teams.length === 0) return "";

    // Use explicit distribution map if available
    const dist = presetObj?.distribution?.[totalPlayers];
    if (dist) {
      const assignments = [];
      teams.forEach((t, ti) => {
        for (let c = 0; c < (dist[ti] || 0); c++) assignments.push(t.name);
      });
      return assignments[index] || teams[teams.length - 1].name;
    }

    // Smart assignment for presets with max constraints
    const hasMaxConstraints = teams.some((t) => t.max);
    if (hasMaxConstraints) {
      const assignments = [];
      const constrained = teams.filter((t) => t.max);
      const unconstrained = teams.filter((t) => !t.max);
      constrained.forEach((t) => {
        for (let c = 0; c < (t.max || 1); c++) assignments.push(t.name);
      });
      const remaining = (totalPlayers || effectiveMaxPlayers) - assignments.length;
      if (unconstrained.length > 0) {
        for (let r = 0; r < remaining; r++) {
          assignments.push(unconstrained[r % unconstrained.length].name);
        }
      }
      return assignments[index] || unconstrained[0]?.name || teams[0].name;
    }

    // Default: distribute evenly
    const total = totalPlayers || effectiveMaxPlayers;
    const perTeam = Math.ceil(total / teams.length);
    const teamIdx = Math.min(Math.floor(index / perTeam), teams.length - 1);
    return teams[teamIdx].name;
  };

  // Participants — preload all 6 players (up to max)
  const initialPlayers = useMemo(() => {
    const fmt = preset?.formats?.[0];
    const teams = fmt?.teams || preset?.teams || null;
    const max = fmt?.maxPlayers || maxPlayers;
    const count = Math.min(players.length, max);
    return players.slice(0, count).map((p, idx) => ({
      playerName: p, score: "", isWinner: false,
      team: teams ? assignTeam(idx, teams, count, preset) : "",
    }));
  }, []);
  const [participants, setParticipants] = useState(initialPlayers);

  // When format changes, reset participants to fit new max and teams
  const handleFormatChange = (formatId) => {
    setSelectedFormat(formatId);
    const fmt = preset?.formats?.find((f) => f.id === formatId);
    const newMax = fmt?.maxPlayers || maxPlayers;
    const newTeams = fmt?.teams || null;
    const count = Math.min(players.length, newMax);
    setParticipants(players.slice(0, count).map((p, idx) => ({
      playerName: p, score: "", isWinner: false,
      team: newTeams ? assignTeam(idx, newTeams, count) : "",
    })));
  };

  const isScoreBased = victoryType === "score_descending" || victoryType === "score_ascending";

  // Team validation for presets
  const teamValidation = useMemo(() => {
    const teams = activeTeams;
    const presetConfig = preset;
    const errors = [];

    if (teams) {
      const validParticipants = participants.filter((p) => p.playerName.trim());
      const playerCount = validParticipants.length;

      // Check distribution constraints if available
      const dist = presetConfig?.distribution?.[playerCount];
      if (dist) {
        teams.forEach((t, ti) => {
          const expected = dist[ti];
          const actual = validParticipants.filter((p) => p.team === t.name).length;
          if (expected > 0 && actual !== expected) {
            errors.push(`${t.name}: debe haber ${expected}, hay ${actual}`);
          }
          if (expected === 0 && actual > 0) {
            errors.push(`${t.name}: no aplica con ${playerCount} jugadores`);
          }
        });
      } else if (activeFormat?.maxPlayers && teams.length > 0) {
        // Format-based: each team must have equal players (maxPlayers / teams)
        const perTeam = Math.floor(activeFormat.maxPlayers / teams.length);
        if (playerCount !== activeFormat.maxPlayers) {
          errors.push(`Se necesitan exactamente ${activeFormat.maxPlayers} jugadores`);
        }
        teams.forEach((t) => {
          const count = validParticipants.filter((p) => p.team === t.name).length;
          if (count !== perTeam) errors.push(`${t.name}: debe tener ${perTeam}, tiene ${count}`);
        });
      } else if (presetConfig?.requireAllTeams) {
        teams.forEach((t) => {
          const count = validParticipants.filter((p) => p.team === t.name).length;
          if (count === 0) errors.push(`Falta asignar: ${t.name}`);
          if (t.max && count > t.max) errors.push(`${t.name}: máximo ${t.max}`);
        });
      }

      // Always check max constraints
      teams.forEach((t) => {
        if (t.max) {
          const count = validParticipants.filter((p) => p.team === t.name).length;
          if (count > t.max) errors.push(`${t.name}: máximo ${t.max}`);
        }
      });

      // Check no unassigned players
      const unassigned = validParticipants.filter((p) => !p.team);
      if (unassigned.length > 0) errors.push(`${unassigned.length} jugador(es) sin equipo`);
    }

    return { valid: errors.length === 0, errors };
  }, [participants, activeTeams, preset, activeFormat]);

  // Global form validation
  const formValidation = useMemo(() => {
    const errors = [];
    const validParticipants = participants.filter((p) => p.playerName.trim());

    // Duration required
    if (!durationMinutes || parseInt(durationMinutes) <= 0) {
      errors.push("Duración requerida");
    }

    // Players required (except no_winner)
    if (victoryType !== "no_winner" && validParticipants.length === 0) {
      errors.push("Agrega al menos un jugador");
    }

    // Winner required for absolute_winner and team_winner
    if (victoryType === "absolute_winner" || victoryType === "team_winner") {
      const hasWinner = validParticipants.some((p) => p.isWinner);
      if (!hasWinner) errors.push("Selecciona un ganador");
    }

    // Cooperative must have result
    if (victoryType === "cooperative" && cooperativeWin === null) {
      errors.push("Selecciona victoria o derrota");
    }

    // Score-based: at least one score required
    if (isScoreBased) {
      const hasScore = validParticipants.some((p) => p.score !== "");
      if (!hasScore) errors.push("Ingresa al menos un puntaje");
    }

    return { valid: errors.length === 0, errors };
  }, [participants, durationMinutes, victoryType, cooperativeWin, isScoreBased]);

  // Already-selected player names
  const usedNames = participants.map((p) => p.playerName).filter(Boolean);
  const canAddMore = participants.length < effectiveMaxPlayers;

  const addParticipant = () => {
    if (!canAddMore) return;
    const available = players.filter((p) => !usedNames.includes(p));
    const newIdx = participants.length;
    setParticipants([...participants, {
      playerName: available[0] || "", score: "", isWinner: false,
      team: activeTeams ? assignTeam(newIdx, activeTeams, participants.length + 1, preset) : "",
    }]);
  };

  const removeParticipant = (i) => {
    setParticipants(participants.filter((_, idx) => idx !== i));
  };

  const updateParticipant = (i, field, value) => {
    setParticipants(participants.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const togglePlayer = (playerName) => {
    if (usedNames.includes(playerName)) {
      setParticipants(participants.filter((p) => p.playerName !== playerName));
    } else if (canAddMore) {
      const newIdx = participants.length;
      setParticipants([...participants, {
        playerName, score: "", isWinner: false,
        team: activeTeams ? assignTeam(newIdx, activeTeams) : "",
      }]);
    }
  };

  const selectWinner = (i) => {
    if (victoryType === "team_winner" && activeTeams) {
      // Toggle winner for entire team
      const clickedTeam = participants[i].team;
      const newWinState = !participants[i].isWinner;
      setParticipants(participants.map((p) => ({
        ...p,
        isWinner: p.team === clickedTeam ? newWinState : false,
      })));
    } else if (victoryType === "team_winner") {
      updateParticipant(i, "isWinner", !participants[i].isWinner);
    } else {
      setParticipants(participants.map((p, idx) => ({ ...p, isWinner: idx === i })));
    }
  };

  const toggleExpansion = (expId) => {
    setSelectedExpansions((prev) =>
      prev.includes(expId) ? prev.filter((id) => id !== expId) : [...prev, expId]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validParticipants = participants.filter((p) => p.playerName.trim());
    if (validParticipants.length === 0 && victoryType !== "no_winner") return;

    let finalParticipants = validParticipants.map((p) => ({
      ...p,
      score: p.score !== "" ? parseInt(p.score) : null,
    }));

    if (isScoreBased) {
      const scored = finalParticipants.filter((p) => p.score !== null);
      if (scored.length > 0) {
        const best = victoryType === "score_descending"
          ? Math.max(...scored.map((p) => p.score))
          : Math.min(...scored.map((p) => p.score));
        finalParticipants = finalParticipants.map((p) => ({
          ...p, isWinner: p.score === best,
        }));
      }
    }

    onSave({
      session: {
        gameId: game.id,
        date,
        durationMinutes: durationMinutes ? parseInt(durationMinutes) : null,
        victoryType,
        cooperativeWin: victoryType === "cooperative" ? cooperativeWin : null,
        notes: notes.trim() || null,
      },
      participants: finalParticipants.map((p) => ({
        playerName: p.playerName,
        score: p.score,
        isWinner: victoryType === "cooperative" ? (cooperativeWin || false) : p.isWinner,
        team: p.team || null,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Registrar Partida</h2>
            <p className="text-sm text-gray-400">{game.nombre}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Victory type badge */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide">
              {VICTORY_LABELS[victoryType] || victoryType}
            </span>
            {teamMode && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-600 uppercase tracking-wide">
                {teamMode === "random_teams" ? "Equipos random" : teamMode === "one_vs_all" ? "1 vs Todos" : "Equipos fijos"}
              </span>
            )}
            <span className="text-[10px] font-medium text-gray-400">
              Máx {effectiveMaxPlayers} jugadores
            </span>
          </div>

          {/* Expansions picker */}
          {expansions.length > 0 && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2 flex items-center gap-1">
                <Package size={12} /> Expansiones usadas
              </label>
              <div className="flex flex-wrap gap-2">
                {expansions.map((exp) => {
                  const selected = selectedExpansions.includes(exp.id);
                  return (
                    <button key={exp.id} type="button" onClick={() => toggleExpansion(exp.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer border ${
                        selected
                          ? "bg-orange-50 border-orange-300 text-orange-700"
                          : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                      }`}>
                      {selected && <Check size={12} className="text-orange-500" />}
                      {exp.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Format selector for games with formats */}
          {preset?.formats && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">{preset.label}</label>
              <div className="flex gap-2">
                {preset.formats.map((f) => (
                  <button key={f.id} type="button" onClick={() => handleFormatChange(f.id)}
                    className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${
                      selectedFormat === f.id ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}>
                    {f.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duración (min)</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60"
                className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>

          {/* Cooperative: win/loss toggle */}
          {victoryType === "cooperative" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Resultado</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCooperativeWin(true)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${cooperativeWin === true ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  🎉 Victoria
                </button>
                <button type="button" onClick={() => setCooperativeWin(false)}
                  className={`flex-1 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${cooperativeWin === false ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  💀 Derrota
                </button>
              </div>
            </div>
          )}

          {/* Player avatar grid — toggle on/off */}
          {victoryType !== "no_winner" && (
            <div>
              <label className="text-xs font-medium text-gray-500 mb-3 block">
                Jugadores ({participants.filter((p) => p.playerName).length}/{effectiveMaxPlayers})
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-4">
                {players.map((name) => {
                  const isActive = usedNames.includes(name);
                  const disabled = !isActive && !canAddMore;
                  return (
                    <button key={name} type="button" onClick={() => !disabled && togglePlayer(name)}
                      className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all cursor-pointer border-2 ${
                        isActive
                          ? "border-orange-400 bg-orange-50"
                          : disabled
                            ? "border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed"
                            : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                      }`}>
                      <div className="relative">
                        {avatarMap[name] ? (
                          <img src={avatarMap[name]} alt={name}
                            className={`w-12 h-12 rounded-full object-cover transition-all ${isActive ? "ring-2 ring-orange-400" : "grayscale opacity-60"}`}
                            loading="eager" width={48} height={48} decoding="async" />
                        ) : (
                          <span className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                            isActive ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-400"
                          }`}>{name.charAt(0)}</span>
                        )}
                        {isActive && (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                            <Check size={10} className="text-white" />
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-gray-600 leading-tight text-center">
                        {name.split(" ")[0]}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active participants detail rows */}
              {participants.filter((p) => p.playerName).length > 0 && (
                <div className="space-y-2">
                  {participants.map((p, i) => {
                    if (!p.playerName) return null;
                    return (
                      <div key={p.playerName} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5">
                        {avatarMap[p.playerName] ? (
                          <img src={avatarMap[p.playerName]} alt={p.playerName}
                            className="w-9 h-9 rounded-full object-cover" width={36} height={36} decoding="async" />
                        ) : (
                          <span className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-sm font-bold">
                            {p.playerName.charAt(0)}
                          </span>
                        )}
                        <span className="text-sm font-medium text-gray-700 flex-1">{p.playerName.split(" ")[0]}</span>

                        {isScoreBased && (
                          <input type="number" value={p.score} onChange={(e) => updateParticipant(i, "score", e.target.value)}
                            placeholder="Pts"
                            className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-gray-700 text-center focus:border-orange-400 focus:outline-none" />
                        )}

                        {/* Team selector — only show when teams exist */}
                        {victoryType === "team_winner" && activeTeams && (
                          <div className="flex gap-1.5">
                            {activeTeams.map((t) => {
                              const countInTeam = participants.filter((pp) => pp.playerName && pp.team === t.name).length;
                              const isCurrentTeam = p.team === t.name;
                              const atMax = t.max && countInTeam >= t.max && !isCurrentTeam;
                              const iconMap = { Swords, Crown, Star, Shield };
                              const IconComp = t.icon && t.icon !== "SamuraiHelmet" ? iconMap[t.icon] : null;
                              const isSamurai = t.icon === "SamuraiHelmet";
                              return (
                                <button key={t.name} type="button"
                                  onClick={() => !atMax && updateParticipant(i, "team", t.name)}
                                  disabled={atMax}
                                  title={t.name}
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                                    atMax ? "bg-gray-100 text-gray-300 cursor-not-allowed" :
                                    isCurrentTeam ? `${t.color} ${t.textColor} shadow-md cursor-pointer ring-2 ring-offset-1 ring-current` : "bg-gray-200 text-gray-400 hover:bg-gray-300 cursor-pointer"
                                  }`}>
                                  {IconComp && <IconComp size={18} />}
                                  {isSamurai && (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                      <path d="M4 12c0-4 3.5-8 8-8s8 4 8 8" />
                                      <path d="M2 12h20" />
                                      <path d="M12 4v2" />
                                      <path d="M7 8l1 4" />
                                      <path d="M17 8l-1 4" />
                                    </svg>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {victoryType === "team_winner" && !activeTeams && !activeFormat && (
                          <input type="text" value={p.team} onChange={(e) => updateParticipant(i, "team", e.target.value)}
                            placeholder="Equipo"
                            className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2.5 text-sm text-gray-700 focus:border-orange-400 focus:outline-none" />
                        )}

                        {(victoryType === "absolute_winner" || victoryType === "team_winner") && (
                          <button type="button" onClick={() => selectWinner(i)}
                            className={`p-2.5 rounded-xl transition-colors cursor-pointer ${
                              p.isWinner ? "bg-amber-100 text-amber-500" : "bg-gray-200 text-gray-300 hover:text-gray-400"
                            }`} title="Ganador">
                            <Trophy size={16} />
                          </button>
                        )}

                        <button type="button" onClick={() => removeParticipant(i)}
                          className="p-2 text-gray-300 hover:text-red-400 cursor-pointer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add guest player button */}
              {canAddMore && (
                <button type="button" onClick={addParticipant}
                  className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 hover:border-orange-300 hover:text-orange-500 transition-colors flex items-center justify-center gap-2 text-sm font-medium cursor-pointer">
                  <UserPlus size={16} /> Añadir jugador invitado
                </button>
              )}
            </div>
          )}

          {/* Validation errors */}
          {(!teamValidation.valid || !formValidation.valid) && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
              <p className="text-xs font-semibold text-red-600 mb-1">⚠️ No se puede registrar:</p>
              <ul className="text-xs text-red-500 space-y-0.5">
                {[...teamValidation.errors, ...formValidation.errors].map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* No winner info */}
          {victoryType === "no_winner" && (
            <div className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">🎉 Este juego es solo por diversión, no hay ganador.</p>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Notas (opcional)</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Algo memorable de la partida..."
              className="w-full bg-white border border-gray-200 rounded-xl px-3 py-3 text-gray-700 text-sm focus:border-orange-400 focus:outline-none resize-none" />
          </div>

          <button type="submit" disabled={!teamValidation.valid}
            className={`w-full font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-base ${
              teamValidation.valid
                ? "bg-orange-500 hover:bg-orange-400 text-white cursor-pointer"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}>
            <Save size={18} /> Registrar Partida
          </button>
        </form>
      </div>
    </div>
  );
}
