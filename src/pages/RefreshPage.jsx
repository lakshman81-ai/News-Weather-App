import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { getSettings, saveSettings, getTimeSinceRefresh, setLastRefresh } from '../utils/storage';
import { getCurrentSegment, getRecommendedToggles } from '../utils/timeSegment';

/**
 * Refresh Page Component
 * Allows user to:
 * - Select sections to refresh
 * - See last refresh time
 * - Trigger refresh
 * - View refresh schedule
 */
function RefreshPage() {
    const navigate = useNavigate();
    const [settings, setSettings] = useState(null);
    const [refreshToggles, setRefreshToggles] = useState({
        world: true,
        india: true,
        chennai: true,
        trichy: true,
        local: true,
        social: false,
        weather: true,
        market: true
    });
    const [loading, setLoading] = useState(false);
    const [lastRefresh, setLastRefreshTime] = useState('Never');
    const [recommended, setRecommended] = useState({});

    useEffect(() => {
        const saved = getSettings();
        setSettings(saved);
        setLastRefreshTime(getTimeSinceRefresh());

        // Get recommended toggles and apply them
        const segment = getCurrentSegment();
        const rec = getRecommendedToggles(segment);
        setRecommended(rec);
        setRefreshToggles(rec);
    }, []);

    const handleRefresh = async () => {
        setLoading(true);

        // Simulate API refresh
        await new Promise(resolve => setTimeout(resolve, 2000));

        // Update last refresh timestamps
        const sections = Object.keys(refreshToggles).filter(k => refreshToggles[k]);
        sections.forEach(section => setLastRefresh(section));

        setLastRefreshTime('Just now');
        setLoading(false);

        // Navigate to main page after refresh
        setTimeout(() => navigate('/'), 500);
    };

    const toggleAll = (value) => {
        setRefreshToggles({
            world: value,
            india: value,
            chennai: value,
            trichy: value,
            local: value,
            social: value,
            weather: value,
            market: value
        });
    };

    const sectionConfig = [
        { key: 'world', icon: '🌐', label: 'World News', desc: 'International headlines' },
        { key: 'india', icon: '🇮🇳', label: 'India News', desc: 'National news' },
        { key: 'chennai', icon: '🏛️', label: 'Chennai News', desc: 'Chennai city updates' },
        { key: 'trichy', icon: '🏛️', label: 'Trichy News', desc: 'Trichy local news' },
        { key: 'local', icon: '📍', label: 'Local (Muscat)', desc: 'Muscat & Oman news' },
        { key: 'social', icon: '👥', label: 'Social Trends', desc: 'Trending topics' },
        { key: 'weather', icon: '☁️', label: 'Weather', desc: 'Chennai, Trichy, Muscat' },
        { key: 'market', icon: '📈', label: 'Market', desc: 'BSE, NSE, Movers' }
    ];

    const selectedCount = Object.values(refreshToggles).filter(Boolean).length;

    return (
        <>
            <Header title="Refresh Content" showBack backTo="/" />

            <div className="refresh-page">
                {/* Last Refresh Info */}
                <div className="refresh-info">
                    <span>⏱️</span>
                    <span>Last refresh: <strong>{lastRefresh}</strong></span>
                </div>

                {/* Quick Actions */}
                <div style={{
                    display: 'flex',
                    gap: 'var(--spacing-sm)',
                    marginBottom: 'var(--spacing-md)'
                }}>
                    <button
                        className="btn btn--secondary"
                        style={{ flex: 1 }}
                        onClick={() => toggleAll(true)}
                    >
                        Select All
                    </button>
                    <button
                        className="btn btn--secondary"
                        style={{ flex: 1 }}
                        onClick={() => toggleAll(false)}
                    >
                        Clear All
                    </button>
                </div>

                {/* Section Selection */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📋</span>
                        Select Sections to Refresh
                        <span style={{
                            marginLeft: 'auto',
                            fontSize: '0.8rem',
                            fontWeight: 'normal',
                            color: 'var(--accent-primary)'
                        }}>
                            {selectedCount}/{sectionConfig.length}
                        </span>
                    </h2>

                    <div className="settings-card">
                        {sectionConfig.map(({ key, icon, label, desc }) => (
                            <div key={key} className="settings-item">
                                <div className="settings-item__label" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <span className="settings-item__icon">{icon}</span>
                                        {label}
                                        {recommended[key] && (
                                            <span style={{ color: 'var(--weather-sun)', fontSize: '0.7rem' }}>★</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '28px' }}>
                                        {desc}
                                    </div>
                                </div>
                                <Toggle
                                    checked={refreshToggles[key]}
                                    onChange={(val) => setRefreshToggles(prev => ({ ...prev, [key]: val }))}
                                    recommended={recommended[key]}
                                />
                            </div>
                        ))}
                    </div>
                </section>

                {/* Refresh Button */}
                <button
                    className={`refresh-btn ${loading ? 'refresh-btn--loading' : ''}`}
                    onClick={handleRefresh}
                    disabled={loading || selectedCount === 0}
                >
                    <span className="refresh-btn__icon">{loading ? '⟳' : '🔄'}</span>
                    <span>{loading ? 'Refreshing...' : 'Refresh Now'}</span>
                </button>

                {/* Refresh Schedule */}
                <div className="schedule-card">
                    <div className="schedule-card__title">
                        <span>📊</span>
                        Auto-Refresh Schedule
                    </div>
                    <div className="schedule-item">
                        <span className="schedule-item__label">Weather Forecast</span>
                        <span className="schedule-item__value">Every 3 hours</span>
                    </div>
                    <div className="schedule-item">
                        <span className="schedule-item__label">Weather Nowcast</span>
                        <span className="schedule-item__value">Every 1 hour</span>
                    </div>
                    <div className="schedule-item">
                        <span className="schedule-item__label">News Updates</span>
                        <span className="schedule-item__value">Every 30 minutes</span>
                    </div>
                    <div className="schedule-item">
                        <span className="schedule-item__label">Market Data</span>
                        <span className="schedule-item__value">Every 5 minutes</span>
                    </div>
                    <div className="schedule-item">
                        <span className="schedule-item__label">Social Trends</span>
                        <span className="schedule-item__value">Every 15 minutes</span>
                    </div>
                </div>

                {/* Segment Info */}
                <div className="card" style={{ marginTop: 'var(--spacing-md)', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Current Segment: <strong style={{ color: 'var(--accent-primary)' }}>
                            {getCurrentSegment()?.name}
                        </strong>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        ★ = Recommended sections for this time
                    </div>
                </div>
            </div>
        </>
    );
}

export default RefreshPage;
