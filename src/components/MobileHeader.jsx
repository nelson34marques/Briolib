import React from 'react';
import Brand from './Brand.jsx';
import Icon from './Icon.jsx';

export default function MobileHeader() {
  return (
    <header className="mobile-header">
      <Brand />
      <span className="mobile-library-label">Sua biblioteca</span>
    </header>
  );
}
