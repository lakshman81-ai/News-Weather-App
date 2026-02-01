import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

import Header from '../components/Header';
import NewsSection from '../components/NewsSection';
import SectionNavigator from '../components/SectionNavigator';
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
import { useMediaQuery } from '../hooks/useMediaQuery';
import MarketPage from './MarketPage';


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

    // Responsive Detection
    const { isWebView, isDesktop } = useMediaQuery();

    // Dynamic Timeline Logic
    const getTimelinePills = () => {
        const hour = new Date().getHours();
        if (hour < 12) return ['Morning', 'Midday', 'Evening'];
        if (hour < 17) return ['Midday', 'Evening', 'Tomorrow Morning'];
        return ['Evening', 'Tomorrow Morning', 'Tomorrow Midday'];
    };

    const [timelinePills, setTimelinePills] = useState(() => getTimelinePills());

    // Update active pill to match first available slot on mount/change
    useEffect(() => {
        const currentPills = getTimelinePills();
        setTimelinePills(currentPills);
        // Only reset if current active isn't in the new list (preserves user selection if valid)
        if (!currentPills.includes(activePill)) {
            setActivePill(currentPills[0]);
        }
    }, []); // Run once on mount, we can add a timer if needed for long sessions

    // Update logs Reactively
    useEffect(() => {
        const sub = (newLogs) => setVLog(newLogs);
        logSubscribers.add(sub);
        return () => logSubscribers.delete(sub);
    }, []);

    // Use Contexts
    const { weatherData, loading: weatherLoading, refreshWeather } = useWeather();
    const { newsData, loading, errors, breakingNews, refreshNews } = useNews();

    const { sections, market: marketSettings, uiMode = 'timeline' } = settings;

    // Detect uiMode changes
    useEffect(() => {
        console.log('[MainPage] UI mode changed:', uiMode);
    }, [uiMode]);

    // Reset timeline state when switching to classic mode to avoid stale state
    useEffect(() => {
        if (uiMode === 'classic') {
            setActivePill('Morning'); // Reset to default
        }
    }, [uiMode]);

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

        // Only attach touch listeners on mobile to avoid interference on desktop
        if (!isDesktop) {
            document.addEventListener('touchstart', handleTouchStart);
            document.addEventListener('touchmove', handleTouchMove);
            document.addEventListener('touchend', handleTouchEnd);
        }

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [refreshNews, refreshWeather, isDesktop]);

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



    const isTimelineMode = uiMode === 'timeline';

    // Navigation Sections for Floating Tabs
    const navSections = [
        { id: 'world-news', icon: '🌍', label: 'World' },
        sections.india?.enabled && { id: 'india-news', icon: '🇮🇳', label: 'India' },
        sections.local?.enabled && { id: 'local-news', icon: '📍', label: 'Muscat' },
        sections.social?.enabled && { id: 'social-trends', icon: '📈', label: 'Trends' },
        sections.entertainment?.enabled && { id: 'entertainment', icon: '🎬', label: 'Entertainment' }
    ].filter(Boolean);

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
        <div className={`page-container mode-${uiMode} ${isWebView ? 'page-container--desktop' : ''}`}>
            {/* Conditional Header Rendering */}
            {isTimelineMode ? (
                <TimelineHeader
                    activePill={activePill}
                    onPillChange={setActivePill}
                    pills={timelinePills}
                />
            ) : (
                <Header
                    title="Daily Event AI"
                    icon="🌅"
                    actions={headerActions}
                    pills={timelinePills}
                    activePill={activePill}
                    onPillChange={setActivePill}
                />
            )}

            <main className={`main-content ${isWebView ? 'main-content--desktop' : ''}`}>

                {/* Desktop Sidebar: Weather appears here for Timeline mode */}
                {isWebView && isTimelineMode && (
                    <QuickWeather activePill={activePill} />
                )}

                {/* Right Content Column (Corrects Grid Layout) */}
                <div className="content-wrapper">
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

                            <BreakingNews items={breakingNews} />
                        </>
                    )}

                    {/* Mobile/Tablet Timeline Mode: Weather appears inline here */}
                    {!isWebView && isTimelineMode && (
                        <QuickWeather activePill={activePill} />
                    )}

                    {/* Stale Data Warning Banner */}
                    {settings.strictFreshness && (
                        <div className="alert-banner" style={{
                            display: (weatherData && (Date.now() - (weatherData.fetchedAt || 0)) > settings.staleWarningHours * 3600000) ||
                                (newsData.world && newsData.world[0] && (Date.now() - newsData.world[0].fetchedAt) > settings.staleWarningHours * 3600000)
                                ? 'flex' : 'none'
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

                    {/* News Sections */}
                    <div className="news-sections news-sections--grid">
                        <NewsSection
                            id="world-news"
                            title="Global Updates"
                            icon="🌍"
                            colorClass="news-section__title--world"
                            news={newsData.world}
                            maxDisplay={8}
                        />


                        {/* India News */}
                        {sections.india?.enabled && (
                            <NewsSection
                                id="india-news"
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
                                id="chennai-news"
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
                                id="trichy-news"
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
                                id="local-news"
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
                                id="social-trends"
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
                                id="entertainment"
                                title="Entertainment"
                                icon="🎬"
                                colorClass="news-section__title--entertainment"
                                news={newsData.entertainment}
                                maxDisplay={sections.entertainment.count || 8}
                                error={errors.entertainment}
                            />
                        )}
                    </div>

                    {/* Self-Check Summary */}
                    <div className="card" style={{ marginTop: 'var(--spacing-lg)', fontSize: 'var(--font-size-xs)' }}>
                        <div style={{ fontWeight: 600, marginBottom: 'var(--spacing-sm)', color: 'var(--accent-primary)' }}>
                            SYSTEM STATUS
                        </div>
                        <div style={{ color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                            UI Mode: {isTimelineMode ? 'Timeline' : 'Classic'}<br />
                            Platform: {isWebView ? 'Desktop/Web' : 'Mobile'}<br />
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
                </div>
            </main>

            {/* Floating Section Navigator */}
            <SectionNavigator sections={navSections} />
        </div>
    );
}

export default MainPage;
