import React from 'react';

/**
 * Timeline Header (Simplified)
 * Just displays the App Icon and Actions (Last Updated / Refresh).
 * Contextual Pills moved to QuickWeather.
 */
const TimelineHeader = ({ actions }) => {
    return (
        <header className="timeline-header">
            <h1 className="header__title">
                <span className="header__title-icon">🌅</span>
            </h1>

            {actions}
        </header>
    );
};

export default TimelineHeader;
