import React, { useState, useEffect } from 'react';
import { useWeather } from '../context/WeatherContext';

/**
 * Quick Weather Widget
 * Compact weather display for Timeline UI with multi-model data.
 * Now includes Timeline Pills (Morning/Midday/Evening) for context switching.
 */
const QuickWeather = ({ activePill = 'Morning', onPillChange, pills = ['Morning', 'Midday', 'Evening'] }) => {
    const { weatherData, loading, error } = useWeather();
    const [activeCity, setActiveCity] = useState(() => {
        try {
            return localStorage.getItem('weather_active_city') || 'chennai';
        } catch (e) {
            return 'chennai';
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('weather_active_city', activeCity);
        } catch (e) {
            // Ignore storage errors
        }
    }, [activeCity]);

    // Icon Mapping helper
    const getPillIcon = (pillName) => {
        if (pillName.includes('Morning')) return '🌅';
        if (pillName.includes('Midday')) return '☀️';
        if (pillName.includes('Evening')) return '🌙';
        return pillName;
    };

    const getCityIcon = (cityName) => {
        if (cityName === 'chennai') return '🏛️';
        if (cityName === 'trichy') return '🏯';
        if (cityName === 'muscat') return '📍';
        return cityName;
    };

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
            {/* Timeline Pills Header */}
            <div className="qw-header" style={{ marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                <div className="qw-pills" style={{ display: 'flex', gap: '4px', overflowX: 'auto' }}>
                    {pills.map((p) => (
                        <button
                            key={p}
                            className={`time-pill ${activePill === p ? 'time-pill--active' : ''}`}
                            onClick={() => onPillChange && onPillChange(p)}
                            title={p}
                            style={{
                                padding: '4px 8px',
                                fontSize: '1.2rem',
                                background: activePill === p ? 'rgba(255,255,255,0.2)' : 'transparent',
                                border: 'none',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                        >
                            {getPillIcon(p)}
                        </button>
                    ))}
                </div>

                <div className="qw-city-toggles">
                    {['chennai', 'trichy', 'muscat'].map(city => (
                        <button
                            key={city}
                            className={`qw-toggle ${activeCity === city ? 'qw-toggle--active' : ''}`}
                            onClick={() => setActiveCity(city)}
                            title={city.charAt(0).toUpperCase() + city.slice(1)}
                            style={{ fontSize: '1.2rem', padding: '4px 8px' }}
                        >
                            {getCityIcon(city)}
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
