import React from 'react';
import Icon from './Icon.jsx';
import BookCard from './BookCard.jsx';

export default function LibrarySection({ books, onAdd, onOpen, onRemove, onToggleBookmark, show = true, searchQuery, setSearchQuery, sortBy, setSortBy }) {
  if (!show) return null;
  return (
    <section className="library-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">A SUA ESTANTE</span>
          <h2>
            Seus livros <span>{books.length.toString().padStart(2, '0')}</span>
          </h2>
        </div>
        {books.length > 0 && (
          <button className="text-button" onClick={onAdd}>
            Adicionar PDF <span>+</span>
          </button>
        )}
      </div>
      <div className="library-controls">
        <div className="search-box">
          <Icon name="search" size={16} />
          <input
            type="text"
            placeholder="Procurar livro..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Procurar livro"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} aria-label="Limpar pesquisa">
              <Icon name="close" size={14} />
            </button>
          )}
        </div>
        <div className="sort-box">
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} aria-label="Ordenar">
            <option value="date">Mais recentes</option>
            <option value="name">Nome A-Z</option>
            <option value="progress">Progresso</option>
          </select>
        </div>
      </div>
      {books.length === 0 ? (
        <div className="empty-shelf">
          <div className="empty-icon">
            <Icon name="book" size={22} />
          </div>
          <div>
            <strong>Sua estante está esperando por histórias.</strong>
            <p>Escolha um PDF acima para começar sua biblioteca.</p>
          </div>
          <div className="shelf-line" />
        </div>
      ) : (
        <div className="book-grid">
          {books.map((book, index) => (
            <BookCard
              key={book.id}
              book={book}
              index={index}
              onOpen={() => onOpen(book.id)}
              onRemove={() => onRemove(book.id)}
              onToggleBookmark={() => onToggleBookmark?.(book.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
