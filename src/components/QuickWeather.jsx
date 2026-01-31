import React, { useState } from 'react';
import { useWeather } from '../context/WeatherContext';

/**
 * Quick Weather Widget
 * Compact weather display for Timeline UI with multi-model data
 */
const QuickWeather = ({ activePill = 'Morning' }) => {
    const { weatherData, loading, error } = useWeather();
    const [activeCity, setActiveCity] = useState('chennai');

    if (loading) return <div className="quick-weather">Loading weather...</div>;
    if (error || !weatherData) return <div className="quick-weather">Weather unavailable</div>;

    const data = weatherData[activeCity];
    if (!data) return null;

    // Map Time Pill to Data Key
    let timeKey = 'morning';
    let summaryPrefix = "Start your day with";

    const pill = activePill;
    if (pill === 'Morning') {
        timeKey = 'morning';
        summaryPrefix = "Start your day with";
    } else if (pill === 'Midday') {
        timeKey = 'noon';
        summaryPrefix = "As the day progresses, expect";
    } else if (pill === 'Evening') {
        timeKey = 'evening';
        summaryPrefix = "Your evening outlook is";
    } else if (pill === 'Tomorrow Morning') {
        timeKey = 'tomorrow.morning';
        summaryPrefix = "Tomorrow starts with";
    } else if (pill === 'Tomorrow Midday') {
        timeKey = 'tomorrow.noon';
        summaryPrefix = "Tomorrow midday will be";
    }

    // Handle nested keys like 'tomorrow.morning'
    let displayData;
    if (timeKey.includes('.')) {
        const [root, sub] = timeKey.split('.');
        displayData = data[root]?.[sub];
    } else {
        displayData = data[timeKey];
    }
    displayData = displayData || data.current;

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

                    {/* Enhanced Rain Display with Multi-Model Consensus */}
                    {displayData.rainProb ? (
                        <span className={displayData.rainProb.isWideRange ? 'rain-uncertain' : 'rain-confident'}>
                            {displayData.rainProb.isWideRange && '⚠️ '}
                            Rain: {displayData.rainProb.displayString}
                            {displayData.rainMm && displayData.rainMm !== '0.0mm' && ` • ${displayData.rainMm}`}
                        </span>
                    ) : (
                        <span>Rain: ~0%</span>
                    )}

                    {/* Real Wind Data */}
                    {displayData.windSpeed != null ? (
                        <span>Wind: {displayData.windSpeed} km/h</span>
                    ) : (
                        <span>Wind: N/A</span>
                    )}

                    {/* Humidity */}
                    {displayData.humidity != null && (
                        <span>Humidity: {displayData.humidity}%</span>
                    )}

                    {/* UV Index */}
                    {displayData.uvIndex != null && (
                        <span>UV: {displayData.uvIndex}</span>
                    )}
                </div>
            </div>

            <div className="qw-summary">
                {summaryPrefix} {displayData.temp}°C and {data.current.condition}. {data.summary}
            </div>

            {/* Model Attribution */}
            {data.models?.names && (
                <div style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    marginTop: '8px',
                    textAlign: 'center',
                    opacity: 0.7
                }}>
                    Data from {data.models.count} model{data.models.count > 1 ? 's' : ''}: {data.models.names}
                </div>
            )}
        </section>
    );
};

export default QuickWeather;
