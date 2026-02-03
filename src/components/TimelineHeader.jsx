import React from 'react';
import ThemeToggle from './ThemeToggle';

/**
 * Timeline Header
 * Displays the Current Segment info as the title.
 */
const TimelineHeader = ({ title, icon, actions }) => {
    return (
        <header className="header timeline-header">
            <h1 className="header__title" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem' }}>
                <span className="header__title-icon">{icon}</span>
                <span>{title}</span>
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ThemeToggle />
                {actions}
            </div>
        </header>
    );
};

export default TimelineHeader;
