import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';

/**
 * Quick Weather Widget
 * Compact weather display for Timeline UI.
 */
const QuickWeather = ({ activePill = 'Morning' }) => {
    const { weatherData, loading, error } = useWeather();
    const [activeCity, setActiveCity] = useState('chennai');

    if (loading) return <div className="quick-weather">Loading weather...</div>;
    if (error || !weatherData) return <div className="quick-weather">Weather unavailable</div>;

    const data = weatherData[activeCity];
    if (!data) return null;

    // Map Time Pill to Data Key
    // Default to 'current' if no match, though usually we map to morning/noon/evening
    let timeKey = 'morning';
    let summaryPrefix = "Start your day with";

    // Explicit mapping to handle potential case sensitivity or extra pill types
    const pill = activePill;

    if (pill === 'Midday') {
        timeKey = 'noon';
        summaryPrefix = "As the day progresses, expect";
    } else if (pill === 'Evening') {
        timeKey = 'evening';
        summaryPrefix = "Your evening outlook is";
    }

    // Fallback to current if specific slot is missing (safety)
    const displayData = data[timeKey] || data.current;

    // Safety check for displayData
    if (!displayData) return null;

    return (
        <section className="quick-weather">
            <div className="qw-header">
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                    {pill} Weather — {data.name}
                </div>
                <div className="qw-city-toggles">
                    {['chennai', 'trichy', 'muscat'].map(city => (
                        <button
                            key={city}
                            className={`qw-toggle ${activeCity === city ? 'qw-toggle--active' : ''}`}
                            onClick={() => setActiveCity(city)}
                        >
                            {city.charAt(0).toUpperCase() + city.slice(1)}
                        </button>
                    ))}
                </div>
            </div>

            <div className="qw-body">
                <div className="qw-temp-group">
                    <span className="qw-icon">{displayData.icon}</span>
                    <div>
                        <div className="qw-temp">{displayData.temp}°C</div>
                    </div>
                </div>

                <div className="qw-details">
                    <span className="qw-feels">Feels like {displayData.feelsLike}°C</span>
                    {/* Display Rich Rain Data */}
                    {displayData.rain ? (
                        <span>
                            Rain: {displayData.rain.totalMm}mm  ({displayData.rain.probBg}% avg)
                        </span>
                    ) : (
                        <span>Rain: {displayData.rainProb?.avg ?? 0}%</span>
                    )}
                    <span>Wind: 12 km/h</span> {/* Placeholder */}
                </div>
            </div>

            <div className="qw-summary">
                {summaryPrefix} {displayData.temp}°C and {data.current.condition}. {data.summary}
            </div>
        </section>
    );
};

export default QuickWeather;
