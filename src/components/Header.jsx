import React from 'react';
import { Link } from 'react-router-dom';
import MarketTicker from './MarketTicker';

/**
 * Header Component with optional back navigation
 */
function Header({ title, icon, showBack = false, backTo = '/', actions, pills, activePill, onPillChange }) {
    // Icon Mapping helper
    const getPillIcon = (pillName) => {
        if (pillName.includes('Morning')) return '🌅';
        if (pillName.includes('Midday')) return '☀️';
        if (pillName.includes('Evening')) return '🌙';
        return pillName;
    };

    return (
        <header className="header">
            {showBack ? (
                <Link to={backTo} className="header__back">
                    <span>←</span>
                    <span>{title}</span>
                </Link>
            ) : (
                <h1 className="header__title">
                    {/* Icon removed as requested */}
                </h1>
            )}

            {!showBack && <MarketTicker />}

            {/* Contextual Pills (Classic Mode) - REMOVED or Deprecated if pills move to weather */}
            {/* Keeping logic for now but MainPage will stop passing pills if we want to remove them here */}
            {pills && (
                <div className="header__pills">
                    {pills.map((pill) => (
                        <button
                            key={pill}
                            className={`time-pill time-pill--matte ${activePill === pill ? 'time-pill--active' : ''}`}
                            onClick={() => onPillChange && onPillChange(pill)}
                            title={pill}
                        >
                            {getPillIcon(pill)}
                        </button>
                    ))}
                </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {actions}
            </div>
        </header>
    );
}

export default Header;
