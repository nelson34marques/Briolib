import React from 'react';
import Icon from './Icon.jsx';
import { formatSize } from '../lib/format.js';

export default function BookCard({ book, index, onOpen, onRemove, onToggleBookmark }) {
  return (
    <article className="book-card">
      <button
        className={`book-cover ${book.thumbnail ? 'cover-image' : `cover-${index % 4}`}`}
        onClick={onOpen}
        aria-label={`Abrir ${book.name}`}
      >
        {book.thumbnail ? (
          <img src={book.thumbnail} alt="" aria-hidden="true" className="book-thumbnail" />
        ) : (
          <>
            <span className="cover-label">BRIOLIB · LIVRO {String(index + 1).padStart(2, '0')}</span>
            <Icon name="book" size={27} />
            <span className="cover-title">{book.name}</span>
            <span className="cover-rule" />
            <span className="cover-filetype">PDF</span>
          </>
        )}
        {book.bookmarked && (
          <span className="bookmark-badge">
            <Icon name="bookmark" size={14} />
          </span>
        )}
      </button>
      <div className="book-details">
        <button className="book-name" onClick={onOpen} title={book.name}>
          {book.name}
        </button>
        <span>
          {formatSize(book.size)}
          <i>·</i> PDF
          {book.lastPage > 1 && (
            <>
              <i>·</i> pág. {book.lastPage}
            </>
          )}
        </span>
        <div className="book-actions">
          {onToggleBookmark && (
            <button
              className={`icon-btn ${book.bookmarked ? 'icon-btn--active' : ''}`}
              onClick={onToggleBookmark}
              aria-label={book.bookmarked ? 'Remover marcador' : 'Adicionar marcador'}
            >
              <Icon name="bookmark" size={14} />
            </button>
          )}
          <button
            className="delete-book"
            onClick={onRemove}
            aria-label={`Remover ${book.name}`}
            title="Remover da biblioteca"
          >
            <Icon name="trash" size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}
