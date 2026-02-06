import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import MarketTicker from './MarketTicker';
import ThemeToggle from './ThemeToggle';
import { useSettings } from '../context/SettingsContext';

/**
 * Header Component with optional back navigation
 */
function Header({ title, icon, showBack = false, backTo = '/', actions, pills, activePill, onPillChange }) {
    const { settings } = useSettings();
    const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

    useEffect(() => {
        const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const showLocationIcon = settings?.rankingMode === 'context-aware' || settings?.enableProximityScoring;

    // Icon Mapping helper
    const getPillIcon = (pillName) => {
        if (pillName.includes('Morning')) return '🌅';
        if (pillName.includes('Midday')) return '☀️';
        if (pillName.includes('Evening')) return '🌙';
        return pillName;
    };

    return (
        <header className="header">
            {/* Left Side: Back or Theme Toggle (PC Only) */}
            {showBack ? (
                <Link to={backTo} className="header__back">
                    <span>←</span>
                    <span>{title}</span>
                </Link>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {isDesktop && <ThemeToggle />}
                    <h1 className="header__title">
                        {/* Icon removed as requested */}
                    </h1>
                </div>
            )}

            {!showBack && <MarketTicker />}

            {/* Contextual Pills (Classic Mode) */}
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
                {showLocationIcon && (
                    <span title="Location Boost Active" style={{ fontSize: '1.2rem', cursor: 'help' }}>
                        📍
                    </span>
                )}
                {actions}
            </div>
        </header>
    );
}

export default Header;
