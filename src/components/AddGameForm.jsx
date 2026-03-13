import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";

export default function AddGameForm({ games, players, onAdd, onClose }) {
  const baseGames = games.filter((g) => g.tipo === "Juego Base");

  const [form, setForm] = useState({
    tipo: "Juego Base",
    nombre: "",
    duracion: "",
    minJugadores: "",
    maxJugadores: "",
    developer: "",
    owners: [],
    parentId: "",
  });

  const [newOwner, setNewOwner] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.nombre.trim()) return;

    const id = form.nombre
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+$/, "");

    let jugadoresDisplay = "";
    if (form.tipo === "Juego Base") {
      jugadoresDisplay = `${form.minJugadores}-${form.maxJugadores}`;
    } else if (form.tipo === "Ampliacion") {
      jugadoresDisplay = `→ ${form.minJugadores}-${form.maxJugadores}`;
    } else {
      jugadoresDisplay = "= Base";
    }

    const newGame = {
      id,
      tipo: form.tipo,
      nombre: form.nombre.trim(),
      duracion: form.duracion.trim(),
      minJugadores:
        form.tipo === "Expansion" ? null : parseInt(form.minJugadores) || null,
      maxJugadores:
        form.tipo === "Expansion" ? null : parseInt(form.maxJugadores) || null,
      jugadoresDisplay,
      developer: form.developer.trim(),
      owners: form.owners,
      parentId: form.parentId || null,
      imageUrl: "",
    };

    onAdd(newGame);
    onClose();
  };

  const addOwner = () => {
    const name = newOwner.trim();
    if (name && !form.owners.includes(name)) {
      setForm({ ...form, owners: [...form.owners, name] });
      setNewOwner("");
    }
  };

  const toggleOwner = (name) => {
    if (form.owners.includes(name)) {
      setForm({ ...form, owners: form.owners.filter((o) => o !== name) });
    } else {
      setForm({ ...form, owners: [...form.owners, name] });
    }
  };

  const removeOwner = (name) => {
    setForm({ ...form, owners: form.owners.filter((o) => o !== name) });
  };

  const isExpOrAmp = form.tipo === "Expansion" || form.tipo === "Ampliacion";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Agregar Juego</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Tipo
            </label>
            <div className="flex gap-2">
              {["Juego Base", "Ampliacion", "Expansion"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setForm({ ...form, tipo: t })}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                    form.tipo === t
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Parent game */}
          {isExpOrAmp && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">
                Juego Base
              </label>
              <select
                value={form.parentId}
                onChange={(e) =>
                  setForm({ ...form, parentId: e.target.value })
                }
                className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none"
              >
                <option value="">Seleccionar juego base...</option>
                {baseGames.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none"
              placeholder="Nombre del juego..."
              required
            />
          </div>

          {/* Duracion */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Duración
            </label>
            <input
              type="text"
              value={form.duracion}
              onChange={(e) => setForm({ ...form, duracion: e.target.value })}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none"
              placeholder="ej. 30-60 mins"
            />
          </div>

          {/* Jugadores */}
          {form.tipo !== "Expansion" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Min Jugadores
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.minJugadores}
                  onChange={(e) =>
                    setForm({ ...form, minJugadores: e.target.value })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Max Jugadores
                </label>
                <input
                  type="number"
                  min="1"
                  value={form.maxJugadores}
                  onChange={(e) =>
                    setForm({ ...form, maxJugadores: e.target.value })
                  }
                  className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Developer */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Developer
            </label>
            <input
              type="text"
              value={form.developer}
              onChange={(e) =>
                setForm({ ...form, developer: e.target.value })
              }
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-gray-700 text-sm focus:border-orange-400 focus:outline-none"
              placeholder="Publisher / Developer"
            />
          </div>

          {/* Owners */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">
              Owners
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {players.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleOwner(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    form.owners.includes(p)
                      ? "bg-orange-500 border-orange-400 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {/* Selected owners not in known players */}
            {form.owners
              .filter((o) => !players.includes(o))
              .map((o) => (
                <span
                  key={o}
                  className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full mr-1 mb-1"
                >
                  {o}
                  <button type="button" onClick={() => removeOwner(o)} className="cursor-pointer">
                    <Trash2 size={10} />
                  </button>
                </span>
              ))}
            <div className="flex gap-2 mt-1">
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOwner();
                  }
                }}
                className="flex-1 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 text-xs focus:border-orange-400 focus:outline-none"
                placeholder="Nuevo owner..."
              />
              <button
                type="button"
                onClick={addOwner}
                className="p-1.5 bg-orange-500 rounded-lg hover:bg-orange-400 text-white cursor-pointer"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-orange-500 hover:bg-orange-400 text-white font-semibold py-2.5 rounded-xl transition-colors cursor-pointer"
          >
            Agregar Juego
          </button>
        </form>
      </div>
    </div>
  );
}
