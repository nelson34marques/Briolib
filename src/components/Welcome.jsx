import React from 'react';

export default function Welcome() {
  return (
    <div className="welcome-row">
      <div>
        <img
          src="/src/logoBrio.png"
          alt="BrioLib logo"
          className="welcome-logo"
          style={{ width: 80, height: 80, borderRadius: 18, objectFit: 'cover', marginBottom: 16 }}
        />
        <div className="eyebrow">
          <span className="eyebrow-line" /> SUA BIBLIOTECA PESSOAL
        </div>
        <h1>
          Seu próximo capítulo
          <br />
          <em>começa aqui.</em>
        </h1>
        <p className="welcome-copy">Guarde seus livros em PDF e aproveite a leitura, no seu ritmo.</p>
      </div>
      <div className="sun-art" aria-hidden="true">
        <span className="sun-circle" />
        <span className="sun-leaf leaf-one" />
        <span className="sun-leaf leaf-two" />
      </div>
    </div>
  );
}
