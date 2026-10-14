import React from 'react';
import Icon from './Icon.jsx';
import Brand from './Brand.jsx';

export default function Sidebar({ booksCount, onToggleTheme, isDark, onShelf, onHome, currentView }) {
  return (
    <aside className="sidebar">
      <Brand showMark={false} onClick={(e) => { e.preventDefault(); onHome?.(); }} />
      <div className="side-label">ESPAÇO PESSOAL</div>
      <button className={`nav-item ${currentView === 'home' ? 'nav-item-active' : ''}`} onClick={onHome} style={{ marginBottom: '6px' }}>
        <Icon name="home" size={18} />
        <span>Início</span>
      </button>
      <button className={`nav-item ${currentView === 'shelf' ? 'nav-item-active' : ''}`} onClick={onShelf}>
        <Icon name="book" size={18} />
        <span>Minha biblioteca</span>
        <span className="nav-count">{booksCount}</span>
      </button>
      <div className="sidebar-note">
        <div className="note-icon">
          <Icon name="spark" size={17} />
        </div>
        <p>Um cantinho tranquilo para se perder nas páginas.</p>
        <span>BOA LEITURA</span>
      </div>
      <button className="theme-toggle" onClick={onToggleTheme} aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}>
        <Icon name={isDark ? 'sun' : 'moon'} size={16} />
        {isDark ? 'Modo claro' : 'Modo escuro'}
      </button>
      <div className="sidebar-bottom">
        <span className="privacy-dot" /> Seus PDFs ficam só neste dispositivo
      </div>
    </aside>
  );
}
