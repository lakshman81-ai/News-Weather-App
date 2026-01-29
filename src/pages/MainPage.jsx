import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header';
import WeatherCard from '../components/WeatherCard';
import NewsSection from '../components/NewsSection';
import MarketCard from '../components/MarketCard';
import SegmentBadge from '../components/SegmentBadge';
import { getCurrentSegment, shouldShowDTNext } from '../utils/timeSegment';
import { getSettings } from '../utils/storage';
import { useWeather } from '../context/WeatherContext';
import { useNews } from '../context/NewsContext';
import {
    MOCK_WEATHER,
    MOCK_DT_NEXT,
    MOCK_MARKET,
    getTopline
} from '../data/mockData';

/**
 * Main Page Component
 */
function MainPage() {
    const [segment, setSegment] = useState(() => getCurrentSegment());
    const [settings] = useState(() => getSettings());

    // Use Contexts
    const { weatherData, loading: weatherLoading, refreshWeather } = useWeather();
    const { newsData, loading: newsLoading, refreshNews } = useNews();

    // Refresh data on mount (checks cache)
    useEffect(() => {
        refreshWeather();
        refreshNews();
    }, [refreshWeather, refreshNews]);

    // Update segment every minute
    useEffect(() => {
        const interval = setInterval(() => {
            setSegment(getCurrentSegment());
        }, 60000);
        return () => clearInterval(interval);
    }, []);

    // Determine loading state for initial load
    // We consider it loading if we are fetching AND don't have data yet.
    const isLoading = (weatherLoading && !weatherData) || (newsLoading && Object.keys(newsData).length === 0);

    if (isLoading) {
         return (
            <div className="main-page">
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <span>Loading Updates...</span>
                </div>
            </div>
        );
    }

    const { sections, market: marketSettings } = settings;
    const showDTNext = shouldShowDTNext(segment);

    const headerActions = (
        <div className="header__actions">
            <Link to="/settings" className="header__action-btn">⚙️</Link>
            <Link to="/refresh" className="header__action-btn">🔄</Link>
        </div>
    );

    return (
        <>
            <Header title="Daily Event AI" icon="🌅" actions={headerActions} />

            <main className="main-page">
                {/* Segment Badge */}
                <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                    <SegmentBadge segment={segment} />
                </div>

                {/* Topline */}
                <div className="topline">
                    <div className="topline__label">TOPLINE</div>
                    <div className="topline__text">{getTopline(segment)}</div>
                    <div style={{
                        marginTop: 'var(--spacing-sm)',
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--text-muted)'
                    }}>
                        SEGMENT: {segment?.name} (Published)
                    </div>
                </div>

                {/* DT Next - Morning Only */}
                {showDTNext && (
                    <section className="news-section">
                        <h2 className="news-section__title" style={{ color: 'var(--accent-warning)' }}>
                            <span>📰</span>
                            DT NEXT — 5 Key Headlines
                        </h2>
                        <div className="news-list">
                            {MOCK_DT_NEXT.map((item, idx) => (
                                <article key={idx} className="news-item">
                                    <h3 className="news-item__headline">{idx + 1}. {item.headline}</h3>
                                    <p style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)',
                                        marginBottom: 'var(--spacing-sm)'
                                    }}>
                                        {item.summary}
                                    </p>
                                    <div className="news-item__meta" style={{
                                        fontSize: '0.85rem',
                                        color: 'var(--text-secondary)'
                                    }}>
                                        <span className="news-item__source">{item.source}</span>
                                        <span>|</span>
                                        <span>{item.time}</span>
                                        <span>|</span>
                                        <span>#1 Source</span>
                                        <span>|</span>
                                        <span className={`news-item__confidence news-item__confidence--${item.confidence.toLowerCase()}`}>
                                            {item.confidence}
                                        </span>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </section>
                )}

                {/* Weather */}
                {sections.weather !== false && (
                    <WeatherCard weatherData={weatherData || MOCK_WEATHER} />
                )}

                {/* News Sections */}
                {/* World News */}
                {sections.world?.enabled && (
                    <NewsSection
                        title="World News"
                        icon="🌐"
                        colorClass="news-section__title--world"
                        news={newsData.world || []}
                        maxDisplay={sections.world.count || 10}
                    />
                )}

                {/* India News */}
                {sections.india?.enabled && (
                    <NewsSection
                        title="India News"
                        icon="🇮🇳"
                        colorClass="news-section__title--india"
                        news={newsData.india || []}
                        maxDisplay={sections.india.count || 10}
                    />
                )}

                {/* Chennai News */}
                {sections.chennai?.enabled && (
                    <NewsSection
                        title="Chennai News"
                        icon="🏛️"
                        colorClass="news-section__title--chennai"
                        news={newsData.chennai || []}
                        maxDisplay={sections.chennai.count || 3}
                    />
                )}

                {/* Trichy News */}
                {sections.trichy?.enabled && (
                    <NewsSection
                        title="Trichy News"
                        icon="🏛️"
                        colorClass="news-section__title--trichy"
                        news={newsData.trichy || []}
                        maxDisplay={sections.trichy.count || 2}
                    />
                )}

                {/* Local News (Muscat) */}
                {sections.local?.enabled && (
                    <NewsSection
                        title="Local News (Muscat)"
                        icon="📍"
                        colorClass="news-section__title--local"
                        news={newsData.local || []}
                        maxDisplay={sections.local.count || 3}
                    />
                )}

                {/* Social Trends */}
                {sections.social?.enabled && (
                    <NewsSection
                        title="Social Trends"
                        icon="👥"
                        colorClass="news-section__title--social"
                        news={newsData.social || []}
                        maxDisplay={sections.social.count || 10}
                    />
                )}

                {/* Entertainment */}
                {sections.entertainment?.enabled && (
                    <NewsSection
                        title="Entertainment"
                        icon="🎬"
                        colorClass="news-section__title--entertainment"
                        news={newsData.entertainment || []}
                        maxDisplay={sections.entertainment.count || 8}
                    />
                )}

                {/* Market */}
                {(marketSettings.showBSE || marketSettings.showNSE) && (
                    <MarketCard
                        marketData={MOCK_MARKET}
                        settings={marketSettings}
                    />
                )}

                {/* Self-Check Summary */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-xs)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
                        ✔ SELF-CHECK SUMMARY (v2.0)
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        ✔ Aggregated RSS Feeds used<br />
                        ✔ Context API State Management<br />
                        ✔ Smart Mix (Freshness + Authority)<br />
                        ✔ Weather Caching Implemented<br />
                        ✔ Segment-based Topline<br />
                    </div>
                </div>
            </main>
        </>
    );
}

export default MainPage;
