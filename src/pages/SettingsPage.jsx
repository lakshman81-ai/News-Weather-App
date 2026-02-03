import React, { useState } from 'react';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import { DEFAULT_SETTINGS } from '../utils/storage';
import { useSettings } from '../context/SettingsContext';
import { discoverFeeds } from '../utils/feedDiscovery';

/**
 * Settings Page Component - REDESIGNED
 * Organized sections that match actual functionality:
 * 1. Interface (UI Mode)
 * 2. Data Freshness
 * 3. Weather Models (ECMWF, GFS, ICON)
 * 4. News Sections
 * 5. News Sources
 * 6. Market Display
 * 7. Social Trends Distribution
 * 8. Custom Feeds
 * 9. Advanced (collapsible)
 */
function SettingsPage() {
    const { settings, updateSettings, reloadSettings } = useSettings();
    const [saved, setSaved] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Feed Discovery State
    const [newFeedUrl, setNewFeedUrl] = useState('');
    const [isDiscovering, setIsDiscovering] = useState(false);
    const [discoveryError, setDiscoveryError] = useState(null);

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

    // Helper to update nested settings
    const updateNested = (path, value) => {
        const keys = path.split('.');
        const newSettings = { ...settings };
        let obj = newSettings;
        for (let i = 0; i < keys.length - 1; i++) {
            obj[keys[i]] = { ...obj[keys[i]] };
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        updateSettings(newSettings);
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        reloadSettings(); // Trigger refresh/reload of data
    };

    const handleReset = () => {
        if (confirm('Reset all settings to defaults?')) {
            updateSettings({ ...DEFAULT_SETTINGS });
            reloadSettings();
        }
    };

    const handleAddFeed = async () => {
        if (!newFeedUrl) return;
        setIsDiscovering(true);
        setDiscoveryError(null);

        try {
            const feeds = await discoverFeeds(newFeedUrl);
            if (feeds.length > 0) {
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

    const removeCustomFeed = (index) => {
        const newFeeds = [...(settings.customFeeds || [])];
        newFeeds.splice(index, 1);
        updateSettings({ ...settings, customFeeds: newFeeds });
    };

    // Section configs
    const sectionConfig = [
        { key: 'world', icon: '🌍', label: 'World News' },
        { key: 'india', icon: '🇮🇳', label: 'India News' },
        { key: 'chennai', icon: '🏛️', label: 'Chennai' },
        { key: 'trichy', icon: '🏛️', label: 'Trichy' },
        { key: 'local', icon: '📍', label: 'Muscat' },
        { key: 'social', icon: '👥', label: 'Social' },
        { key: 'entertainment', icon: '🎬', label: 'Entertainment' },
        { key: 'business', icon: '💼', label: 'Business' },
        { key: 'technology', icon: '💻', label: 'Technology' }
    ];

    const newsSourceConfig = [
        { key: 'bbc', label: 'BBC' },
        { key: 'reuters', label: 'Reuters' },
        { key: 'ndtv', label: 'NDTV' },
        { key: 'theHindu', label: 'The Hindu' },
        { key: 'toi', label: 'TOI' },
        { key: 'indiaToday', label: 'India Today' },
        { key: 'financialExpress', label: 'Fin Express' },
        { key: 'moneyControl', label: 'MoneyControl' },
        { key: 'dtNext', label: 'DT Next' },
        { key: 'omanObserver', label: 'Oman Observer' },
        { key: 'timesOfOman', label: 'Times of Oman' },
        { key: 'hollywoodReporter', label: 'THR' },
        { key: 'bollywoodHungama', label: 'Bollywood Hungama' },
        { key: 'filmCompanion', label: 'Film Companion' }
    ];

    return (
        <>
            <Header title="Settings" showBack backTo="/" />

            <div className="settings-page">

                {/* ========================================
                    SECTION 1: INTERFACE
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📱</span> Interface
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <div className="settings-item__label">
                                <span>Home Layout</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                    {settings.uiMode === 'timeline' && 'Timeline Navigator - Chronological feed'}
                                    {settings.uiMode === 'classic' && 'Classic Dashboard - Dense information'}
                                    {settings.uiMode === 'newspaper' && 'Newspaper Layout - Visual & image-rich'}
                                </small>
                            </div>
                            <select
                                value={settings.uiMode || 'timeline'}
                                onChange={(e) => updateSettings({ ...settings, uiMode: e.target.value })}
                                style={{
                                    padding: '8px 12px',
                                    background: 'var(--bg-secondary)',
                                    border: '1px solid var(--border-default)',
                                    borderRadius: 'var(--radius-sm)',
                                    color: 'var(--text-primary)',
                                    fontSize: 'var(--font-size-sm)'
                                }}
                            >
                                <option value="timeline">📱 Timeline</option>
                                <option value="classic">📊 Classic</option>
                                <option value="newspaper">📰 Newspaper</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION: APPEARANCE
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>👁️</span> Appearance
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span className="settings-item__label">Font Size</span>
                                <span style={{ fontWeight: 'bold' }}>{settings.fontSize || 26}px</span>
                            </div>
                            <input
                                type="range"
                                min="14"
                                max="34"
                                step="1"
                                value={settings.fontSize || 26}
                                onChange={(e) => updateSettings({ ...settings, fontSize: parseInt(e.target.value) })}
                                style={{ width: '100%' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                <span>Small</span>
                                <span>Default (26px)</span>
                                <span>Large</span>
                            </div>
                        </div>

                        {/* Paper Summary Length */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                <span className="settings-item__label">Paper Summary Length</span>
                                <span style={{ fontWeight: 'bold' }}>{settings.newspaper?.summaryLineLimit || 50} lines</span>
                            </div>
                            <input
                                type="range"
                                min="10"
                                max="100"
                                step="5"
                                value={settings.newspaper?.summaryLineLimit || 50}
                                onChange={(e) => updateNested('newspaper.summaryLineLimit', parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION 2: DATA FRESHNESS & LOGIC
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🛡️</span> Logic & Freshness
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <span className="settings-item__label">Filtering Mode</span>
                            <select
                                value={settings.filteringMode || 'source'}
                                onChange={(e) => updateSettings({ ...settings, filteringMode: e.target.value })}
                                style={{ padding: '6px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                            >
                                <option value="source">Source Based (Default)</option>
                                <option value="keyword">Keyword Based</option>
                            </select>
                        </div>

                        <div className="settings-item">
                            <span className="settings-item__label">Ranking Method</span>
                            <select
                                value={settings.rankingMode || 'smart'}
                                onChange={(e) => updateSettings({ ...settings, rankingMode: e.target.value })}
                                style={{ padding: '6px', borderRadius: '4px', background: 'var(--bg-secondary)', color: 'var(--text-primary)', border: '1px solid var(--border-default)' }}
                            >
                                <option value="smart">Smart Mix (Impact)</option>
                                <option value="legacy">Legacy (Freshness)</option>
                            </select>
                        </div>

                        <div className="settings-item">
                            <span className="settings-item__label">Hide stories older than (hours)</span>
                            <input
                                type="number"
                                className="settings-item__count"
                                min={1}
                                max={168}
                                value={settings.hideOlderThanHours || 60}
                                onChange={(e) => updateSettings({ ...settings, hideOlderThanHours: parseInt(e.target.value) || 60 })}
                            />
                        </div>

                        <div className="settings-item">
                            <span className="settings-item__label">Strict Mode (Hide Stale)</span>
                            <Toggle
                                checked={settings.strictFreshness}
                                onChange={(val) => updateSettings({ ...settings, strictFreshness: val })}
                            />
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION 3: WEATHER MODELS
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🌤️</span> Weather Models
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <div className="settings-item__label">
                                <span>ECMWF</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    European Centre - Most Accurate
                                </small>
                            </div>
                            <Toggle
                                checked={settings.weather?.models?.ecmwf !== false}
                                onChange={(val) => updateNested('weather.models.ecmwf', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <div className="settings-item__label">
                                <span>GFS (NOAA)</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    US Model - Good Precipitation
                                </small>
                            </div>
                            <Toggle
                                checked={settings.weather?.models?.gfs !== false}
                                onChange={(val) => updateNested('weather.models.gfs', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <div className="settings-item__label">
                                <span>ICON (DWD)</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    German Model - Excellent Coverage
                                </small>
                            </div>
                            <Toggle
                                checked={settings.weather?.models?.icon !== false}
                                onChange={(val) => updateNested('weather.models.icon', val)}
                            />
                        </div>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                        ℹ️ Rain probability is averaged from enabled models
                    </div>
                </section>

                {/* ========================================
                    SECTION 4: NEWS SECTIONS
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📰</span> News Sections
                    </h2>
                    <div className="settings-card">
                        {sectionConfig.map(({ key, icon, label }) => {
                            // Default defaults: Social=25, Others=5
                            const defaultCount = key === 'social' ? 25 : 5;
                            // Use nullish coalescing to allow 0, but fallback to default if undefined
                            const currentCount = settings.sections?.[key]?.count ?? defaultCount;

                            return (
                                <div key={key} className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div className="settings-item__label">
                                            <span>{icon}</span> {label}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>{currentCount}</span>
                                            <Toggle
                                                checked={settings.sections?.[key]?.enabled !== false}
                                                onChange={(val) => updateNested(`sections.${key}.enabled`, val)}
                                            />
                                        </div>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="25"
                                        step="1"
                                        value={currentCount}
                                        onChange={(e) => updateNested(`sections.${key}.count`, parseInt(e.target.value))}
                                        style={{ width: '100%' }}
                                    />
                                </div>
                            );
                        })}
                    </div>
                </section>

                {/* ========================================
                    SECTION 5: NEWS SOURCES
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📡</span> News Sources
                    </h2>
                    <div className="settings-card">
                        {/* Top Websites Toggle */}
                        <div className="settings-item" style={{
                            borderBottom: '1px solid var(--accent-danger)',
                            background: 'rgba(220, 38, 38, 0.15)',
                            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0'
                        }}>
                            <div className="settings-item__label" style={{ color: 'var(--accent-danger)' }}>
                                <span>🏆 Top Websites Only</span>
                                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                    BBC, Reuters, NDTV, Hindu, TOI, MoneyControl
                                </small>
                            </div>
                            <Toggle
                                checked={settings.topWebsitesOnly === true}
                                onChange={(val) => updateSettings({ ...settings, topWebsitesOnly: val })}
                            />
                        </div>

                        {/* Source Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: '1px',
                            background: 'var(--border-default)',
                            opacity: settings.topWebsitesOnly ? 0.5 : 1,
                            pointerEvents: settings.topWebsitesOnly ? 'none' : 'auto',
                            filter: settings.topWebsitesOnly ? 'grayscale(0.5)' : 'none'
                        }}>
                            {newsSourceConfig.map(({ key, label }) => (
                                <div key={key} className="settings-item" style={{ background: 'var(--bg-card)', margin: 0, borderRadius: 0, padding: '10px' }}>
                                    <span className="settings-item__label" style={{ fontSize: '0.8rem', whiteSpace: 'normal', wordBreak: 'break-word' }}>{label}</span>
                                    <Toggle
                                        checked={settings.newsSources?.[key] !== false}
                                        onChange={(val) => updateNested(`newsSources.${key}`, val)}
                                    />
                                </div>
                            ))}
                        </div>

                        {/* Custom Feed Input (Moved) */}
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px', borderTop: '1px solid var(--border-default)' }}>
                            <div className="settings-item__label" style={{ fontSize: '0.85rem' }}>Add Custom Source</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <input
                                    type="text"
                                    className="api-input"
                                    value={newFeedUrl}
                                    onChange={(e) => setNewFeedUrl(e.target.value)}
                                    placeholder="Enter RSS feed URL or website"
                                    style={{ flex: 1 }}
                                />
                                <button
                                    className="api-btn api-btn--test"
                                    onClick={handleAddFeed}
                                    disabled={isDiscovering}
                                >
                                    {isDiscovering ? '...' : 'Add'}
                                </button>
                            </div>
                            {discoveryError && (
                                <div style={{ color: 'var(--accent-danger)', fontSize: '0.75rem' }}>
                                    {discoveryError}
                                </div>
                            )}
                            {/* List of Custom Feeds */}
                            {settings.customFeeds?.map((feed, i) => (
                                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {feed.title || feed.url}
                                    </span>
                                    <button
                                        className="btn btn--danger"
                                        style={{ padding: '2px 8px', fontSize: '0.65rem', minHeight: 'auto' }}
                                        onClick={() => removeCustomFeed(i)}
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION 6: MARKET DISPLAY
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>📈</span> Market Display
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <span className="settings-item__label">Show Indices</span>
                            <Toggle
                                checked={settings.market?.showIndices !== false}
                                onChange={(val) => updateNested('market.showIndices', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Gainers</span>
                            <Toggle
                                checked={settings.market?.showGainers !== false}
                                onChange={(val) => updateNested('market.showGainers', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Losers</span>
                            <Toggle
                                checked={settings.market?.showLosers !== false}
                                onChange={(val) => updateNested('market.showLosers', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Mutual Funds</span>
                            <Toggle
                                checked={settings.market?.showMutualFunds !== false}
                                onChange={(val) => updateNested('market.showMutualFunds', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show IPO Tracker</span>
                            <Toggle
                                checked={settings.market?.showIPO !== false}
                                onChange={(val) => updateNested('market.showIPO', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Sectoral Indices</span>
                            <Toggle
                                checked={settings.market?.showSectorals !== false}
                                onChange={(val) => updateNested('market.showSectorals', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Commodities (Gold/Silver)</span>
                            <Toggle
                                checked={settings.market?.showCommodities !== false}
                                onChange={(val) => updateNested('market.showCommodities', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show Currency Rates</span>
                            <Toggle
                                checked={settings.market?.showCurrency !== false}
                                onChange={(val) => updateNested('market.showCurrency', val)}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Show FII/DII Activity</span>
                            <Toggle
                                checked={settings.market?.showFIIDII !== false}
                                onChange={(val) => updateNested('market.showFIIDII', val)}
                            />
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION: ENTERTAINMENT MIX
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🎬</span> Entertainment Mix
                    </h2>
                    <div className="settings-card">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 12px', borderBottom: '1px solid var(--border-default)' }}>
                            Adjust number of stories per category.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-default)' }}>
                            {[
                                { key: 'tamilCount', label: '🎭 Tamil' },
                                { key: 'hindiCount', label: '🎪 Hindi' },
                                { key: 'hollywoodCount', label: '🎬 Hollywood' },
                                { key: 'ottCount', label: '📺 OTT' }
                            ].map(({ key, label }) => (
                                <div key={key} style={{ padding: '12px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="settings-item__label" style={{ fontSize: '0.85rem' }}>{label}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                                            {settings.entertainment?.[key] || 0}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        step="1"
                                        value={settings.entertainment?.[key] || 0}
                                        onChange={(e) => updateNested(`entertainment.${key}`, parseInt(e.target.value))}
                                        style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION 7: SOCIAL TRENDS DISTRIBUTION
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>👥</span> Social Trends Mix
                    </h2>
                    <div className="settings-card">
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 12px', borderBottom: '1px solid var(--border-default)' }}>
                            Adjust number of stories per region.
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-default)' }}>
                            {[
                                { key: 'worldCount', label: '🌍 World' },
                                { key: 'indiaCount', label: '🇮🇳 India' },
                                { key: 'tamilnaduCount', label: '🏛️ Tamil Nadu' },
                                { key: 'muscatCount', label: '🏝️ Muscat' }
                            ].map(({ key, label }) => (
                                <div key={key} style={{ padding: '12px', background: 'var(--bg-card)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span className="settings-item__label" style={{ fontSize: '0.85rem' }}>{label}</span>
                                        <span style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--accent-primary)' }}>
                                            {settings.socialTrends?.[key] || 0}
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="20"
                                        step="1"
                                        value={settings.socialTrends?.[key] || 0}
                                        onChange={(e) => updateNested(`socialTrends.${key}`, parseInt(e.target.value))}
                                        style={{ width: '100%', cursor: 'pointer' }}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                </section>


                {/* ========================================
                    SECTION 9: ADVANCED (Collapsible)
                    ======================================== */}
                <section className="settings-section">
                    <h2
                        className="settings-section__title"
                        style={{ cursor: 'pointer' }}
                        onClick={() => setShowAdvanced(!showAdvanced)}
                    >
                        <span>⚙️</span> Advanced
                        <span style={{ marginLeft: 'auto', fontSize: '0.8rem' }}>
                            {showAdvanced ? '▲' : '▼'}
                        </span>
                    </h2>
                    {showAdvanced && (
                        <div className="settings-card">
                            <div className="settings-item">
                                <div className="settings-item__label">
                                    <span>⚡ Enable News Cache</span>
                                    <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.65rem' }}>
                                        Cache news for 5min for faster loads (10-20x speed boost)
                                    </small>
                                </div>
                                <Toggle
                                    checked={settings.enableCache !== false}
                                    onChange={(val) => updateSettings({ ...settings, enableCache: val })}
                                />
                            </div>
                            <div className="settings-item">
                                <span className="settings-item__label">Crawler Mode</span>
                                <select
                                    value={settings.crawlerMode || 'auto'}
                                    onChange={(e) => updateSettings({ ...settings, crawlerMode: e.target.value })}
                                    style={{
                                        padding: '6px 12px',
                                        background: 'var(--bg-secondary)',
                                        border: '1px solid var(--border-default)',
                                        borderRadius: '4px',
                                        color: 'var(--text-primary)'
                                    }}
                                >
                                    <option value="auto">Auto</option>
                                    <option value="manual">Manual</option>
                                    <option value="scheduled">Scheduled</option>
                                </select>
                            </div>
                            <div className="settings-item">
                                <span className="settings-item__label">Debug Logs</span>
                                <Toggle
                                    checked={settings.debugLogs === true}
                                    onChange={(val) => updateSettings({ ...settings, debugLogs: val })}
                                />
                            </div>
                        </div>
                    )}
                </section>

                {/* ========================================
                    ACTION BUTTONS
                    ======================================== */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '24px', paddingBottom: '100px' }}>
                    <button className="btn btn--primary btn--full" onClick={handleSave}>
                        {saved ? '✓ Saved!' : 'Save Settings'}
                    </button>
                    <button className="btn btn--danger btn--full" onClick={handleReset}>
                        Reset to Defaults
                    </button>
                </div>
            </div>
        </>
    );
}

export default SettingsPage;
