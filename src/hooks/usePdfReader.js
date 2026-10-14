import { useCallback, useEffect, useRef, useState } from 'react';
import { useEvent } from './useEvent.js';
import { forgetDocument, loadDocument } from '../lib/pdf.js';
import { getBookWithFile, getHighlights, saveHighlights } from '../lib/db.js';

export function usePdfReader({ library, onClose }) {
  const [activeBook, setActiveBook] = useState(null);
  const [pdf, setPdf] = useState(null);
  const [page, setPage] = useState(1);
  const [flipDirection, setFlipDirection] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlights, setHighlights] = useState({});

  const openBookIdRef = useRef(null);
  const closingRef = useRef(false);
  const highlightsRef = useRef({});
  const highlightsReadyRef = useRef(false);

  const cleanup = useCallback((bookId = openBookIdRef.current) => {
    if (bookId) {
      forgetDocument(bookId);
    }
    setPdf(null);
    setActiveBook(null);
    highlightsRef.current = {};
    highlightsReadyRef.current = false;
    setHighlights({});
  }, []);

  const closeReader = useEvent(() => {
    closingRef.current = true;
    const bookId = openBookIdRef.current;
    if (bookId && activeBook) {
      library.updateProgress(bookId, page, pdf?.numPages ?? activeBook.totalPages ?? page);
    }
    cleanup(bookId);
    onClose?.();
    closingRef.current = false;
  });

  const openBook = useCallback(async (bookId) => {
    setLoading(true);
    setError('');
    openBookIdRef.current = bookId;
    try {
      const { meta, file } = await getBookWithFile(bookId);
      if (!meta) throw new Error('Livro não encontrado');
      if (!file) throw new Error('Arquivo não encontrado');

      const document_ = await loadDocument(bookId, file);
      setPdf(document_);
      setActiveBook({ ...meta, fileName: meta.fileName ?? meta.name, totalPages: document_.numPages });
      setPage(meta.lastPage && meta.lastPage >= 1 && meta.lastPage <= document_.numPages ? meta.lastPage : 1);
      setFlipDirection(1);
      setHighlights({});

      getHighlights(bookId)
        .then((pages) => {
          highlightsRef.current = pages ?? {};
          highlightsReadyRef.current = true;
          setHighlights(pages ?? {});
        })
        .catch(() => {});
      library.updateThumbnail(bookId, document_).catch(() => {});
    } catch {
      setError('Não foi possível abrir este PDF. Tente adicioná-lo novamente.');
      cleanup(bookId);
      openBookIdRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [cleanup, library]);

  const removeActiveIfMatches = useCallback(async (bookId) => {
    if (openBookIdRef.current !== bookId || closingRef.current) return;
    const currentPage = page;
    const total = pdf?.numPages ?? activeBook?.totalPages ?? currentPage;
    await library.updateProgress(bookId, currentPage, total);
    cleanup(bookId);
    openBookIdRef.current = null;
    onClose?.();
  }, [activeBook?.totalPages, cleanup, library, onClose, page, pdf]);

  useEffect(() => {
    library.removeBookWithCleanup = async (id) => {
      await library.removeBook(id);
      await removeActiveIfMatches(id);
    };
    return () => {
      delete library.removeBookWithCleanup;
    };
  }, [library, removeActiveIfMatches]);

  const savePageHighlights = useCallback((pageNumber, rects) => {
    setHighlights((prev) => {
      const next = { ...prev };
      if (rects && rects.length) next[pageNumber] = rects;
      else delete next[pageNumber];
      return next;
    });
  }, []);

  useEffect(() => {
    highlightsRef.current = highlights;
    if (!highlightsReadyRef.current) return;
    const bookId = openBookIdRef.current;
    if (bookId) saveHighlights(bookId, highlights).catch(() => {});
  }, [highlights]);

  const markPage = useCallback(() => {
    const bookId = openBookIdRef.current;
    if (!bookId) return;
    setActiveBook((current) => {
      if (!current) return current;
      const next = current.stoppedPage === page ? null : page;
      library.markStoppedPage(bookId, next);
      return { ...current, stoppedPage: next };
    });
  }, [library, page]);

  const changePage = useCallback((delta) => {
    setFlipDirection(delta >= 0 ? 1 : -1);
    setPage((current) => {
      const total = pdf?.numPages ?? activeBook?.totalPages ?? current;
      const next = Math.min(total, Math.max(1, current + delta));
      return next;
    });
  }, [activeBook?.totalPages, pdf]);

  const handleKeyDown = useEvent((event) => {
    if (!pdf) return;
    if (event.key === 'ArrowRight') changePage(2);
    if (event.key === 'ArrowLeft') changePage(-2);
    if (event.key === 'Escape') closeReader();
  });

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return {
    activeBook,
    pdf,
    page,
    flipDirection,
    loading,
    error,
    highlights,
    openBook,
    closeReader,
    changePage,
    markPage,
    savePageHighlights,
    setError,
  };
}
