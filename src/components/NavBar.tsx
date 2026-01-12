import React from 'react';

interface NavBarProps {
  onBack?: () => void;
  title?: string;
}

export function NavBar({ onBack, title = 'Quick Split' }: NavBarProps) {
  return (
    <nav className="navbar">
      <div className="navbar-content">
        {onBack ? (
          <button onClick={onBack} className="navbar-back" aria-label="Go back">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </button>
        ) : (
          <div className="navbar-spacer" />
        )}
        <h1 className="navbar-title">{title}</h1>
        <div className="navbar-spacer" />
      </div>
    </nav>
  );
}
