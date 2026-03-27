import { useState, useEffect } from "react";
import { HelpCircle, Send, Loader2, Trash2, ChevronDown, ChevronRight, Home, BookOpen } from "lucide-react";
import { loadGameFaq, addFaqEntry, deleteFaqEntry, generateFaqAnswer } from "../utils/storage";
import { supabase } from "@/integrations/supabase/client";

export default function PreguntasTab({ gameId, gameIds, booklets }) {
  const [faqs, setFaqs] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  // AI question
  const [question, setQuestion] = useState("");
  const [generating, setGenerating] = useState(false);

  // Available booklet names from DB
  const [availableBooklets, setAvailableBooklets] = useState([]);
  const [selectedBooklets, setSelectedBooklets] = useState(new Set());

  // House rule form
  const [showHouseForm, setShowHouseForm] = useState(false);
  const [hrQuestion, setHrQuestion] = useState("");
  const [hrAnswer, setHrAnswer] = useState("");

  const hasPdfs = booklets && booklets.length > 0;
  const houseRules = faqs.filter((f) => f.is_house_rule);

  useEffect(() => {
    loadGameFaq(gameId).then((data) => { setFaqs(data); setLoaded(true); });

    // Load available booklet names from rules text DB for all related game IDs
    const ids = gameIds || [gameId];
    supabase
      .from("game_rules_text")
      .select("booklet_name")
      .in("game_id", ids)
      .neq("content", "(página sin texto)")
      .then(({ data }) => {
        if (data) {
          const unique = [...new Set(data.map((r) => r.booklet_name))];
          setAvailableBooklets(unique);
          setSelectedBooklets(new Set(unique)); // all selected by default
        }
      });
  }, [gameId, gameIds]);

  const hasRulesText = availableBooklets.length > 0;

  const toggleBooklet = (name) => {
    setSelectedBooklets((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAskAI = async () => {
    if (!question.trim() || generating || selectedBooklets.size === 0) return;
    setGenerating(true);
    try {
      const bookletNames = [...selectedBooklets];
      const ids = gameIds || [gameId];
      const answer = await generateFaqAnswer(
        question.trim(),
        ids,
        bookletNames,
        houseRules.map((r) => ({ question: r.question, answer: r.answer }))
      );
      const entry = await addFaqEntry({ gameId, question: question.trim(), answer, isHouseRule: false });
      if (entry) {
        setFaqs((prev) => [...prev, entry]);
        setExpandedId(entry.id);
      }
      setQuestion("");
    } catch (err) {
      console.error("Error generating answer:", err);
      alert("Error al generar respuesta. Verifica que la API key esté configurada.");
    } finally {
      setGenerating(false);
    }
  };

  const handleAddHouseRule = async () => {
    if (!hrQuestion.trim() || !hrAnswer.trim()) return;
    const entry = await addFaqEntry({ gameId, question: hrQuestion.trim(), answer: hrAnswer.trim(), isHouseRule: true });
    if (entry) {
      setFaqs((prev) => [...prev, entry]);
      setExpandedId(entry.id);
    }
    setHrQuestion("");
    setHrAnswer("");
    setShowHouseForm(false);
  };

  const handleDelete = async (id) => {
    await deleteFaqEntry(id);
    setFaqs((prev) => prev.filter((f) => f.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const toggleExpand = (id) => setExpandedId((prev) => (prev === id ? null : id));

  if (!loaded) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <span className="text-sm text-gray-300">Cargando...</span>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-6 pb-6 pt-5">
      {/* AI Question Form */}
      {hasRulesText && (
        <div className="mb-5">
          {/* Booklet selector */}
          {availableBooklets.length > 1 && (
            <div className="mb-3">
              <p className="text-[10px] text-gray-400 mb-1.5 flex items-center gap-1">
                <BookOpen size={10} /> Instructivos a consultar:
              </p>
              <div className="flex flex-wrap gap-1.5">
                {availableBooklets.map((name) => (
                  <button
                    key={name}
                    onClick={() => toggleBooklet(name)}
                    className={`text-[10px] px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                      selectedBooklets.has(name)
                        ? "bg-orange-100 text-orange-600 font-medium"
                        : "bg-gray-100 text-gray-400"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAskAI(); }}
              placeholder="Pregunta sobre las reglas..."
              disabled={generating}
              className="flex-1 bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-700 placeholder-gray-300 focus:border-orange-400 focus:outline-none disabled:opacity-50"
            />
            <button
              onClick={handleAskAI}
              disabled={!question.trim() || generating || selectedBooklets.size === 0}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-white rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium shrink-0"
            >
              {generating ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {generating ? "Pensando..." : "Preguntar"}
            </button>
          </div>
          {generating && (
            <p className="text-[10px] text-gray-300 mt-1.5 ml-1">Consultando las reglas y generando respuesta...</p>
          )}
        </div>
      )}

      {!hasRulesText && (
        <p className="text-xs text-gray-300 mb-4">No hay reglas disponibles para generar respuestas con IA. Puedes agregar reglas de casa manualmente.</p>
      )}

      {/* FAQ List */}
      {faqs.length > 0 && (
        <div className="space-y-1.5 mb-5">
          {faqs.map((faq) => (
            <div key={faq.id} className="rounded-xl border border-gray-100 overflow-hidden">
              <button
                onClick={() => toggleExpand(faq.id)}
                className="flex items-center gap-2 w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors cursor-pointer"
              >
                {expandedId === faq.id ? <ChevronDown size={13} className="text-gray-300 shrink-0" /> : <ChevronRight size={13} className="text-gray-300 shrink-0" />}
                <span className="text-sm text-gray-700 flex-1">{faq.question}</span>
                {faq.is_house_rule && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 shrink-0">CASA</span>
                )}
                {!faq.is_house_rule && (
                  <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-violet-100 text-violet-500 shrink-0">AI</span>
                )}
              </button>
              {expandedId === faq.id && (
                <div className="px-4 pb-3 pt-0">
                  <div className="pl-5 border-l-2 border-orange-200">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{faq.answer}</p>
                  </div>
                  <div className="flex justify-end mt-2">
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="text-[10px] text-gray-300 hover:text-red-400 transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 size={10} /> Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {faqs.length === 0 && (
        <div className="text-center py-8 mb-4">
          <HelpCircle size={28} className="mx-auto text-gray-200 mb-2" />
          <p className="text-sm text-gray-300">Sin preguntas aún</p>
          <p className="text-[10px] text-gray-300 mt-1">{hasRulesText ? "Pregunta algo sobre las reglas o agrega una regla de casa" : "Agrega reglas de casa para tu grupo"}</p>
        </div>
      )}

      {/* House Rule Form */}
      <div className="border-t border-gray-100 pt-4">
        {!showHouseForm ? (
          <button
            onClick={() => setShowHouseForm(true)}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors cursor-pointer"
          >
            <Home size={12} />
            Agregar regla de casa
          </button>
        ) : (
          <div className="space-y-2.5">
            <p className="text-xs font-medium text-gray-500">Nueva regla de casa</p>
            <input
              type="text"
              value={hrQuestion}
              onChange={(e) => setHrQuestion(e.target.value)}
              placeholder="Situación o pregunta..."
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:border-orange-400 focus:outline-none"
            />
            <textarea
              value={hrAnswer}
              onChange={(e) => setHrAnswer(e.target.value)}
              placeholder="Cómo lo manejan ustedes..."
              rows={2}
              className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder-gray-300 focus:border-orange-400 focus:outline-none resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddHouseRule}
                disabled={!hrQuestion.trim() || !hrAnswer.trim()}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-white rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
              >
                Guardar
              </button>
              <button
                onClick={() => { setShowHouseForm(false); setHrQuestion(""); setHrAnswer(""); }}
                className="px-4 py-2 text-gray-400 hover:text-gray-600 text-xs transition-colors cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
