import { useState, useCallback } from "react";
import { X, Dices, RotateCcw } from "lucide-react";

const DICE_FACES = {
  1: [false, false, false, false, true, false, false, false, false],
  2: [false, false, true, false, false, false, true, false, false],
  3: [false, false, true, false, true, false, true, false, false],
  4: [true, false, true, false, false, false, true, false, true],
  5: [true, false, true, false, true, false, true, false, true],
  6: [true, false, true, true, false, true, true, false, true],
};

function DiceFace({ value, rolling, index }) {
  const dots = DICE_FACES[value];
  return (
    <div
      className={`relative w-20 h-20 bg-white rounded-2xl shadow-lg border border-gray-100 grid grid-cols-3 grid-rows-3 p-2.5 gap-0.5 select-none ${
        rolling ? "animate-dice-roll" : "animate-dice-land"
      }`}
      style={{ animationDelay: rolling ? `${index * 60}ms` : `${index * 40}ms` }}
    >
      {dots.map((show, i) => (
        <div key={i} className="flex items-center justify-center">
          {show && (
            <div className="w-3.5 h-3.5 rounded-full bg-gray-800 shadow-inner" />
          )}
        </div>
      ))}
    </div>
  );
}

function CoinFace({ value, flipping, index }) {
  return (
    <div
      className={`relative w-20 h-20 rounded-full shadow-lg flex items-center justify-center select-none font-bold text-lg tracking-wide ${
        value === "Cara"
          ? "bg-gradient-to-br from-amber-300 to-yellow-500 text-amber-900"
          : "bg-gradient-to-br from-gray-300 to-gray-400 text-gray-700"
      } ${flipping ? "animate-coin-flip" : "animate-dice-land"}`}
      style={{ animationDelay: flipping ? `${index * 80}ms` : `${index * 40}ms` }}
    >
      <span className="text-sm font-extrabold uppercase">{value}</span>
    </div>
  );
}

export default function DiceRoller({ onClose }) {
  const [mode, setMode] = useState("dice"); // "dice" | "coin"
  const [diceCount, setDiceCount] = useState(2);
  const [results, setResults] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [history, setHistory] = useState([]);

  const roll = useCallback(() => {
    setRolling(true);
    // Quick intermediate visual randomization
    const intervalId = setInterval(() => {
      if (mode === "dice") {
        setResults(Array.from({ length: diceCount }, () => Math.ceil(Math.random() * 6)));
      } else {
        setResults(Array.from({ length: diceCount }, () => (Math.random() > 0.5 ? "Cara" : "Cruz")));
      }
    }, 60);

    setTimeout(() => {
      clearInterval(intervalId);
      const final =
        mode === "dice"
          ? Array.from({ length: diceCount }, () => Math.ceil(Math.random() * 6))
          : Array.from({ length: diceCount }, () => (Math.random() > 0.5 ? "Cara" : "Cruz"));
      setResults(final);
      setRolling(false);
      setHistory((prev) => [{ mode, results: final, time: new Date() }, ...prev].slice(0, 20));
    }, 600);
  }, [mode, diceCount]);

  const total = mode === "dice" && results.length > 0 ? results.reduce((a, b) => a + b, 0) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-5 pb-3">
          <div className="flex items-center gap-2">
            <Dices size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold text-gray-900">Simulador</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 text-gray-400 transition-colors cursor-pointer">
            <X size={18} />
          </button>
        </div>

        {/* Mode toggle */}
        <div className="px-5 pb-4">
          <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode("dice"); setResults([]); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                mode === "dice" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🎲 Dados
            </button>
            <button
              onClick={() => { setMode("coin"); setResults([]); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer ${
                mode === "coin" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              🪙 Moneda
            </button>
          </div>
        </div>

        {/* Count selector */}
        <div className="px-5 pb-4">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            {mode === "dice" ? "Cantidad de dados" : "Cantidad de monedas"}
          </p>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <button
                key={n}
                onClick={() => { setDiceCount(n); setResults([]); }}
                className={`w-9 h-9 rounded-lg text-sm font-bold transition-all cursor-pointer ${
                  diceCount === n
                    ? "bg-orange-500 text-white shadow-sm"
                    : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        {/* Results area */}
        <div className="px-5 pb-2 min-h-[140px] flex flex-col items-center justify-center">
          {results.length > 0 ? (
            <>
              <div className="flex flex-wrap gap-3 justify-center">
                {results.map((val, i) =>
                  mode === "dice" ? (
                    <DiceFace key={i} value={val} rolling={rolling} index={i} />
                  ) : (
                    <CoinFace key={i} value={val} flipping={rolling} index={i} />
                  )
                )}
              </div>
              {total !== null && !rolling && (
                <div className="mt-4 text-center animate-fade-in">
                  <span className="text-3xl font-black text-gray-900">{total}</span>
                  <span className="text-sm text-gray-400 ml-1.5">total</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-300 text-sm">
              {mode === "dice" ? "Presiona para tirar" : "Presiona para lanzar"}
            </p>
          )}
        </div>

        {/* Roll button */}
        <div className="px-5 pb-5 pt-2">
          <button
            onClick={roll}
            disabled={rolling}
            className={`w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all cursor-pointer ${
              rolling
                ? "bg-orange-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600 active:scale-[0.98] shadow-md hover:shadow-lg"
            }`}
          >
            {rolling ? "..." : mode === "dice" ? "🎲  Tirar dados" : "🪙  Lanzar moneda"}
          </button>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="px-5 pb-5 border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Historial</p>
              <button onClick={() => setHistory([])} className="text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer flex items-center gap-1">
                <RotateCcw size={10} /> Limpiar
              </button>
            </div>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {history.map((entry, i) => (
                <div key={i} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                  <span className="text-gray-500">
                    {entry.mode === "dice" ? "🎲" : "🪙"}{" "}
                    {entry.results.join(", ")}
                  </span>
                  {entry.mode === "dice" && (
                    <span className="font-bold text-gray-700">
                      = {entry.results.reduce((a, b) => a + b, 0)}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
