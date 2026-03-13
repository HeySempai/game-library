import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { categoryMap, allCategories } from "../data/categories";

export default function EditGameForm({ game, players, onSave, onClose }) {
  const [nombre, setNombre] = useState(game.nombre);
  const [owners, setOwners] = useState([...game.owners]);
  const [category, setCategory] = useState(categoryMap[game.id] || "");
  const [newOwner, setNewOwner] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ nombre: nombre.trim() || game.nombre, owners, category });
    onClose();
  };

  const toggleOwner = (name) => {
    if (owners.includes(name)) {
      setOwners(owners.filter((o) => o !== name));
    } else {
      setOwners([...owners, name]);
    }
  };

  const addOwner = () => {
    const name = newOwner.trim();
    if (name && !owners.includes(name)) {
      setOwners([...owners, name]);
      setNewOwner("");
    }
  };

  const removeOwner = (name) => {
    setOwners(owners.filter((o) => o !== name));
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">Editar: {game.nombre}</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Categoría</label>
            <div className="flex flex-wrap gap-2">
              {allCategories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    category === cat
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {cat}
                </button>
              ))}
              {category && (
                <button
                  type="button"
                  onClick={() => setCategory("")}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-50 text-red-400 hover:bg-red-100 cursor-pointer"
                >
                  Sin categoría
                </button>
              )}
            </div>
          </div>

          {/* Owners */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Owners</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {players.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggleOwner(p)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    owners.includes(p)
                      ? "bg-orange-500 border-orange-400 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            {owners
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
            Guardar Cambios
          </button>
        </form>
      </div>
    </div>
  );
}
