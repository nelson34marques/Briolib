import React from 'react';
import Icon from './Icon.jsx';

export default function FloatingNav({ onHome, onAdd, onShelf, onToggleTheme, isDark, currentView }) {
  if (typeof window !== 'undefined' && window.innerWidth > 640) return null;
  return (
    <nav className="floating-nav">
      <button
        className={`floating-nav__btn ${currentView === 'home' ? 'floating-nav__btn--active' : ''}`}
        onClick={onHome}
        aria-label="Início"
      >
        <Icon name="home" size={20} />
        <span>Início</span>
      </button>
      <button
        className="floating-nav__btn"
        onClick={onAdd}
        aria-label="Adicionar livro"
      >
        <Icon name="upload" size={20} />
        <span>Adicionar</span>
      </button>
      <button
        className={`floating-nav__btn ${currentView === 'shelf' ? 'floating-nav__btn--active' : ''}`}
        onClick={onShelf}
        aria-label="Estante"
      >
        <Icon name="book" size={20} />
        <span>Estante</span>
      </button>
      <button
        className="floating-nav__btn"
        onClick={onToggleTheme}
        aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
      >
        <Icon name={isDark ? 'sun' : 'moon'} size={20} />
        <span>{isDark ? 'Claro' : 'Escuro'}</span>
      </button>
    </nav>
  );
}
