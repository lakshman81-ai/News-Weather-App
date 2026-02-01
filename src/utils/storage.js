// Local Storage utility for settings persistence

const STORAGE_KEYS = {
    SETTINGS: 'dailyEventAI_settings',
    LAST_REFRESH: 'dailyEventAI_lastRefresh',
    CACHED_DATA: 'dailyEventAI_cachedData'
};

// Default settings - REDESIGNED SCHEMA
export const DEFAULT_SETTINGS = {
    // ========================================
    // INTERFACE
    // ========================================
    uiMode: 'timeline',  // 'timeline' | 'classic'
    fontSize: 26,        // Default base font size (User requested +6 from 20)

    // ========================================
    // DATA FRESHNESS
    // ========================================
    freshnessLimitHours: 36,
    weatherFreshnessLimit: 4,
    strictFreshness: true,

    // ========================================
    // WEATHER CONFIGURATION
    // ========================================
    weather: {
        models: {
            ecmwf: true,   // European Centre (most accurate)
            gfs: true,     // NOAA GFS (good precipitation)
            icon: true     // DWD ICON (excellent coverage)
        },
        cities: ['chennai', 'trichy', 'muscat'],
        showHumidity: true,
        showWind: false,
    },

    // ========================================
    // NEWS SECTIONS
    // ========================================
    sections: {
        world: { enabled: true, count: 5 },
        india: { enabled: true, count: 5 },
        chennai: { enabled: true, count: 5 },
        trichy: { enabled: true, count: 5 },
        local: { enabled: true, count: 5 },
        social: { enabled: true, count: 25 }, // User requested default 25
        entertainment: { enabled: true, count: 5 },
        business: { enabled: true, count: 5 },
        technology: { enabled: true, count: 5 }
    },

    // ========================================
    // NEWS SOURCES
    // ========================================
    newsSources: {
        bbc: true,
        reuters: true,
        ndtv: true,
        theHindu: true,
        toi: true,
        financialExpress: true,
        dtNext: true,
        omanObserver: true,
        moneyControl: true,
        variety: true,
        hollywoodReporter: true,
        bollywoodHungama: true,
        filmCompanion: true,
        indiaToday: true,
        timesOfOman: true
    },

    // ========================================
    // MARKET SETTINGS
    // ========================================
    market: {
        showIndices: true,
        showGainers: true,
        showLosers: true,
        showMutualFunds: true,
        showIPO: true,
        cacheMinutes: 15,
    },

    // ========================================
    // SOCIAL TRENDS DISTRIBUTION
    // ========================================
    socialTrends: {
        worldPercent: 30,
        indiaPercent: 30,
        tamilnaduPercent: 20,
        muscatPercent: 20,
    },

    // ========================================
    // CUSTOM FEEDS
    // ========================================
    customFeeds: [],

    // ========================================
    // ADVANCED
    // ========================================
    crawlerMode: 'auto',
    debugLogs: false,
};

/**
 * Get settings from localStorage
 * @returns {Object} Settings object
 */
export function getSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        if (stored) {
            const parsed = JSON.parse(stored);
            // Merge with defaults to ensure all keys exist
            return deepMerge(DEFAULT_SETTINGS, parsed);
        }
    } catch (error) {
        void error;
        console.error('Error reading settings:', error);
    }
    return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to localStorage
 * @param {Object} settings - Settings object to save
 */
export function saveSettings(settings) {
    try {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
        return true;
    } catch (error) {
        void error;
        console.error('Error saving settings:', error);
        return false;
    }
}

/**
 * Update specific setting
 * @param {string} path - Dot-notation path to setting (e.g., 'sections.world.count')
 * @param {any} value - Value to set
 */
export function updateSetting(path, value) {
    const settings = getSettings();
    const keys = path.split('.');
    let obj = settings;

    for (let i = 0; i < keys.length - 1; i++) {
        if (!obj[keys[i]]) obj[keys[i]] = {};
        obj = obj[keys[i]];
    }

    obj[keys[keys.length - 1]] = value;
    return saveSettings(settings);
}

/**
 * Reset settings to defaults
 */
export function resetSettings() {
    return saveSettings(DEFAULT_SETTINGS);
}

/**
 * Get last refresh timestamp for a section
 * @param {string} section - Section name
 * @returns {Date|null} Last refresh date or null
 */
export function getLastRefresh(section) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LAST_REFRESH);
        if (stored) {
            const timestamps = JSON.parse(stored);
            if (timestamps[section]) {
                return new Date(timestamps[section]);
            }
        }
    } catch (error) {
        void error;
        console.error('Error reading last refresh:', error);
    }
    return null;
}

/**
 * Set last refresh timestamp for a section
 * @param {string} section - Section name
 */
export function setLastRefresh(section) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LAST_REFRESH);
        const timestamps = stored ? JSON.parse(stored) : {};
        timestamps[section] = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.LAST_REFRESH, JSON.stringify(timestamps));
    } catch (error) {
        void error;
        console.error('Error setting last refresh:', error);
    }
}

/**
 * Get time since last refresh as human-readable string
 * @param {string} section - Section name (optional, for specific section)
 * @returns {string} Human-readable time string
 */
export function getTimeSinceRefresh(section = null) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.LAST_REFRESH);
        if (!stored) return 'Never';

        const timestamps = JSON.parse(stored);
        let lastTime = null;

        if (section && timestamps[section]) {
            lastTime = new Date(timestamps[section]);
        } else {
            // Get most recent refresh across all sections
            const times = Object.values(timestamps).map(t => new Date(t).getTime());
            if (times.length > 0) {
                lastTime = new Date(Math.max(...times));
            }
        }

        if (!lastTime) return 'Never';

        const now = new Date();
        const diffMs = now - lastTime;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return lastTime.toLocaleDateString();
    } catch (error) {
        void error;
        return 'Unknown';
    }
}

/**
 * Cache data for a section
 * @param {string} section - Section name
 * @param {any} data - Data to cache
 */
export function cacheData(section, data) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
        const cache = stored ? JSON.parse(stored) : {};
        cache[section] = {
            data,
            timestamp: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEYS.CACHED_DATA, JSON.stringify(cache));
    } catch (error) {
        void error;
        console.error('Error caching data:', error);
    }
}

/**
 * Get cached data for a section
 * @param {string} section - Section name
 * @param {number} maxAgeMs - Maximum age in milliseconds (default: 30 minutes)
 * @returns {any|null} Cached data or null if expired/missing
 */
export function getCachedData(section, maxAgeMs = 30 * 60 * 1000) {
    try {
        const stored = localStorage.getItem(STORAGE_KEYS.CACHED_DATA);
        if (!stored) return null;

        const cache = JSON.parse(stored);
        if (!cache[section]) return null;

        const age = new Date() - new Date(cache[section].timestamp);
        if (age > maxAgeMs) return null;

        return cache[section].data;
    } catch (error) {
        void error;
        console.error('Error reading cache:', error);
        return null;
    }
}

/**
 * Clear all cached data
 */
export function clearCache() {
    try {
        localStorage.removeItem(STORAGE_KEYS.CACHED_DATA);
        localStorage.removeItem(STORAGE_KEYS.LAST_REFRESH);
    } catch (error) {
        void error;
        console.error('Error clearing cache:', error);
    }
}

/**
 * Deep merge two objects
 */
function deepMerge(target, source) {
    const result = { ...target };

    for (const key in source) {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            result[key] = deepMerge(target[key] || {}, source[key]);
        } else {
            result[key] = source[key];
        }
    }

    return result;
}
