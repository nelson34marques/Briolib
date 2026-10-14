import React from 'react';

export default function Brand({ className = 'brand', as: Component = 'a', showMark = true, ...props }) {
  const Tag = Component;
  return (
    <Tag className={className} {...props}>
      {showMark && (
        <span className="brand-mark">
          <img src="/src/logoBrio.png" alt="" style={{ width: 22, height: 22, borderRadius: 5, objectFit: 'cover' }} />
        </span>
      )}
      <span>
        BrioLib<span className="brand-period">.</span>
      </span>
    </Tag>
  );
}
