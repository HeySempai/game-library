import { useState, useRef, useCallback, useEffect, forwardRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";
import { X, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

const PdfPage = forwardRef(({ pageNumber, width, height, shouldRender }, ref) => (
  <div ref={ref} style={{ width, height, overflow: "hidden", background: "white" }}>
    {shouldRender ? (
      <Page
        pageNumber={pageNumber}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={
          <div style={{ width, height, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: "#999", fontSize: 13 }}>Cargando...</span>
          </div>
        }
      />
    ) : (
      <div style={{ width, height }} />
    )}
  </div>
));
PdfPage.displayName = "PdfPage";

function computePageSize(naturalW, naturalH, mode = "book") {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const padding = 80;
  const ratio = naturalH / naturalW;

  if (mode === "single") {
    // For simple viewer: fit one page, can be wider
    const maxW = vw - padding * 2;
    const maxH = vh - padding * 2;
    let pageWidth = Math.min(maxW, 700);
    let pageHeight = Math.round(pageWidth * ratio);
    if (pageHeight > maxH) {
      pageHeight = maxH;
      pageWidth = Math.round(pageHeight / ratio);
    }
    return { pageWidth, pageHeight };
  }

  // Book mode: two pages side by side
  const arrowSpace = 112;
  const maxW = Math.floor((vw - padding * 2 - arrowSpace) / 2);
  const maxH = vh - padding * 2;
  let pageWidth = maxW;
  let pageHeight = Math.round(pageWidth * ratio);
  if (pageHeight > maxH) {
    pageHeight = maxH;
    pageWidth = Math.round(pageHeight / ratio);
  }
  return { pageWidth, pageHeight };
}

export default function RulesViewer({ booklet, onClose }) {
  const [numPages, setNumPages] = useState(null);
  const [pageSize, setPageSize] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const bookRef = useRef(null);

  const isSimple = numPages !== null && numPages <= 2;

  const prevPage = useCallback(() => {
    if (bookRef.current) bookRef.current.pageFlip().flipPrev();
    else setCurrentPage((p) => Math.max(0, p - 1));
  }, []);
  const nextPage = useCallback(() => {
    if (bookRef.current) bookRef.current.pageFlip().flipNext();
    else setCurrentPage((p) => p + 1);
  }, []);
  const onFlip = useCallback((e) => setCurrentPage(e.data), []);

  useEffect(() => {
    const handler = (e) => {
      if (!["Escape", "ArrowRight", "ArrowLeft"].includes(e.key)) return;
      e.stopImmediatePropagation();
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") nextPage();
      if (e.key === "ArrowLeft") prevPage();
    };
    window.addEventListener("keydown", handler, true);
    return () => window.removeEventListener("keydown", handler, true);
  }, [onClose, nextPage, prevPage]);

  const isCover = currentPage === 0;
  const atEnd = numPages !== null && (isSimple ? currentPage >= numPages - 1 : currentPage >= numPages - 2);

  const pageLabel = (() => {
    if (!numPages) return "";
    if (isSimple) return `${currentPage + 1} / ${numPages}`;
    if (isCover) return `1 / ${numPages}`;
    return `${currentPage + 1}–${Math.min(currentPage + 2, numPages)} / ${numPages}`;
  })();

  return (
    <div
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/92 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Top bar */}
      <div
        className="absolute top-0 inset-x-0 flex items-center justify-between px-6 py-4"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-white/60 text-sm">{booklet.name}</span>
        <div className="flex items-center gap-3">
          {pageLabel && <span className="text-white/30 text-xs tabular-nums">{pageLabel}</span>}
          <a href={booklet.pdf} target="_blank" rel="noreferrer"
            className="text-white/30 hover:text-white/70 transition-colors p-1.5 rounded-lg hover:bg-white/10">
            <ExternalLink size={14} />
          </a>
          <button onClick={onClose}
            className="text-white/30 hover:text-white/80 transition-colors p-1.5 rounded-lg hover:bg-white/10 cursor-pointer">
            <X size={17} />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4" onClick={(e) => e.stopPropagation()}>
        {/* Arrows only for multi-page simple or flipbook */}
        <button onClick={prevPage} disabled={currentPage === 0}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white disabled:opacity-0 transition-all cursor-pointer shrink-0"
          style={isSimple && numPages === 1 ? { visibility: "hidden" } : {}}>
          <ChevronLeft size={20} />
        </button>

        <Document
          file={booklet.pdf}
          onLoadSuccess={({ numPages }) => setNumPages(numPages)}
          loading={
            <div className="flex items-center justify-center" style={{ width: 300, height: 420 }}>
              <span className="text-white/30 text-sm">Cargando...</span>
            </div>
          }
        >
          {/* Hidden probe page to measure real dimensions */}
          {numPages && !pageSize && (
            <div style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}>
              <Page
                pageNumber={1}
                width={600}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                onRenderSuccess={(page) => {
                  setPageSize(computePageSize(page.width, page.height, isSimple ? "single" : "book"));
                }}
              />
            </div>
          )}

          {/* Simple viewer for 1-2 pages */}
          {isSimple && pageSize && (
            <div style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.7)", borderRadius: 8, overflow: "hidden" }}>
              <Page
                pageNumber={currentPage + 1}
                width={pageSize.pageWidth}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </div>
          )}

          {/* Flipbook for 3+ pages */}
          {!isSimple && numPages && pageSize && (
            <div style={{
              boxShadow: "0 30px 80px rgba(0,0,0,0.7)",
              transform: isCover ? `translateX(-${pageSize.pageWidth / 2}px)` : "translateX(0)",
              transition: "transform 0.5s ease",
            }}>
              <HTMLFlipBook
                ref={bookRef}
                width={pageSize.pageWidth}
                height={pageSize.pageHeight}
                size="fixed"
                showCover={true}
                flippingTime={500}
                usePortrait={false}
                mobileScrollSupport={false}
                onFlip={onFlip}
                style={{ margin: "0 auto" }}
              >
                {Array.from({ length: numPages }, (_, i) => (
                  <PdfPage
                    key={i}
                    pageNumber={i + 1}
                    width={pageSize.pageWidth}
                    height={pageSize.pageHeight}
                    shouldRender={Math.abs(i - currentPage) <= 3}
                  />
                ))}
              </HTMLFlipBook>
            </div>
          )}
        </Document>

        <button onClick={nextPage} disabled={atEnd}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-white/8 hover:bg-white/15 text-white/40 hover:text-white disabled:opacity-0 transition-all cursor-pointer shrink-0"
          style={isSimple && numPages === 1 ? { visibility: "hidden" } : {}}>
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="absolute bottom-5 text-white/20 text-[10px]" onClick={(e) => e.stopPropagation()}>
        {isSimple
          ? numPages === 2 ? "← → para cambiar página · ESC para cerrar" : "ESC para cerrar"
          : "Clic en los bordes para voltear · ← → · ESC para cerrar"
        }
      </div>
    </div>
  );
}
