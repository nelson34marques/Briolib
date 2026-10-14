import { useCallback, useEffect, useState } from 'react';
import { deleteBook, listBooks, saveBook, saveProgress, saveThumbnail, saveBookmark, saveStoppedPage } from '../lib/db.js';
import { renderThumbnail } from '../lib/pdf.js';

function normalizeBooks(records) {
  if (!records) return [];
  const normalized = records.map((book) => ({
    id: book.id,
    name: book.name,
    fileName: book.fileName,
    size: book.size,
    addedAt: book.addedAt,
    lastPage: book.lastPage ?? 1,
    totalPages: book.totalPages,
    thumbnail: book.thumbnail,
    bookmarked: book.bookmarked ?? false,
    stoppedPage: book.stoppedPage ?? null,
  }));
  return normalized.sort((a, b) => (b.addedAt ?? 0) - (a.addedAt ?? 0));
}

export function useLibrary() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');

  const refreshBooks = useCallback(async () => {
    try {
      const records = await listBooks();
      setBooks(normalizeBooks(records));
      setError('');
    } catch (err) {
      setError('Não foi possível carregar a biblioteca deste dispositivo.');
      throw err;
    }
  }, []);

  useEffect(() => {
    refreshBooks().catch(() => {});
  }, [refreshBooks]);

  const addBook = useCallback(async (file, onAdded) => {
    if (!file) return;
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setError('Escolha um arquivo PDF para adicionar à biblioteca.');
      return;
    }

    setError('');
    const id = crypto.randomUUID();
    const record = {
      id,
      name: file.name.replace(/\.pdf$/i, ''),
      fileName: file.name,
      size: file.size,
      addedAt: Date.now(),
      lastPage: 1,
      thumbnail: null,
      bookmarked: false,
    };

    try {
      await saveBook(record, file);
      await refreshBooks();
      await onAdded?.(id);
    } catch {
      setError('Não foi possível guardar este PDF. Verifique o espaço disponível no dispositivo.');
    }
  }, [refreshBooks]);

  const updateProgress = useCallback(async (id, lastPage, totalPages) => {
    try {
      const updated = await saveProgress(id, lastPage, totalPages);
      if (updated) {
        setBooks((prev) =>
          prev.map((book) => (book.id === id ? { ...book, lastPage: updated.lastPage, totalPages: updated.totalPages } : book)),
        );
      }
    } catch { /* silenciar */ }
  }, []);

  const updateThumbnail = useCallback(async (id, document_) => {
    try {
      const dataUrl = await renderThumbnail(document_);
      const updated = await saveThumbnail(id, dataUrl);
      if (updated) {
        setBooks((prev) => prev.map((book) => (book.id === id ? { ...book, thumbnail: updated.thumbnail } : book)));
      }
    } catch { /* silenciar */ }
  }, []);

  const toggleBookmark = useCallback(async (id) => {
    setBooks((prev) => {
      const updated = prev.map((b) => (b.id === id ? { ...b, bookmarked: !b.bookmarked } : b));
      const book = updated.find((b) => b.id === id);
      if (book) saveBookmark(id, book.bookmarked).catch(() => {});
      return updated;
    });
  }, []);

  const markStoppedPage = useCallback(async (id, stoppedPage) => {
    try {
      const updated = await saveStoppedPage(id, stoppedPage);
      if (updated) {
        setBooks((prev) => prev.map((book) => (book.id === id ? { ...book, stoppedPage: updated.stoppedPage } : book)));
      }
    } catch { /* silenciar */ }
  }, []);

  const removeBook = useCallback(async (id) => {
    try {
      await deleteBook(id);
      await refreshBooks();
    } catch {
      setError('Não foi possível remover este PDF da biblioteca.');
    }
  }, [refreshBooks]);

  const filteredBooks = searchQuery
    ? books.filter((b) => b.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : books;

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    if (sortBy === 'progress') {
      const pa = a.totalPages ? a.lastPage / a.totalPages : 0;
      const pb = b.totalPages ? b.lastPage / b.totalPages : 0;
      return pb - pa;
    }
    return (b.addedAt ?? 0) - (a.addedAt ?? 0);
  });

  return {
    books: sortedBooks,
    allBooks: books,
    loading,
    error,
    setError,
    setLoading,
    refreshBooks,
    addBook,
    removeBook,
    updateProgress,
    updateThumbnail,
    toggleBookmark,
    markStoppedPage,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
  };
}
