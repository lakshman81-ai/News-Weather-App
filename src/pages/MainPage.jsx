import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import Header from '../components/Header';
import NewsSection from '../components/NewsSection';
import BreakingNews from '../components/BreakingNews';
import MarketTicker from '../components/MarketTicker';
import SegmentBadge from '../components/SegmentBadge';
import TimelineHeader from '../components/TimelineHeader';
import QuickWeather from '../components/QuickWeather';
import { getCurrentSegment, shouldShowDTNext, getTopline } from '../utils/timeSegment';
import { getSettings, getTimeSinceRefresh, getLastRefresh } from '../utils/storage';
import { useWeather } from '../context/WeatherContext';
import { useNews } from '../context/NewsContext';
import { useSettings } from '../context/SettingsContext';


// DEBUG LOGGING SYSTEM
const logs = [];
const logSubscribers = new Set();
const addLog = (msg) => {
    logs.push(msg);
    if (logs.length > 200) logs.shift();
    logSubscribers.forEach(sub => sub([...logs]));
};

if (typeof window !== 'undefined') {
    const patch = (type) => {
        const original = console[type];
        console[type] = (...args) => {
            const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            const prefix = type === 'error' ? '❌' : type === 'warn' ? '⚠️' : 'ℹ️';
            addLog(`${prefix} ${new Date().toLocaleTimeString()} - ${msg}`);
            original(...args);
        };
    };
    patch('log');
    patch('error');
    patch('warn');
}

