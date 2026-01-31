import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { useSettings } from '../context/SettingsContext';
import { getCurrentSegment, getRecommendedToggles } from '../utils/timeSegment';
import { discoverFeeds } from '../utils/feedDiscovery';

/**
 * Settings Page Component
 * Configures:
 * - Google API Key
 * - DuckDuckGo API Key
 * - News sections (toggle + count)
 * - Market settings
 * - Weather sources
 * - News sources
 */
function SettingsPage() {

    const { settings, updateSettings, reloadSettings } = useSettings();
    const [showGoogleKey, setShowGoogleKey] = useState(false);
    const [showDuckKey, setShowDuckKey] = useState(false);
    const [showGeminiKey, setShowGeminiKey] = useState(false);
    const [testStatus, setTestStatus] = useState({});
    const [saved, setSaved] = useState(false);
    const [recommended, _setRecommended] = useState(() => getRecommendedToggles(getCurrentSegment()));

    // Feed Discovery State
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveryError, setDiscoveryError] = useState(null);

    const handleAddFeed = async () => {
        if (!newFeedUrl) return;
        setIsDiscovering(true);
        setDiscoveryError(null);

        try {
            const feeds = await discoverFeeds(newFeedUrl);
            if (feeds.length > 0) {
                // Determine best feed (prioritize explicit fits or just take first)
                const bestFeed = feeds[0];

                updateSettings({
                    ...settings,
                    customFeeds: [...(settings.customFeeds || []), { title: bestFeed.title, url: bestFeed.url }]
                });
                setNewFeedUrl('');
            } else {
                setDiscoveryError('No feeds found. Check the URL or try a direct RSS link.');
            }
        } catch (err) {
            setDiscoveryError('Error discovering feeds.');
        } finally {
            setIsDiscovering(false);
        }
    };

    useEffect(() => {


        // Get recommended toggles based on current segment

    }, []);

    const handleSave = () => {
        // Settings are already saved via updateSettings, but we can trigger a visual confirmation
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const removeCustomFeed = (index) => {
        const newFeeds = [...(settings.customFeeds || [])];
        newFeeds.splice(index, 1);
        updateSettings({ ...settings, customFeeds: newFeeds });
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            updateSettings({ ...DEFAULT_SETTINGS });
            reloadSettings(); // Ensure fresh state
        }
    };

    const updateSection = (section, field, value) => {
        updateSettings({
            ...settings,
            sections: {
                ...settings.sections,
                [section]: {
                    ...settings.sections[section],
                    [field]: value
                }
            }
        });
    };

    const updateMarket = (field, value) => {
        updateSettings({
            ...settings,
            market: {
                ...settings.market,
                [field]: value
            }
        });
    };

    const updateWeatherSource = (source, value) => {
        updateSettings({
            ...settings,
            weatherSources: {
                ...settings.weatherSources,
                [source]: value
            }
        });
    };

    const updateNewsSource = (source, value) => {
        updateSettings({
            ...settings,
            newsSources: {
                ...settings.newsSources,
                [source]: value
            }
        });
    };

    const testApiKey = async (type) => {
        setTestStatus(prev => ({ ...prev, [type]: 'testing' }));
        // Simulate API test
        await new Promise(resolve => setTimeout(resolve, 1000));
        const key = type === 'google' ? settings.googleApiKey : settings.duckDuckGoApiKey;
        if (key && key.length > 10) { // Simple validation
            setTestStatus(prev => ({ ...prev, [type]: 'success' }));
        } else {
            setTestStatus(prev => ({ ...prev, [type]: 'error' }));
        }
        setTimeout(() => setTestStatus(prev => ({ ...prev, [type]: null })), 3000);
    };

    const applyRecommended = () => {
        if (!settings) return;

        updateSettings({
            ...settings,
            sections: {
                world: { ...settings.sections.world, enabled: recommended.world },
                india: { ...settings.sections.india, enabled: recommended.india },
                chennai: { ...settings.sections.chennai, enabled: recommended.chennai },
                trichy: { ...settings.sections.trichy, enabled: recommended.trichy },
                local: { ...settings.sections.local, enabled: recommended.local },
                social: { ...settings.sections.social, enabled: recommended.social },
                entertainment: { ...settings.sections.entertainment, enabled: true }
            },
            market: {
                ...settings.market,
                showBSE: recommended.market,
                showNSE: recommended.market
            }
        });
    };

    if (!settings) {
        return (
            <div className="settings-page">
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <span>Loading settings...</span>
                </div>
            </div>
        );
    }

    const sectionConfig = [
        { key: 'world', icon: '🌐', label: 'World News', min: 5, max: 15 },
        { key: 'india', icon: '🇮🇳', label: 'India News', min: 5, max: 15 },
        { key: 'chennai', icon: '🏛️', label: 'Chennai News', min: 3, max: 5 },
        { key: 'trichy', icon: '🏛️', label: 'Trichy News', min: 2, max: 3 },
        { key: 'local', icon: '📍', label: 'Local (Muscat)', min: 3, max: 5 },
        { key: 'social', icon: '👥', label: 'Social Trends', min: 5, max: 15 },
        { key: 'entertainment', icon: '🎬', label: 'Entertainment', min: 3, max: 10 }
    ];

    return (
        <>
            <Header title="Settings" showBack backTo="/" />

            <div className="settings-page">
                {/* Recommended Settings Banner */}
                <div
                    className="card"
                    style={{
                        marginBottom: 'var(--spacing-lg)',
                        background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.1), rgba(88, 166, 255, 0.1))',
                        border: '1px solid var(--accent-primary)'
                    }}
                    onClick={applyRecommended}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                        <span style={{ fontSize: '1.5rem' }}>⭐</span>
                        <div>
                            <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                                Apply Recommended Settings
                            </div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                Based on current time segment
                            </div>
                        </div>
                    </div>
                </div>

                {/* UI Configuration */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📱</span>
                        Interface
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <div className="settings-item__label" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 600 }}>Home Layout</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    {settings.uiMode === 'timeline' ? 'Timeline Navigator (New)' : 'Classic Dashboard'}
                                </div>
                            </div>
                            <Toggle
                                checked={settings.uiMode === 'timeline'}
                                onChange={(val) => updateSettings({ ...settings, uiMode: val ? 'timeline' : 'classic' })}
                            />
                        </div>
                    </div>
                </section>

                {/* Data Freshness Configuration */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🛡️</span>
                        Data Freshness
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <div className="settings-item__label" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                <div style={{ fontWeight: 600 }}>Strict Freshness</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    Hide old data (Fail-Closed)
                                </div>
                            </div>
                            <Toggle
                                checked={settings.strictFreshness}
                                onChange={(val) => updateSettings({ ...settings, strictFreshness: val })}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="settings-item__label">
                                News Max Age (Hours)
                            </div>
                            <input
                                type="number"
                                className="settings-item__count"
                                min={1}
                                max={48}
                                value={settings.freshnessLimitHours || 26}
                                onChange={(e) => updateSettings({ ...settings, freshnessLimitHours: parseInt(e.target.value) || 26 })}
                            />
                        </div>

                        <div className="settings-item">
                            <div className="settings-item__label">
                                Weather Max Age (Hours)
                            </div>
                            <input
                                type="number"
                                className="settings-item__count"
                                min={1}
                                max={12}
                                value={settings.weatherFreshnessLimit || 4}
                                onChange={(e) => updateSettings({ ...settings, weatherFreshnessLimit: parseInt(e.target.value) || 4 })}
                            />
                        </div>
                    </div>
                </section>

                {/* API Configuration */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🔑</span>
                        API Configuration
                    </h2>

                    <div className="settings-card">
                        {/* Google API Key */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="api-input-group">
                                <label style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                    Google API Key
                                </label>
                                <div className="api-input-row">
                                    <input
                                        type={showGoogleKey ? 'text' : 'password'}
                                        className="api-input"
                                        value={settings.googleApiKey}
                                        onChange={(e) => updateSettings({ ...settings, googleApiKey: e.target.value })}
                                        placeholder="Enter Google API Key"
                                    />
                                    <button
                                        className="api-btn"
                                        onClick={() => setShowGoogleKey(!showGoogleKey)}
                                    >
                                        {showGoogleKey ? '🙈' : '👁️'}
                                    </button>
                                    <button
                                        className="api-btn api-btn--test"
                                        onClick={() => testApiKey('google')}
                                        disabled={testStatus.google === 'testing'}
                                    >
                                        {testStatus.google === 'testing' ? '...' :
                                            testStatus.google === 'success' ? '✓' :
                                                testStatus.google === 'error' ? '✗' : 'Test'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* DuckDuckGo API Key */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="api-input-group">
                                <label style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                    DuckDuckGo API Key
                                </label>
                                <div className="api-input-row">
                                    <input
                                        type={showDuckKey ? 'text' : 'password'}
                                        className="api-input"
                                        value={settings.duckDuckGoApiKey}
                                        onChange={(e) => updateSettings({ ...settings, duckDuckGoApiKey: e.target.value })}
                                        placeholder="Enter DuckDuckGo API Key"
                                    />
                                    <button
                                        className="api-btn"
                                        onClick={() => setShowDuckKey(!showDuckKey)}
                                    >
                                        {showDuckKey ? '🙈' : '👁️'}
                                    </button>
                                    <button
                                        className="api-btn api-btn--test"
                                        onClick={() => testApiKey('duck')}
                                        disabled={testStatus.duck === 'testing'}
                                    >
                                        {testStatus.duck === 'testing' ? '...' :
                                            testStatus.duck === 'success' ? '✓' :
                                                testStatus.duck === 'error' ? '✗' : 'Test'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Gemini API Key */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="api-input-group">
                                <label style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                    Gemini API Key <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>(AI Reasoning)</span>
                                </label>
                                <div className="api-input-row">
                                    <input
                                        type={showGeminiKey ? 'text' : 'password'}
                                        className="api-input"
                                        value={settings.geminiApiKey || ''}
                                        onChange={(e) => updateSettings({ ...settings, geminiApiKey: e.target.value })}
                                        placeholder="Enter Gemini API Key"
                                    />
                                    <button
                                        className="api-btn"
                                        onClick={() => setShowGeminiKey(!showGeminiKey)}
                                    >
                                        {showGeminiKey ? '🙈' : '👁️'}
                                    </button>
                                    <button
                                        className="api-btn api-btn--test"
                                        onClick={() => testApiKey('gemini')}
                                        disabled={testStatus.gemini === 'testing'}
                                    >
                                        {testStatus.gemini === 'testing' ? '...' :
                                            testStatus.gemini === 'success' ? '✓' :
                                                testStatus.gemini === 'error' ? '✗' : 'Test'}
                                    </button>
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                    ⚠️ Gemini is post-processor only. Never fetches or decides relevance.
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Crawler Mode */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🤖</span>
                        Crawler Mode
                    </h2>

                    <div className="settings-card">
                        {[
                            { value: 'auto', label: 'Auto', icon: '⭐', desc: 'Uses segment timing logic + FSM (recommended)' },
                            { value: 'manual', label: 'Manual', icon: '👆', desc: 'Only refresh when you tap Refresh' },
                            { value: 'scheduled', label: 'Scheduled', icon: '⏰', desc: 'Background refresh on intervals' }
                        ].map(({ value, label, icon, desc }) => (
                            <div
                                key={value}
                                className="settings-item"
                                style={{
                                    cursor: 'pointer',
                                    background: settings.crawlerMode === value ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                                    borderLeft: settings.crawlerMode === value ? '3px solid var(--accent-primary)' : '3px solid transparent'
                                }}
                                onClick={() => updateSettings({ ...settings, crawlerMode: value })}
                            >
                                <div className="settings-item__label" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                        <span>{icon}</span>
                                        <span style={{ fontWeight: 600 }}>{label}</span>
                                        {value === 'auto' && (
                                            <span style={{
                                                fontSize: '0.65rem',
                                                background: 'var(--accent-primary)',
                                                color: 'var(--bg-primary)',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}>DEFAULT</span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '28px' }}>
                                        {desc}
                                    </div>
                                </div>
                                <div style={{
                                    width: '20px',
                                    height: '20px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--border-default)',
                                    background: settings.crawlerMode === value ? 'var(--accent-primary)' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {settings.crawlerMode === value && (
                                        <span style={{ color: 'var(--bg-primary)', fontSize: '0.7rem' }}>✓</span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Auto mode uses segment timing to intelligently decide what to refresh
                    </div>
                </section>

                {/* News Sections & Counts */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🌍</span>
                        News Sections & Counts
                    </h2>

                    <div className="settings-card">
                        {sectionConfig.map(({ key, icon, label, min, max }) => (
                            <div key={key} className="settings-item">
                                <div className="settings-item__label">
                                    <span className="settings-item__icon">{icon}</span>
                                    {label}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
                                    <input
                                        type="number"
                                        className="settings-item__count"
                                        min={min}
                                        max={max}
                                        value={settings.sections[key]?.count || min}
                                        onChange={(e) => {
                                            const val = Math.min(max, Math.max(min, parseInt(e.target.value) || min));
                                            updateSection(key, 'count', val);
                                        }}
                                    />
                                    <Toggle
                                        checked={settings.sections[key]?.enabled}
                                        onChange={(val) => updateSection(key, 'enabled', val)}
                                        recommended={recommended[key]}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        ★ = Recommended for current time segment
                    </div>
                </section>

                {/* Market Settings */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📈</span>
                        Market Settings
                    </h2>

                    <div className="settings-card">
                        <div className="settings-item">
                            <span className="settings-item__label">Show BSE Data</span>
                            <Toggle
                                checked={settings.market.showBSE}
                                onChange={(val) => updateMarket('showBSE', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show NSE Data</span>
                            <Toggle
                                checked={settings.market.showNSE}
                                onChange={(val) => updateMarket('showNSE', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Gainers</span>
                            <Toggle
                                checked={settings.market.showGainers}
                                onChange={(val) => updateMarket('showGainers', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Losers</span>
                            <Toggle
                                checked={settings.market.showLosers}
                                onChange={(val) => updateMarket('showLosers', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Market Movers</span>
                            <Toggle
                                checked={settings.market.showMovers}
                                onChange={(val) => updateMarket('showMovers', val)}
                            />
                        </div>
                    </div>
                </section>

                {/* Weather Sources */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🌤️</span>
                        Weather Sources
                    </h2>

                    <div className="settings-card">
                        <div className="settings-item">
                            <span className="settings-item__label">AccuWeather</span>
                            <Toggle
                                checked={settings.weatherSources.accuWeather}
                                onChange={(val) => updateWeatherSource('accuWeather', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">ECMWF</span>
                            <Toggle
                                checked={settings.weatherSources.ecmwf}
                                onChange={(val) => updateWeatherSource('ecmwf', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">IMD/RSMC</span>
                            <Toggle
                                checked={settings.weatherSources.imd}
                                onChange={(val) => updateWeatherSource('imd', val)}
                            />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)' }}>
                        Rain % = Average of enabled sources
                    </div>
                </section>

                {/* News Sources */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📰</span>
                        News Sources
                    </h2>

                    <div className="settings-card">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-default)' }}>
                            {[
                                { key: 'bbc', label: 'BBC' },
                                { key: 'reuters', label: 'Reuters' },
                                { key: 'ndtv', label: 'NDTV' },
                                { key: 'theHindu', label: 'The Hindu' },
                                { key: 'toi', label: 'TOI' },
                                { key: 'financialExpress', label: 'FE' },
                                { key: 'dtNext', label: 'DT Next' },
                                { key: 'omanObserver', label: 'Oman Obs' },
                                { key: 'moneyControl', label: 'MoneyCtrl' },
                                { key: 'indiaToday', label: 'India Today' },
                                { key: 'variety', label: 'Variety' },
                                { key: 'hollywoodReporter', label: 'THR' },
                                { key: 'bollywoodHungama', label: 'BH' },
                                { key: 'filmCompanion', label: 'Film Comp' }
                            ].map(({ key, label }) => (
                                <div key={key} className="settings-item" style={{ background: 'var(--bg-card)' }}>
                                    <span className="settings-item__label" style={{ fontSize: '0.85rem' }}>{label}</span>
                                    <Toggle
                                        checked={settings.newsSources[key]}
                                        onChange={(val) => updateNewsSource(key, val)}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Custom Feeds (Phase 7) */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📡</span>
                        Custom Feeds
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div className="api-input-group">
                                <label style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>
                                    Add New Feed
                                </label>
                                <div className="api-input-row">
                                    <input
                                        type="text"
                                        className="api-input"
                                        value={newFeedUrl}
                                        onChange={(e) => setNewFeedUrl(e.target.value)}
                                        placeholder="Enter Website or RSS URL"
                                    />
                                    <button
                                        className="api-btn api-btn--test"
                                        onClick={handleAddFeed}
                                        disabled={isDiscovering}
                                    >
                                        {isDiscovering ? 'Searching...' : 'Add'}
                                    </button>
                                </div>
                                {discoveryError && (
                                    <div style={{ color: 'var(--text-error)', fontSize: '0.75rem', marginTop: '4px' }}>
                                        {discoveryError}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* List of Custom Feeds */}
                        {settings.customFeeds && settings.customFeeds.length > 0 && (
                            <div style={{ marginTop: '12px' }}>
                                <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '8px', color: 'var(--text-secondary)' }}>
                                    Your Feeds
                                </div>
                                {settings.customFeeds.map((feed, index) => (
                                    <div key={index} className="settings-item" style={{ background: 'var(--bg-card)', padding: '8px 12px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                                            <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{feed.title}</span>
                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                {feed.url}
                                            </span>
                                        </div>
                                        <button
                                            className="btn btn--danger"
                                            style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                            onClick={() => removeCustomFeed(index)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </section>

                {/* Action Buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)', marginTop: 'var(--spacing-lg)' }}>
                    <button
                        className="btn btn--primary btn--full"
                        onClick={handleSave}
                    >
                        {saved ? '✓ Saved!' : 'Save Settings'}
                    </button>
                    <button
                        className="btn btn--danger btn--full"
                        onClick={handleReset}
                    >
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </>
    );
}

export default SettingsPage;
