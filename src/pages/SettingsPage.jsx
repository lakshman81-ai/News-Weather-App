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
        { key: 'world', icon: '🌐', label: 'World News', min: 5, max: 15 },
        { key: 'india', icon: '🇮🇳', label: 'India News', min: 5, max: 15 },
        { key: 'chennai', icon: '🏛️', label: 'Chennai', min: 2, max: 5 },
        { key: 'trichy', icon: '🏛️', label: 'Trichy', min: 1, max: 3 },
        { key: 'local', icon: '📍', label: 'Muscat', min: 2, max: 5 },
        { key: 'social', icon: '👥', label: 'Social', min: 5, max: 15 },
        { key: 'entertainment', icon: '🎬', label: 'Entertainment', min: 3, max: 10 },
        { key: 'business', icon: '💼', label: 'Business', min: 3, max: 10 },
        { key: 'technology', icon: '💻', label: 'Technology', min: 3, max: 10 }
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
        { key: 'variety', label: 'Variety' },
        { key: 'hollywoodReporter', label: 'THR' },
        { key: 'bollywoodHungama', label: 'Bollywood Hungama' },
        { key: 'filmCompanion', label: 'Film Companion' }
    ];

    // Calculate total social distribution percentage
    const socialTotal = (settings.socialTrends?.worldPercent || 0) +
        (settings.socialTrends?.indiaPercent || 0) +
        (settings.socialTrends?.tamilnaduPercent || 0) +
        (settings.socialTrends?.muscatPercent || 0);

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
                                    {settings.uiMode === 'timeline' ? 'Timeline Navigator' : 'Classic Dashboard'}
                                </small>
                            </div>
                            <Toggle
                                checked={settings.uiMode === 'timeline'}
                                onChange={(val) => updateSettings({ ...settings, uiMode: val ? 'timeline' : 'classic' })}
                            />
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION 2: DATA FRESHNESS
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🛡️</span> Data Freshness
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item">
                            <span className="settings-item__label">Strict Mode (hide stale data)</span>
                            <Toggle
                                checked={settings.strictFreshness}
                                onChange={(val) => updateSettings({ ...settings, strictFreshness: val })}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">News Max Age (hours)</span>
                            <input
                                type="number"
                                className="settings-item__count"
                                min={1}
                                max={72}
                                value={settings.freshnessLimitHours || 36}
                                onChange={(e) => updateSettings({ ...settings, freshnessLimitHours: parseInt(e.target.value) || 36 })}
                            />
                        </div>
                        <div className="settings-item">
                            <span className="settings-item__label">Weather Max Age (hours)</span>
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
                        {sectionConfig.map(({ key, icon, label, min, max }) => (
                            <div key={key} className="settings-item">
                                <div className="settings-item__label">
                                    <span>{icon}</span> {label}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="number"
                                        className="settings-item__count"
                                        min={min}
                                        max={max}
                                        value={settings.sections?.[key]?.count || min}
                                        onChange={(e) => {
                                            const val = Math.min(max, Math.max(min, parseInt(e.target.value) || min));
                                            updateNested(`sections.${key}.count`, val);
                                        }}
                                    />
                                    <Toggle
                                        checked={settings.sections?.[key]?.enabled !== false}
                                        onChange={(val) => updateNested(`sections.${key}.enabled`, val)}
                                    />
                                </div>
                            </div>
                        ))}
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
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border-default)' }}>
                            {newsSourceConfig.map(({ key, label }) => (
                                <div key={key} className="settings-item" style={{ background: 'var(--bg-card)', margin: 0, borderRadius: 0 }}>
                                    <span className="settings-item__label" style={{ fontSize: '0.85rem' }}>{label}</span>
                                    <Toggle
                                        checked={settings.newsSources?.[key] !== false}
                                        onChange={(val) => updateNested(`newsSources.${key}`, val)}
                                    />
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
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 12px' }}>
                            Adjust the percentage distribution of social trends by region. Should total 100%.
                        </div>
                        {[
                            { key: 'worldPercent', label: '🌍 World' },
                            { key: 'indiaPercent', label: '🇮🇳 India' },
                            { key: 'tamilnaduPercent', label: '🏛️ Tamil Nadu' },
                            { key: 'muscatPercent', label: '🏝️ Muscat' }
                        ].map(({ key, label }) => (
                            <div key={key} className="settings-item">
                                <span className="settings-item__label">{label}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={settings.socialTrends?.[key] || 25}
                                        onChange={(e) => updateNested(`socialTrends.${key}`, parseInt(e.target.value))}
                                        style={{ width: '80px' }}
                                    />
                                    <span style={{ width: '40px', textAlign: 'right', fontSize: '0.9rem' }}>
                                        {settings.socialTrends?.[key] || 25}%
                                    </span>
                                </div>
                            </div>
                        ))}
                        <div style={{
                            fontSize: '0.75rem',
                            padding: '8px 12px',
                            color: socialTotal !== 100 ? 'var(--accent-danger)' : 'var(--accent-success)'
                        }}>
                            Total: {socialTotal}% {socialTotal !== 100 && '(should be 100%)'}
                        </div>
                    </div>
                </section>

                {/* ========================================
                    SECTION 8: CUSTOM FEEDS
                    ======================================== */}
                <section className="settings-section">
                    <h2 className="settings-section__title">
                        <span>🔗</span> Custom Feeds
                    </h2>
                    <div className="settings-card">
                        <div className="settings-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '8px' }}>
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
                        </div>
                        {settings.customFeeds?.map((feed, i) => (
                            <div key={i} className="settings-item">
                                <span className="settings-item__label" style={{ fontSize: '0.85rem' }}>
                                    {feed.title || feed.url}
                                </span>
                                <button
                                    className="btn btn--danger"
                                    style={{ padding: '4px 12px', fontSize: '0.75rem' }}
                                    onClick={() => removeCustomFeed(i)}
                                >
                                    Remove
                                </button>
                            </div>
                        ))}
                        {(!settings.customFeeds || settings.customFeeds.length === 0) && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px 12px' }}>
                                No custom feeds added yet
                            </div>
                        )}
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
