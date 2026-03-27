import { useState, useEffect, useRef } from "react";
import { FileText } from "lucide-react";
import { pdfjs } from "react-pdf";
import RulesViewer from "./RulesViewer";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

// Cache thumbnail data URLs so we don't re-fetch PDFs
const thumbCache = new Map();

function BookletCover({ booklet, onClick }) {
  const [thumbUrl, setThumbUrl] = useState(thumbCache.get(booklet.pdf) || null);
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (thumbUrl || error) return;
    let cancelled = false;

    const loadThumb = async () => {
      try {
        const pdf = await pdfjs.getDocument(booklet.pdf).promise;
        const page = await pdf.getPage(1);
        const scale = 110 / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;

        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        thumbCache.set(booklet.pdf, dataUrl);
        if (!cancelled) setThumbUrl(dataUrl);
        pdf.destroy();
      } catch {
        if (!cancelled) setError(true);
      }
    };

    loadThumb();
    return () => { cancelled = true; };
  }, [booklet.pdf, thumbUrl, error]);

  const Placeholder = () => (
    <div className="w-[110px] h-[155px] rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:scale-[1.04] group-hover:-translate-y-0.5">
      {error
        ? <FileText size={32} className="text-gray-300 group-hover:text-orange-400 transition-colors" />
        : <div className="w-[110px] h-[155px] bg-gray-100 animate-pulse rounded-lg" />
      }
    </div>
  );

  return (
    <button
      onClick={() => onClick(booklet)}
      className="flex flex-col items-center gap-2 group cursor-pointer"
    >
      {thumbUrl ? (
        <div className="rounded-lg overflow-hidden shadow-md group-hover:shadow-xl transition-all duration-200 group-hover:scale-[1.04] group-hover:-translate-y-0.5">
          <img src={thumbUrl} alt={booklet.name} className="w-[110px] block" />
        </div>
      ) : (
        <Placeholder />
      )}
      <span className="text-[10px] text-gray-400 text-center leading-snug max-w-[110px] group-hover:text-gray-600 transition-colors">
        {booklet.name}
      </span>
    </button>
  );
}

export default function InstructivosTab({ booklets, noBorder }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="flex-1 p-6 overflow-y-auto">
        {booklets.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-10">Sin instructivos disponibles</p>
        ) : (
          <div className="flex flex-wrap gap-5">
            {booklets.map((b, i) => (
              <BookletCover key={i} booklet={b} onClick={setSelected} />
            ))}
          </div>
        )}
      </div>

      {selected && (
        <RulesViewer booklet={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
