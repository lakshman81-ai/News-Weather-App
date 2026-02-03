import React from 'react';
import ThemeToggle from './ThemeToggle';
import MarketTicker from './MarketTicker';
import appIcon from '../assets/app-icon.png';

/**
 * Timeline Header
 * Displays the Current Segment info as the title.
 */
const TimelineHeader = ({ title, icon, actions }) => {
    return (
        <header className="header timeline-header">
            <h1 className="header__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <img src={appIcon} alt="App Icon" style={{ width: '24px', height: '24px' }} />
                <span>{title}</span>
            </h1>

            <MarketTicker />

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThemeToggle />
                {actions}
            </div>
        </header>
    );
};

export default TimelineHeader;