const MainPage = () => {
    const { settings } = useSettings();
    const [segment, setSegment] = useState(() => getCurrentSegment());
    const [activePill, setActivePill] = useState('Morning'); // Timeline UI state
    const [vLog, setVLog] = useState([...logs]);

    // Update logs Reactively
    useEffect(() => {
        const sub = (newLogs) => setVLog(newLogs);
        logSubscribers.add(sub);
        return () => logSubscribers.delete(sub);
    }, []);

    // Use Contexts
    const { weatherData, loading: weatherLoading, refreshWeather } = useWeather();
    const { newsData, loading, errors, breakingNews, refreshNews } = useNews();

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

    // Pull-to-Refresh Logic
    useEffect(() => {
        let startY = 0;
        let isPulling = false;

        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        };

        const handleTouchMove = (e) => {
            if (!isPulling) return;
            const currentY = e.touches[0].clientY;
            if (currentY - startY > 150) { // Threshold
                // Here we would visually show "Release to refresh"
            }
        };

        const handleTouchEnd = (e) => {
            if (!isPulling) return;
            const endY = e.changedTouches[0].clientY;
            if (endY - startY > 150 && window.scrollY === 0) {
                refreshNews();
                refreshWeather();
            }
            isPulling = false;
        };

        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchmove', handleTouchMove);
        document.addEventListener('touchend', handleTouchEnd);

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [refreshNews, refreshWeather]);

    // Determine loading state
    const isLoading = (weatherLoading && !weatherData) || (loading && Object.keys(newsData).length === 0);

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

    const { sections, market: marketSettings, uiMode = 'timeline' } = settings;



    const isTimelineMode = uiMode === 'timeline';

    const headerActions = (
        <div className="header__actions">
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'right', marginRight: 'var(--spacing-sm)' }}>
                Updated: {getTimeSinceRefresh()}
            </div>
            <Link to="/refresh" className="header__action-btn">🔄</Link>
            <Link to="/settings" className="header__action-btn">⚙️</Link>
        </div>
    );

    return (
        <div className="page-container">
            {/* Conditional Header Rendering */}
            {isTimelineMode ? (
                <>
                    <TimelineHeader activePill={activePill} onPillChange={setActivePill} />
                    <QuickWeather activePill={activePill} />
                </>
            ) : (
                <Header title="Daily Event AI" icon="🌅" actions={headerActions} />
            )}

            <main className="main-content">
                {/* Legacy UI Elements (Classic Mode Only) */}
                {!isTimelineMode && (
                    <>
                        {/* Stale Warning and Topline are Classic features */}
                        <div style={{ marginBottom: 'var(--spacing-md)', textAlign: 'center' }}>
                            <SegmentBadge segment={segment} />
                        </div>
                        <div className="topline">
                            <div className="topline__label">TOPLINE</div>
                            <div className="topline__text">{getTopline(segment)}</div>
                            <div style={{ marginTop: 'var(--spacing-sm)', fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                                SEGMENT: {segment?.name} (Published)
                            </div>
                        </div>

                        {/* Critics Say Section */}
                        {critique && (
                            <div className="critics-section">
                                <div className="critics-label">Critic's Take</div>
                                <div className="critics-content">"{critique}"</div>
                            </div>
                        )}

                        {/* Breaking News Banner */}
                        <BreakingNews items={breakingNews} />
                    </>
                )}

                {/* News Sections (Shared but styled differently via props if needed) */}

                {/* Stale Data Warning Banner */}
                {settings.strictFreshness && (
                    <div style={{
                        display: (weatherData && (Date.now() - (weatherData.fetchedAt || 0)) > settings.staleWarningHours * 3600000) ||
                            (newsData.world && newsData.world[0] && (Date.now() - newsData.world[0].fetchedAt) > settings.staleWarningHours * 3600000)
                            ? 'flex' : 'none',
                        background: 'rgba(255, 87, 87, 0.15)',
                        border: '1px solid #ff5757',
                        color: '#ff5757',
                        padding: '12px',
                        margin: '0 var(--spacing-md) var(--spacing-md)',
                        borderRadius: 'var(--border-radius-md)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '10px'
                    }}>
                        <span>⚠️ Some data is older than {settings.staleWarningHours} hours.</span>
                        <Link
                            to="/refresh"
                            style={{
                                textDecoration: 'underline',
                                fontWeight: 'bold',
                                color: 'inherit'
                            }}
                            onClick={(e) => {
                                e.preventDefault();
                                refreshNews();
                                refreshWeather();
                            }}
                        >
                            Refresh Now
                        </Link>
                    </div>
                )}

                {/* News Sections (Shared but styled differently via props if needed) */}

                {/* World News */}
                {sections.world?.enabled && (
                    <NewsSection
                        title={isTimelineMode ? "Top Stories — World" : "World News"}
                        icon="🌐"
                        colorClass="news-section__title--world"
                        news={newsData.world}
                        maxDisplay={sections.world.count || 10}
                        error={errors.world}
                    />
                )}

                {/* India News */}
                {sections.india?.enabled && (
                    <NewsSection
                        title={isTimelineMode ? "India" : "India News"}
                        icon="🇮🇳"
                        colorClass="news-section__title--india"
                        news={newsData.india}
                        maxDisplay={sections.india.count || 10}
                        error={errors.india}
                    />
                )}

                {/* Chennai News */}
                {sections.chennai?.enabled && (
                    <NewsSection
                        title={isTimelineMode ? "Tamil Nadu" : "Chennai News"}
                        icon="🏛️"
                        colorClass="news-section__title--chennai"
                        news={newsData.chennai}
                        maxDisplay={sections.chennai.count || 3}
                        error={errors.chennai}
                    />
                )}

                {/* Trichy News */}
                {sections.trichy?.enabled && (
                    <NewsSection
                        title={isTimelineMode ? "Trichy" : "Trichy News"}
                        icon="🏛️"
                        colorClass="news-section__title--trichy"
                        news={newsData.trichy}
                        maxDisplay={sections.trichy.count || 2}
                        error={errors.trichy}
                    />
                )}

                {/* Local News (Muscat) */}
                {sections.local?.enabled && (
                    <NewsSection
                        title={isTimelineMode ? "Local — Muscat" : "Local News (Muscat)"}
                        icon="📍"
                        colorClass="news-section__title--local"
                        news={newsData.local}
                        maxDisplay={sections.local.count || 3}
                        error={errors.local}
                    />
                )}

                {/* Social Trends */}
                {sections.social?.enabled && (
                    <NewsSection
                        title={isTimelineMode ? "Social" : "Social Trends"}
                        icon="👥"
                        colorClass="news-section__title--social"
                        news={newsData.social}
                        maxDisplay={sections.social.count || 10}
                        error={errors.social}
                    />
                )}

                {/* Entertainment */}
                {sections.entertainment?.enabled && (
                    <NewsSection
                        title="Entertainment"
                        icon="🎬"
                        colorClass="news-section__title--entertainment"
                        news={newsData.entertainment}
                        maxDisplay={sections.entertainment.count || 8}
                        error={errors.entertainment}
                    />
                )}

                {/* Self-Check Summary */}
                <div className="card" style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-xs)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
                        SYSTEM STATUS
                    </div>
                    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                        UI Mode: {isTimelineMode ? 'Timeline' : 'Classic'}<br />
                        Accessibility: Enhanced<br />
                        Strict Mode: {settings.strictFreshness ? 'Active' : 'Off'}<br />
                        Live Feeds Active<br />
                    </div>
                </div>

                {/* DEBUG CONSOLE (STAYS VISIBLE IN PROD PREVIEW) */}
                <div style={{
                    marginTop: '20px',
                    padding: '15px',
                    background: '#0a0a0a',
                    border: '1px solid #333',
                    borderRadius: '8px',
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    color: '#00ff41',
                    height: '200px',
                    overflowY: 'auto',
                    boxShadow: '0 0 20px rgba(0,255,65,0.1)'
                }}>
                    <div style={{ borderBottom: '1px solid #333', paddingBottom: '5px', marginBottom: '10px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>SYSTEM DEBUG LOGS (REAL-TIME)</span>
                        <div>
                            <button onClick={() => refreshNews()} style={{ background: '#00ff41', color: '#000', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '10px', marginRight: '5px' }}>RE-FETCH NEWS</button>
                            <button onClick={() => window.location.reload()} style={{ background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px 8px', fontSize: '10px' }}>FORCE RELOAD</button>
                        </div>
                    </div>
                    {vLog?.map((msg, i) => (
                        <div key={i} style={{ marginBottom: '4px', borderLeft: msg.includes('❌') ? '2px solid red' : 'none', paddingLeft: '5px' }}>
                            <span style={{ color: '#888' }}>[{i}]</span> {msg}
                        </div>
                    ))}
                    {(!vLog || vLog.length === 0) && (
                        <div style={{ color: '#555' }}>Initializing logger... No logs captured yet. Try refreshing.</div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default MainPage;
