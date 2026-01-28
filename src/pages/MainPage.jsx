import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { Link } from 'react-router-dom';
import WeatherCard from '../components/WeatherCard';
import NewsSection from '../components/NewsSection';
import MarketCard from '../components/MarketCard';
import SegmentBadge from '../components/SegmentBadge';
import { getCurrentSegment, shouldShowDTNext } from '../utils/timeSegment';
import { getSettings } from '../utils/storage';
import { fetchWeather } from '../services/weatherService';
import { fetchNews } from '../services/newsService';
import {
    MOCK_MARKET,
    MOCK_DT_NEXT,
    getTopline
} from '../data/mockData';

/**
 * Main Page Component
 * Displays real-time data for Weather and News
 */
function MainPage() {
    const [segment, setSegment] = useState(null);
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    // Real Data State
    const [weatherData, setWeatherData] = useState(null);
    const [newsData, setNewsData] = useState({});
    const [errors, setErrors] = useState({});

    useEffect(() => {
        // Get current segment and settings
        const currentSegment = getCurrentSegment();
        setSegment(currentSegment);

        const savedSettings = getSettings();
        setSettings(savedSettings);

        // API Keys
        const newsApiKey = localStorage.getItem('news_api_key');
        // Using the settings state directly would be better, but we need it inside loadData immediately.
        // The 'settings' state might not be set yet when this runs if we rely on the state variable which is set in same effect.
        // Safer to read from storage directly or use the parsed object 'savedSettings' we just got.
        const ddgApiKey = savedSettings?.duckDuckGoApiKey || '';

        const loadData = async () => {
            if (!savedSettings) return;

            // 1. Fetch Weather (Open-Meteo - Free)
            if (savedSettings.sections.weather !== false) {
                try {
                    const cities = ['chennai', 'trichy', 'muscat'];
                    const weatherPromises = cities.map(city => fetchWeather(city).catch(e => null));
                    const [chennai, trichy, muscat] = await Promise.all(weatherPromises);

                    setWeatherData({
                        chennai: chennai,
                        trichy: trichy,
                        muscat: muscat
                    });
                } catch (err) {
                    setErrors(prev => ({ ...prev, weather: 'Weather Unavailable (API Error)' }));
                }
            }

            // 2. Fetch News (Smart Service: API -> RSS Fallback)
            const newsSections = [
                { key: 'world', query: 'World' },
                { key: 'india', query: 'India' },
                { key: 'chennai', query: 'Chennai' },
                { key: 'trichy', query: 'Trichy' },
                { key: 'local', query: 'Muscat' },
                { key: 'social', query: 'Social Media Trends' },
                { key: 'entertainment', query: 'Entertainment' }
            ];

            const fetchedNews = {};
            const newsErrors = {};

            await Promise.all(newsSections.map(async ({ key, query }) => {
                if (savedSettings.sections[key]?.enabled) {
                    try {
                        // Service handles API key check AND RSS fallback internally
                        const articles = await fetchNews(query, { newsApiKey, ddgApiKey });
                        if (articles && articles.length > 0) {
                            fetchedNews[key] = articles;
                        } else {
                            newsErrors[key] = 'No news found (RSS/API unavailable).';
                        }
                    } catch (err) {
                        newsErrors[key] = 'Unable to fetch news.';
                    }
                }
            }));

            setNewsData(fetchedNews);
            setErrors(prev => ({ ...prev, ...newsErrors }));
            setLoading(false);
        };

        loadData();

        // Update segment every minute
        const interval = setInterval(() => {
            setSegment(getCurrentSegment());
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    if (loading || !settings) {
        return (
            <div className="main-page">
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <span>Loading real-time data...</span>
                </div>
            </div>
        );
    }

    const { sections, market: marketSettings } = settings;
    const showDTNext = shouldShowDTNext(segment);

    const formatTime = (date) => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <>
            <Header title="Daily Event AI" icon="🌅" subtitle={`Last updated: ${formatTime(new Date())}`}>
                <Link to="/settings" className="header__action-btn" title="Settings">
                    ⚙️
                </Link>
                <Link to="/refresh" className="header__action-btn" title="Refresh">
                    🔄
                </Link>
            </Header>

            <main className="main-page">
                {/* Segment Badge */}
                <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                    <SegmentBadge segment={segment} />
                </div>

                {/* Topline */}
                <div className="topline">
                    <div className="topline__label">TOPLINE</div>
                    <div className="topline__text">{getTopline(segment)}</div>
                </div>

                {/* Weather */}
                {sections.weather !== false && (
                    <div className="mb-4">
                        {weatherData ? (
                            <WeatherCard weatherData={weatherData} />
                        ) : (
                            <div className="error-card">
                                {errors.weather || 'Loading Weather...'}
                            </div>
                        )}
                    </div>
                )}

                {/* News Sections Iterator */}
                {[
                    { key: 'world', title: 'World News', icon: '🌐', cls: 'world' },
                    { key: 'india', title: 'India News', icon: '🇮🇳', cls: 'india' },
                    { key: 'chennai', title: 'Chennai News', icon: '🏛️', cls: 'chennai' },
                    { key: 'trichy', title: 'Trichy News', icon: '🏛️', cls: 'trichy' },
                    { key: 'local', title: 'Local News (Muscat)', icon: '📍', cls: 'local' },
                    { key: 'social', title: 'Social Trends', icon: '👥', cls: 'social' },
                    { key: 'entertainment', title: 'Entertainment', icon: '🎬', cls: 'entertainment' }
                ].map(({ key, title, icon, cls }) => (
                    sections[key]?.enabled && (
                        <div key={key}>
                            {newsData[key] ? (
                                <NewsSection
                                    title={title}
                                    icon={icon}
                                    colorClass={`news-section__title--${cls}`}
                                    news={newsData[key]}
                                    maxDisplay={sections[key].count || 5}
                                />
                            ) : (
                                <div className="news-section">
                                    <h2 className={`news-section__title news-section__title--${cls}`}>
                                        <span>{icon}</span> {title}
                                    </h2>
                                    <div className="error-message">
                                        {errors[key] || 'Loading...'}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                ))}

                {/* Market (Keeping Mock for now, logic update not requested for market yet) */}
                {(marketSettings.showBSE || marketSettings.showNSE) && (
                    <MarketCard
                        marketData={MOCK_MARKET}
                        settings={marketSettings}
                    />
                )}
            </main>
        </>
    );
}

export default MainPage;
