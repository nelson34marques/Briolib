import React, { useState } from 'react';
import Icon from './Icon.jsx';

export default function UploadCard({ inputRef, onAddPdf }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    onAddPdf(event.dataTransfer.files[0]);
  };

  return (
    <section
      className={`upload-card ${isDragging ? 'upload-card-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <div className="upload-art" aria-hidden="true">
        <div className="book-stack book-stack-back" />
        <div className="book-stack book-stack-middle" />
        <div className="book-stack book-stack-front">
          <span />
          <i />
          <b />
        </div>
        <div className="upload-sparkle">✳</div>
      </div>
      <div className="upload-copy">
        <div className="upload-kicker">SEU ESPAÇO, SEUS LIVROS</div>
        <h2>Tem um PDF para ler?</h2>
        <p>Adicione um livro à sua estante e continue de onde quiser.</p>
        <button className="primary-button" onClick={() => inputRef.current?.click()}>
          <Icon name="upload" size={17} /> Escolher um PDF <Icon name="arrow" size={16} />
        </button>
        <span className="upload-caption">ou arraste o arquivo para cá · Seus arquivos ficam no dispositivo</span>
      </div>
      <div className="upload-stamp">
        <Icon name="file" size={17} />
        <span>PDF</span>
      </div>
    </section>
  );
}