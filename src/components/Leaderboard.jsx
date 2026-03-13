import { useState, useEffect } from "react";
import { X, Trophy, Plus, Crown, Medal, Award } from "lucide-react";
import { loadGameSessions, loadSessionParticipants } from "../utils/storage";

export default function Leaderboard({ victories, games, players, onAddVictory, onClose }) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedGame, setSelectedGame] = useState("");
  const [selectedWinner, setSelectedWinner] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [sessionStats, setSessionStats] = useState({ playerWins: {}, gameStats: {} });

  const baseGames = games.filter((g) => g.tipo === "Juego Base");

  // Load session-based stats
  useEffect(() => {
    const load = async () => {
      const sessions = await loadGameSessions();
      if (sessions.length === 0) { setSessionStats({ playerWins: {}, gameStats: {} }); return; }
      const pm = await loadSessionParticipants(sessions.map((s) => s.id));
      const pw = {};
      const gs = {};
      Object.values(pm).flat().forEach((p) => {
        if (p.is_winner) {
          pw[p.player_name] = (pw[p.player_name] || 0) + 1;
          // Find session to get game_id
          const session = sessions.find((s) => s.id === p.session_id);
          if (session) {
            if (!gs[session.game_id]) gs[session.game_id] = {};
            gs[session.game_id][p.player_name] = (gs[session.game_id][p.player_name] || 0) + 1;
          }
        }
      });
      setSessionStats({ playerWins: pw, gameStats: gs });
    };
    load();
  }, []);

  // Merge legacy victories + new session stats
  const playerWins = {};
  players.forEach((p) => (playerWins[p] = 0));
  // Legacy victories
  victories.forEach((v) => {
    if (!playerWins[v.winner]) playerWins[v.winner] = 0;
    playerWins[v.winner]++;
  });
  // Session-based wins
  Object.entries(sessionStats.playerWins).forEach(([name, count]) => {
    if (!playerWins[name]) playerWins[name] = 0;
    playerWins[name] += count;
  });

  const sorted = Object.entries(playerWins).sort((a, b) => b[1] - a[1]);

  // Merge game stats
  const gameStats = {};
  victories.forEach((v) => {
    if (!gameStats[v.gameId]) gameStats[v.gameId] = {};
    if (!gameStats[v.gameId][v.winner]) gameStats[v.gameId][v.winner] = 0;
    gameStats[v.gameId][v.winner]++;
  });
  Object.entries(sessionStats.gameStats).forEach(([gameId, winners]) => {
    if (!gameStats[gameId]) gameStats[gameId] = {};
    Object.entries(winners).forEach(([name, count]) => {
      gameStats[gameId][name] = (gameStats[gameId][name] || 0) + count;
    });
  });

  const handleAddVictory = (e) => {
    e.preventDefault();
    if (!selectedGame || !selectedWinner) return;
    onAddVictory({ id: Date.now().toString(), gameId: selectedGame, winner: selectedWinner, date });
    setSelectedGame("");
    setSelectedWinner("");
    setShowAddForm(false);
  };

  const medalIcons = [
    <Crown key="g" size={18} className="text-amber-400" />,
    <Medal key="s" size={18} className="text-gray-400" />,
    <Award key="b" size={18} className="text-amber-600" />,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Trophy size={20} className="text-amber-400" /> Leaderboard
          </h2>
          <div className="flex gap-2">
            <button onClick={() => setShowAddForm(!showAddForm)} className="p-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 text-white cursor-pointer" title="Registrar victoria">
              <Plus size={16} />
            </button>
            <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"><X size={20} /></button>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {showAddForm && (
            <form onSubmit={handleAddVictory} className="bg-gray-50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Registrar Victoria (Legacy)</h4>
              <select value={selectedGame} onChange={(e) => setSelectedGame(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" required>
                <option value="">Seleccionar juego...</option>
                {baseGames.map((g) => (<option key={g.id} value={g.id}>{g.nombre}</option>))}
              </select>
              <select value={selectedWinner} onChange={(e) => setSelectedWinner(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" required>
                <option value="">Seleccionar ganador...</option>
                {players.map((p) => (<option key={p} value={p}>{p}</option>))}
              </select>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" />
              <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2 rounded-lg text-sm cursor-pointer">Registrar</button>
            </form>
          )}

          <div>
            <h4 className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Ranking Global</h4>
            <div className="space-y-2">
              {sorted.map(([player, wins], i) => (
                <div key={player} className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all ${
                  i === 0 && wins > 0 ? "bg-amber-50 border border-amber-200" :
                  i === 1 && wins > 0 ? "bg-gray-50 border border-gray-200" :
                  i === 2 && wins > 0 ? "bg-orange-50 border border-orange-200" :
                  "bg-gray-50 border border-gray-100"
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="w-6 text-center">
                      {i < 3 && wins > 0 ? medalIcons[i] : <span className="text-sm text-gray-400 font-bold">{i + 1}</span>}
                    </span>
                    <span className="font-medium text-gray-900">{player}</span>
                  </div>
                  <span className="text-lg font-bold text-orange-500">{wins}</span>
                </div>
              ))}
            </div>
          </div>

          {Object.keys(gameStats).length > 0 && (
            <div>
              <h4 className="text-[10px] font-semibold text-gray-400 mb-3 uppercase tracking-wider">Victorias por Juego</h4>
              <div className="space-y-2">
                {Object.entries(gameStats).map(([gameId, winners]) => {
                  const game = games.find((g) => g.id === gameId);
                  if (!game) return null;
                  return (
                    <div key={gameId} className="bg-gray-50 rounded-xl p-3">
                      <p className="text-sm font-semibold text-gray-900 mb-2">{game.nombre}</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(winners).sort((a, b) => b[1] - a[1]).map(([name, count]) => (
                          <span key={name} className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">{name}: {count}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {victories.length === 0 && Object.keys(sessionStats.playerWins).length === 0 && (
            <p className="text-center text-gray-400 py-4">No hay victorias registradas aún.</p>
          )}
        </div>
      </div>
    </div>
  );
}
