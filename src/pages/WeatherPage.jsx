import React from 'react';
import Header from '../components/Header';
import WeatherCard from '../components/WeatherCard';
import { useWeather } from '../context/WeatherContext';


/**
 * Weather Page
 * Dedicated page for detailed weather forecast
 */
function WeatherPage() {
    const { weatherData, loading, error, refreshWeather } = useWeather();

    // Use real data, if loading show spinner or skeletal (handled by parent/logic could improve)
    // For now, if no data and no error, it might be loading or initial.
    const displayData = weatherData;

    const handleRefresh = () => {
        refreshWeather(true);
    };

    return (
        <div className="page-container">
            <Header
                title="Weather Forecast"
                icon="☁️"
                actions={
                    <button
                        onClick={handleRefresh}
                        className="header__action-btn"
                        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                    >
                        {loading ? '⟳' : '🔄'}
                    </button>
                }
            />

            <main className="main-content">
                {error && (
                    <div className="topline" style={{ borderLeftColor: 'var(--accent-danger)' }}>
                        <div className="topline__label" style={{ color: 'var(--accent-danger)' }}>Error</div>
                        <div className="topline__text">Failed to update weather. Showing cached data.</div>
                    </div>
                )}

                <WeatherCard weatherData={displayData} />
            </main>
        </div>
    );
}

export default WeatherPage;
