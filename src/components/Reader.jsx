import React, { useEffect, useRef, useState } from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';
import { formatSize } from '../lib/format.js';
import { loadPdfJs } from '../lib/pdf.js';

export default function Reader({
  book,
  pdf,
  page,
  flipDirection,
  onChangePage,
  onClose,
  highlights,
  onSaveHighlights,
  onMarkPage,
}) {
  const canvasRef = useRef(null);
  const pageFrameRef = useRef(null);
  const contentRef = useRef(null);
  const textLayerRef = useRef(null);
  const swipeStartRef = useRef(null);
  const renderTaskRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toolbar, setToolbar] = useState(null);
  const [justMarked, setJustMarked] = useState(false);
  const [renderKey, setRenderKey] = useState(0);

  useEffect(() => {
    let timer;
    const onResize = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setRenderKey((k) => k + 1), 200);
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    if (!pdf || !canvasRef.current || !pageFrameRef.current) return undefined;
    let cancelled = false;

    const render = async () => {
      try {
        const pdfjsLib = await loadPdfJs();
        const pdfPage = await pdf.getPage(page);
        if (cancelled) return;

        const baseViewport = pdfPage.getViewport({ scale: 1 });
        const frame = pageFrameRef.current;
        const availableWidth = Math.max(240, frame.clientWidth - 32);
        const availableHeight = Math.max(300, frame.clientHeight - 28);
        const scale = Math.min(1.5, availableWidth / baseViewport.width, availableHeight / baseViewport.height);
        const viewport = pdfPage.getViewport({ scale });

        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        const outputScale = window.devicePixelRatio || 1;
        const cssWidth = Math.floor(viewport.width);
        const cssHeight = Math.floor(viewport.height);
        canvas.width = Math.floor(cssWidth * outputScale);
        canvas.height = Math.floor(cssHeight * outputScale);
        canvas.style.width = `${cssWidth}px`;
        canvas.style.height = `${cssHeight}px`;

        if (renderTaskRef.current) renderTaskRef.current.cancel();
        const renderTask = pdfPage.render({
          canvasContext: context,
          viewport,
          transform: outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : undefined,
        });
        renderTaskRef.current = renderTask;
        await renderTask.promise;
        if (cancelled) return;

        const textContent = await pdfPage.getTextContent();
        if (cancelled) return;
        const layer = textLayerRef.current;
        if (!layer) return;
        layer.innerHTML = '';
        layer.style.width = `${cssWidth}px`;
        layer.style.height = `${cssHeight}px`;

        const spans = [];
        for (const item of textContent.items) {
          if (!item.str) continue;
          const tx = pdfjsLib.Util.transform(viewport.transform, item.transform);
          const fontHeight = Math.hypot(tx[2], tx[3]);
          if (!fontHeight) continue;
          const angle = Math.atan2(tx[1], tx[0]);
          const span = document.createElement('span');
          span.textContent = item.str;
          span.style.left = `${tx[4]}px`;
          span.style.top = `${tx[5] - fontHeight}px`;
          span.style.fontSize = `${fontHeight}px`;
          span.dataset.angle = String(angle);
          layer.appendChild(span);
          spans.push({ span, width: item.width * scale, angle });
        }

        for (const { span, width, angle } of spans) {
          const measured = span.getBoundingClientRect().width;
          if (measured > 0 && width > 0) {
            const sx = width / measured;
            span.style.transform = `${angle ? `rotate(${angle}rad) ` : ''}scaleX(${sx})`;
          }
        }
      } catch (renderError) {
        if (!cancelled && renderError?.name !== 'RenderingCancelledException') {
          /* ignorar */
        }
      } finally {
        renderTaskRef.current = null;
      }
    };

    render();

    return () => {
      cancelled = true;
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel();
        renderTaskRef.current = null;
      }
    };
  }, [pdf, page, renderKey]);

  useEffect(() => {
    setToolbar(null);
  }, [page]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
  };

  const shareBook = async () => {
    const text = `A ler "${book.name}" no BrioLib`;
    if (navigator.share) {
      try {
        await navigator.share({ title: book.name, text });
      } catch { /* cancelado */ }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      alert('Copiado para a área de transferência!');
    }
  };

  const startPageSwipe = (event) => {
    if (event.isPrimary) {
      swipeStartRef.current = { x: event.clientX, y: event.clientY };
    }
  };

  const finishPageSwipe = (event) => {
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start || !event.isPrimary) return;

    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.toString().trim()) return;

    const deltaX = event.clientX - start.x;
    const deltaY = event.clientY - start.y;
    if (Math.abs(deltaX) >= 48 && Math.abs(deltaX) > Math.abs(deltaY) * 1.25) {
      onChangePage(deltaX < 0 ? 1 : -1);
    }
  };

  const handleSelectionEnd = () => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || selection.rangeCount === 0 || !contentRef.current) {
      setToolbar(null);
      return;
    }
    const range = selection.getRangeAt(0);
    if (!textLayerRef.current || !textLayerRef.current.contains(range.commonAncestorContainer)) {
      return;
    }
    const contentRect = contentRef.current.getBoundingClientRect();
    const clientRects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
    if (!clientRects.length) {
      setToolbar(null);
      return;
    }
    const rects = clientRects.map((r) => ({
      x: (r.left - contentRect.left) / contentRect.width,
      y: (r.top - contentRect.top) / contentRect.height,
      w: r.width / contentRect.width,
      h: r.height / contentRect.height,
    }));
    const first = clientRects[0];
    const last = clientRects[clientRects.length - 1];
    setToolbar({
      rects,
      x: Math.min(contentRect.width - 70, Math.max(70, (first.left + last.right) / 2 - contentRect.left)),
      y: Math.max(30, last.top - contentRect.top),
    });
  };

  const addHighlight = () => {
    if (!toolbar) return;
    const existing = highlights?.[page] ?? [];
    onSaveHighlights?.(page, [...existing, ...toolbar.rects]);
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  };

  const removeHighlight = (index) => {
    const existing = highlights?.[page] ?? [];
    onSaveHighlights?.(page, existing.filter((_, i) => i !== index));
  };

  const handleMark = () => {
    onMarkPage?.();
    setJustMarked(true);
    window.setTimeout(() => setJustMarked(false), 1600);
  };

  const totalPages = pdf?.numPages ?? book.totalPages ?? page;
  const pageHighlights = highlights?.[page] ?? [];
  const isMarked = book.stoppedPage === page;

  return (
    <main className="reader">
      <header className="reader-topbar">
        <Brand as="button" className="brand brand-button" onClick={onClose} aria-label="Voltar para a biblioteca" />
        <div className="reader-title">
          <span>LENDO AGORA</span>
          <strong>{book.name}</strong>
        </div>
        <div className="reader-topbar-actions">
          <button className="icon-button" onClick={shareBook} aria-label="Partilhar livro">
            <Icon name="share" size={18} />
          </button>
          <button
            className={`icon-button ${isMarked ? 'icon-button--active' : ''}`}
            onClick={handleMark}
            aria-label={isMarked ? 'Remover marca desta página' : 'Marcar esta página'}
            title={isMarked ? 'Remover marca desta página' : 'Marcar esta página como onde parei'}
          >
            <Icon name="pin" size={18} />
          </button>
          <button className="icon-button" onClick={toggleFullscreen} aria-label={isFullscreen ? 'Sair de tela cheia' : 'Tela cheia'}>
            <Icon name="expand" size={18} />
          </button>
          <button className="icon-button" onClick={onClose} aria-label="Fechar leitor">
            <Icon name="close" />
          </button>
        </div>
      </header>
      <section className="reader-stage">
        <button
          className="page-arrow"
          onClick={() => onChangePage(-1)}
          disabled={page <= 1}
          aria-label="Página anterior"
        >
          <Icon name="left" size={24} />
        </button>
        <div
          className="page-frame"
          ref={pageFrameRef}
          onPointerDown={startPageSwipe}
          onPointerUp={finishPageSwipe}
          onPointerCancel={() => {
            swipeStartRef.current = null;
          }}
        >
          <div key={page} className={`paper ${flipDirection > 0 ? 'paper-turn-next' : 'paper-turn-previous'}`}>
            <div className="page-content" ref={contentRef} onPointerUp={handleSelectionEnd}>
              <canvas ref={canvasRef} aria-label={`Página ${page} do PDF`} />
              <div className="text-layer" ref={textLayerRef} aria-hidden="true" />
              <div className="highlight-layer">
                {pageHighlights.map((rect, index) => (
                  <button
                    key={index}
                    type="button"
                    className="highlight-rect"
                    style={{
                      left: `${rect.x * 100}%`,
                      top: `${rect.y * 100}%`,
                      width: `${rect.w * 100}%`,
                      height: `${rect.h * 100}%`,
                    }}
                    onClick={() => removeHighlight(index)}
                    title="Clique para remover o destaque"
                    aria-label="Remover destaque"
                  />
                ))}
              </div>
              {toolbar && (
                <div className="selection-toolbar" style={{ left: toolbar.x, top: toolbar.y }}>
                  <button type="button" onClick={addHighlight}>
                    <Icon name="highlight" size={15} />
                    Destacar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          className="page-arrow"
          onClick={() => onChangePage(1)}
          disabled={page >= totalPages}
          aria-label="Próxima página"
        >
          <Icon name="right" size={24} />
        </button>
      </section>
      <footer className="reader-controls">
        <span className="reader-hint">Selecione um texto para destacar · setas do teclado para virar</span>
        <div className="pagination">
          {book.stoppedPage ? (
            <span className="pagination-mark" title={`Página marcada: ${book.stoppedPage}`}>
              <Icon name="pin" size={13} />
              {book.stoppedPage}
            </span>
          ) : null}
          <button className="icon-button" onClick={() => onChangePage(-1)} disabled={page <= 1} aria-label="Página anterior">
            <Icon name="left" size={18} />
          </button>
          <span>
            <strong>{page}</strong>
            <i>/</i>
            {totalPages}
          </span>
          <button className="icon-button" onClick={() => onChangePage(1)} disabled={page >= totalPages} aria-label="Próxima página">
            <Icon name="right" size={18} />
          </button>
        </div>
        <span className="reader-file">{formatSize(book.size)} · PDF</span>
      </footer>
      {justMarked && <div className="reader-toast">{isMarked ? 'Página marcada' : 'Marca removida'}</div>}
    </main>
  );
}
