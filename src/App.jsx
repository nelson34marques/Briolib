import React, { useEffect, useRef, useState } from 'react';
import Sidebar from './components/Sidebar.jsx';
import MobileHeader from './components/MobileHeader.jsx';
import Welcome from './components/Welcome.jsx';
import UploadCard from './components/UploadCard.jsx';
import Notice from './components/Notice.jsx';
import LibrarySection from './components/LibrarySection.jsx';
import Reader from './components/Reader.jsx';
import FloatingNav from './components/FloatingNav.jsx';
import { useLibrary } from './hooks/useLibrary.js';
import { usePdfReader } from './hooks/usePdfReader.js';

function App() {
  const inputRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('briolib-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [currentView, setCurrentView] = useState('home');

  const library = useLibrary();
  const reader = usePdfReader({ library, onClose: () => {} });

  useEffect(() => {
    document.body.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('briolib-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleAddPdf = (file) => {
    library.addBook(file, (id) => reader.openBook(id));
  };

  const handleRemoveBook = (id) => {
    if (library.removeBookWithCleanup) {
      library.removeBookWithCleanup(id);
    } else {
      library.removeBook(id);
    }
  };

  if (reader.activeBook && reader.pdf) {
    return (
      <Reader
        book={reader.activeBook}
        pdf={reader.pdf}
        page={reader.page}
        flipDirection={reader.flipDirection}
        onChangePage={reader.changePage}
        onClose={reader.closeReader}
        highlights={reader.highlights}
        onSaveHighlights={reader.savePageHighlights}
        onMarkPage={reader.markPage}
      />
    );
  }

  return (
    <div className="app-shell">
      <Sidebar booksCount={library.books.length} onToggleTheme={() => setIsDark(!isDark)} isDark={isDark} onShelf={() => setCurrentView('shelf')} onHome={() => setCurrentView('home')} currentView={currentView} />
      <main className="main-content">
        <MobileHeader />
        <div className="content-wrap">
          {currentView === 'home' && (
            <>
              <Welcome />
              <UploadCard inputRef={inputRef} onAddPdf={handleAddPdf} />
              <Notice type="error" message={library.error} onClose={() => library.setError('')} />
              <Notice loading={library.loading || reader.loading} />
            </>
          )}
          <LibrarySection
            books={library.books}
            onAdd={() => inputRef.current?.click()}
            onOpen={reader.openBook}
            onRemove={handleRemoveBook}
            onToggleBookmark={library.toggleBookmark}
            show={currentView === 'shelf'}
            searchQuery={library.searchQuery}
            setSearchQuery={library.setSearchQuery}
            sortBy={library.sortBy}
            setSortBy={library.setSortBy}
          />
          {currentView === 'shelf' && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)', fontSize: 13 }}>
              {library.books.length === 0 ? 'A estante está vazia. Adicione um livro para começar.' : `${library.books.length} ${library.books.length === 1 ? 'livro' : 'livros'} na estante.`}
            </div>
          )}
          <footer className="page-footer">
            <span>FEITO PARA LER COM CALMA</span>
            <span>
              Uma página de cada vez <i>✳</i>
            </span>
          </footer>
        </div>
      </main>
      <FloatingNav
        onHome={() => setCurrentView('home')}
        onAdd={() => inputRef.current?.click()}
        onShelf={() => setCurrentView('shelf')}
        onToggleTheme={() => setIsDark(!isDark)}
        isDark={isDark}
        currentView={currentView}
      />
    </div>
  );
}

export default App;
