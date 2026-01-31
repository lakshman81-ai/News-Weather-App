import React from 'react';
import { getWeatherTimeBlocks } from '../utils/timeSegment';

/**
 * Weather Card Component
 * Displays weather for Chennai, Trichy, Muscat with:
 * - 3 time rows (Morning/Noon/Evening based on current time)
 * - Temperature with feels-like
 * - Rain probability (averaged from 3 models with confidence indicator)
 * - Rain amount in mm
 * - Enhanced metrics: UV, Humidity, Wind, Cloud Cover
 * - Per-location summaries
 * - Model source attribution
 */
function WeatherCard({ weatherData }) {
    const timeBlocks = getWeatherTimeBlocks();
    const cities = ['chennai', 'trichy', 'muscat'];

    // Check if any city has severe weather
    const hasSevereWeather = cities.some(city => weatherData[city]?.isSevere);
    const severeAlert = cities.find(city => weatherData[city]?.alert)
        ? weatherData[cities.find(city => weatherData[city]?.alert)]?.alert
        : null;

    // Get UV index color class
    const getUVClass = (uvIndex) => {
        if (uvIndex == null) return '';
        if (uvIndex <= 2) return 'uv-low';
        if (uvIndex <= 5) return 'uv-moderate';
        if (uvIndex <= 7) return 'uv-high';
        if (uvIndex <= 10) return 'uv-very-high';
        return 'uv-extreme';
    };

    const getUVLabel = (uvIndex) => {
        if (uvIndex == null) return 'N/A';
        if (uvIndex <= 2) return 'Low';
        if (uvIndex <= 5) return 'Moderate';
        if (uvIndex <= 7) return 'High';
        if (uvIndex <= 10) return 'Very High';
        return 'Extreme';
    };

    // Get wind direction arrow
    const getWindDirection = (degrees) => {
        if (degrees == null) return '';
        const directions = ['↓', '↙', '←', '↖', '↑', '↗', '→', '↘'];
        const index = Math.round(((degrees % 360) / 45)) % 8;
        return directions[index];
    };

    return (
        <section className={`weather-section ${hasSevereWeather ? 'weather-section--severe' : ''}`}>
            <h2 className="weather-section__title">
                <span>☁️</span>
                Weather Forecast
                {hasSevereWeather && <span style={{ marginLeft: '8px' }}>⚠️</span>}
            </h2>

            <div className="card">
                <div className="weather-grid">
                    {/* Header Row */}
                    <div className="weather-grid__header"></div>
                    {cities.map(city => (
                        <div key={city} className="weather-grid__header">
                            {weatherData[city]?.icon} {weatherData[city]?.name}
                            {city === 'muscat' && weatherData[city]?.localTime && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                    {weatherData[city].localTime}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Time Block Rows */}
                    {timeBlocks.map((block, idx) => (
                        <React.Fragment key={idx}>
                            <div className="weather-grid__time">
                                <span>{block.label}</span>
                                <span className="weather-grid__time-label">{block.sublabel}</span>
                            </div>
                            {cities.map(city => {
                                const data = weatherData[city]?.[block.period];
                                if (!data) {
                                    return (
                                        <div key={city} className="weather-grid__cell">
                                            <span style={{ color: 'var(--text-muted)' }}>N/A</span>
                                        </div>
                                    );
                                }
                                return (
                                    <div key={city} className="weather-grid__cell">
                                        <div className="weather-icon">{data.icon}</div>
                                        <div className="weather-temp">{data.temp}°C</div>
                                        <div className="weather-feels">Feels {data.feelsLike}°</div>

                                        {/* Enhanced Rainfall Display with Consensus Indicator */}
                                        <div className="weather-rain">
                                            <span className={`weather-rain-prob ${data.rainProb?.isWideRange ? 'rain-uncertain' : 'rain-confident'}`}>
                                                {data.rainProb?.isWideRange && <span className="rain-warning-icon">⚠️ </span>}
                                                🌧️ {data.rainProb?.displayString || '~0%'}
                                            </span>
                                            {data.rainMm && data.rainMm !== '0.0mm' && (
                                                <span className="weather-rain-mm">{data.rainMm}</span>
                                            )}
                                        </div>

                                        {/* Additional Metrics */}
                                        <div className="weather-extra-metrics">
                                            {data.humidity != null && (
                                                <div className="weather-metric">
                                                    💧 {data.humidity}%
                                                </div>
                                            )}
                                            {data.windSpeed != null && (
                                                <div className="weather-metric">
                                                    🌬️ {data.windSpeed} km/h
                                                </div>
                                            )}
                                            {data.uvIndex != null && (
                                                <div className={`weather-metric ${getUVClass(data.uvIndex)}`}>
                                                    ☀️ UV {data.uvIndex}
                                                </div>
                                            )}
                                            {data.cloudCover != null && (
                                                <div className="weather-metric">
                                                    ☁️ {data.cloudCover}%
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ))}
                </div>

                {/* Per-Location Summaries */}
                <div style={{ marginTop: 'var(--spacing-md)' }}>
                    {cities.map(city => (
                        <div
                            key={city}
                            className="weather-summary"
                            style={{
                                marginBottom: 'var(--spacing-sm)',
                                borderRadius: 'var(--radius-sm)'
                            }}
                        >
                            <span className="weather-summary__icon">
                                {weatherData[city]?.icon || '📝'}
                            </span>
                            <div style={{ flex: 1 }}>
                                <div style={{
                                    fontWeight: 600,
                                    fontSize: '0.85rem',
                                    marginBottom: '4px',
                                    color: 'var(--text-primary)'
                                }}>
                                    {weatherData[city]?.name}
                                    {weatherData[city]?.current?.humidity != null && (
                                        <span style={{
                                            marginLeft: '8px',
                                            fontSize: '0.75rem',
                                            color: 'var(--text-muted)',
                                            fontWeight: 400
                                        }}>
                                            💧 {weatherData[city].current.humidity}% •
                                            🌬️ {weatherData[city].current.windSpeed || 0} km/h {getWindDirection(weatherData[city].current.windDirection)}
                                        </span>
                                    )}
                                </div>
                                <span style={{ lineHeight: 1.6 }}>
                                    {weatherData[city]?.summary || 'Weather summary not available.'}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Multi-Model Attribution Footer */}
                    <div style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        textAlign: 'right',
                        marginTop: '12px',
                        padding: '8px',
                        background: 'var(--bg-secondary)',
                        borderRadius: 'var(--radius-sm)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div>
                            <strong>Multi-Model Forecast:</strong> Averaged from{' '}
                            {weatherData.chennai?.models?.count || 3} weather model
                            {(weatherData.chennai?.models?.count || 3) > 1 ? 's' : ''}
                        </div>
                        <div className="weather-model-badge">
                            {weatherData.chennai?.models?.names || 'ECMWF, GFS, ICON'}
                        </div>
                    </div>

                    {/* Rainfall Consensus Legend */}
                    <div style={{
                        fontSize: '0.65rem',
                        color: 'var(--text-muted)',
                        marginTop: '8px',
                        padding: '6px 8px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid var(--accent-primary)'
                    }}>
                        <strong>Rainfall Indicator:</strong>
                        <span style={{ marginLeft: '6px' }}>
                            <span className="rain-confident">~</span> = Models agree (±30%)
                        </span>
                        <span style={{ marginLeft: '12px' }}>
                            <span className="rain-uncertain">⚠️ !</span> = Wide range (&gt;30% spread)
                        </span>
                    </div>
                </div>

                {/* Severe Weather Alert */}
                {severeAlert && (
                    <div className="weather-alert">
                        <span className="weather-alert__icon">{severeAlert.icon}</span>
                        <div>
                            <div className="weather-alert__text">{severeAlert.type}</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                {severeAlert.message}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}

export default WeatherCard;
