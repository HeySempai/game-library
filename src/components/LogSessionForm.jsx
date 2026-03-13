import { useState } from "react";
import { X, Plus, Trash2, Trophy, Users, Clock, Save } from "lucide-react";

const VICTORY_LABELS = {
  score_descending: "Puntaje (Mayor gana)",
  score_ascending: "Puntaje (Menor gana)",
  absolute_winner: "Ganador absoluto",
  team_winner: "Por equipos",
  cooperative: "Cooperativo",
  no_winner: "Sin ganador",
};

export default function LogSessionForm({ game, victoryType, teamMode, players, onSave, onClose }) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [durationMinutes, setDurationMinutes] = useState("");
  const [notes, setNotes] = useState("");
  const [participants, setParticipants] = useState(
    players.slice(0, 4).map((p) => ({ playerName: p, score: "", isWinner: false, team: "" }))
  );
  const [cooperativeWin, setCooperativeWin] = useState(null);

  const isScoreBased = victoryType === "score_descending" || victoryType === "score_ascending";

  const addParticipant = () => {
    setParticipants([...participants, { playerName: "", score: "", isWinner: false, team: "" }]);
  };

  const removeParticipant = (i) => {
    setParticipants(participants.filter((_, idx) => idx !== i));
  };

  const updateParticipant = (i, field, value) => {
    setParticipants(participants.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const selectWinner = (i) => {
    if (victoryType === "team_winner") {
      updateParticipant(i, "isWinner", !participants[i].isWinner);
    } else {
      setParticipants(participants.map((p, idx) => ({ ...p, isWinner: idx === i })));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validParticipants = participants.filter((p) => p.playerName.trim());
    if (validParticipants.length === 0 && victoryType !== "no_winner") return;

    // Auto-calculate winner for score-based games
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
          ...p,
          isWinner: p.score === best,
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Victory type badge */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide">
              {VICTORY_LABELS[victoryType] || victoryType}
            </span>
            {teamMode && (
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-sky-100 text-sky-600 uppercase tracking-wide">
                {teamMode === "random_teams" ? "Equipos random" : teamMode === "one_vs_all" ? "1 vs Todos" : "Equipos fijos"}
              </span>
            )}
          </div>

          {/* Date & Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Fecha</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Duración (min)</label>
              <input type="number" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} placeholder="60"
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none" />
            </div>
          </div>

          {/* Cooperative: win/loss toggle */}
          {victoryType === "cooperative" && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Resultado</label>
              <div className="flex gap-2">
                <button type="button" onClick={() => setCooperativeWin(true)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${cooperativeWin === true ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  🎉 Victoria
                </button>
                <button type="button" onClick={() => setCooperativeWin(false)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors cursor-pointer ${cooperativeWin === false ? "bg-red-500 text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  💀 Derrota
                </button>
              </div>
            </div>
          )}

          {/* Participants */}
          {victoryType !== "no_winner" && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-gray-500">Jugadores</label>
                <button type="button" onClick={addParticipant} className="flex items-center gap-1 text-xs text-orange-500 hover:text-orange-600 cursor-pointer">
                  <Plus size={12} /> Agregar
                </button>
              </div>
              <div className="space-y-2">
                {participants.map((p, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <select value={p.playerName} onChange={(e) => updateParticipant(i, "playerName", e.target.value)}
                      className="flex-1 bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none">
                      <option value="">Jugador...</option>
                      {players.map((pl) => <option key={pl} value={pl}>{pl}</option>)}
                    </select>

                    {isScoreBased && (
                      <input type="number" value={p.score} onChange={(e) => updateParticipant(i, "score", e.target.value)}
                        placeholder="Pts" className="w-20 bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 text-center focus:border-orange-400 focus:outline-none" />
                    )}

                    {victoryType === "team_winner" && (
                      <input type="text" value={p.team} onChange={(e) => updateParticipant(i, "team", e.target.value)}
                        placeholder="Equipo" className="w-24 bg-white border border-gray-200 rounded-lg px-2 py-2 text-sm text-gray-700 focus:border-orange-400 focus:outline-none" />
                    )}

                    {(victoryType === "absolute_winner" || victoryType === "team_winner") && (
                      <button type="button" onClick={() => selectWinner(i)}
                        className={`p-2 rounded-lg transition-colors cursor-pointer ${p.isWinner ? "bg-amber-100 text-amber-500" : "bg-gray-100 text-gray-300 hover:text-gray-400"}`}
                        title="Ganador">
                        <Trophy size={14} />
                      </button>
                    )}

                    <button type="button" onClick={() => removeParticipant(i)} className="p-2 text-gray-300 hover:text-red-400 cursor-pointer">
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
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
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none resize-none" />
          </div>

          <button type="submit" className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2">
            <Save size={16} /> Registrar Partida
          </button>
        </form>
      </div>
    </div>
  );
}
