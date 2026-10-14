import React from 'react';
import Icon from './Icon.jsx';

export default function Notice({ type, message, onClose, loading }) {
  if (loading) {
    return (
      <div className="loading-message">
        Preparando seu livro<span className="loading-dots">...</span>
      </div>
    );
  }

  if (!message) return null;

  if (type === 'error') {
    return (
      <div className="error-message" role="alert">
        {message}
        {onClose && (
          <button onClick={onClose} aria-label="Fechar aviso">
            <Icon name="close" size={16} />
          </button>
        )}
      </div>
    );
  }

  return null;
}