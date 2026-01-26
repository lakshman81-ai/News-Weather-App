import React from 'react';
import { getWeatherTimeBlocks } from '../utils/timeSegment';

/**
 * Weather Card Component
 * Displays weather for Chennai, Trichy, Muscat with:
 * - 3 time rows (Morning/Noon/Evening based on current time)
 * - Temperature with feels-like
 * - Rain probability (averaged from 3 sources)
 * - Rain amount in mm
 * - Per-location summaries (3-4 lines each)
 * - Severe weather styling when applicable
 */
function WeatherCard({ weatherData, isSevere = false }) {
    const timeBlocks = getWeatherTimeBlocks();
    const cities = ['chennai', 'trichy', 'muscat'];

    // Check if any city has severe weather
    const hasSevereWeather = cities.some(city => weatherData[city]?.isSevere);
    const severeAlert = cities.find(city => weatherData[city]?.alert)
        ? weatherData[cities.find(city => weatherData[city]?.alert)]?.alert
        : null;

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
                                        <div className="weather-rain">
                                            <span className="weather-rain-prob">
                                                🌧️ {data.rainProb?.avg}%
                                            </span>
                                            {data.rainProb?.range && (
                                                <span className="weather-rain-mm">({data.rainProb.range})</span>
                                            )}
                                            {data.rainMm && data.rainMm !== '0mm' && (
                                                <span className="weather-rain-mm">{data.rainMm}</span>
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
                                </div>
                                <span style={{ lineHeight: 1.6 }}>
                                    {weatherData[city]?.summary || 'Weather summary not available.'}
                                </span>
                            </div>
                        </div>
                    ))}
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
