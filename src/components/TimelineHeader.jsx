import React, { useState, useEffect } from 'react';

/**
 * Timeline Header
 * Displays contextual greeting, date, and time-block filters.
 * Replaces standard header in Timeline UI Mode.
 */
const TimelineHeader = ({ activePill, onPillChange, pills }) => {
    const [greeting, setGreeting] = useState('Good Morning');
    const [dateString, setDateString] = useState('');

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            const hour = now.getHours();

            // Greeting Logic
            if (hour < 12) setGreeting('Good Morning');
            else if (hour < 17) setGreeting('Good Afternoon');
            else if (hour < 21) setGreeting('Good Evening');
            else setGreeting('Good Night');

            // Date Format: Thursday - 6:55 AM
            const options = { weekday: 'long', hour: 'numeric', minute: '2-digit' };
            setDateString(now.toLocaleDateString('en-US', options));
        };

        updateTime();
        const interval = setInterval(updateTime, 60000); // Update every minute
        return () => clearInterval(interval);
    }, []);

    const defaultPills = ['Morning', 'Midday', 'Evening'];
    const displayPills = pills || defaultPills;

    return (
        <header className="timeline-header">
            <h1 className="timeline-greeting">{greeting}</h1>
            <div className="timeline-context">
                <span>{dateString}</span>
                <span>•</span>
                <span>Muscat</span>
            </div>

            <div className="timeline-pills">
                {displayPills.map((pill) => (
                    <button
                        key={pill}
                        className={`time-pill ${activePill === pill ? 'time-pill--active' : ''}`}
                        onClick={() => onPillChange(pill)}
                    >
                        {pill}
                    </button>
                ))}
            </div>
        </header>
    );
};

export default TimelineHeader;
