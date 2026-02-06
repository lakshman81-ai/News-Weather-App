/**
 * Multi-Model Weather Utilities
 * Handles averaging and consensus calculations from multiple weather models
 */

// Default weights if settings not provided
const DEFAULT_WEIGHTS = { ecmwf: 0.40, gfs: 0.20, icon: 0.15, best_match: 0.25 };

/**
 * Staleness-aware weighted average.
 * If a model's data is older than freshnessLimit, reduce its weight proportionally.
 *
 * @param {Array} modelData - Array of { value, modelKey, fetchedAt }
 * @param {Object} weights - { ecmwf: 0.4, gfs: 0.2, ... }
 * @param {number} freshnessLimit - hours after which data is considered stale
 * @returns {number|null} Weighted average
 */
export function weightedAverage(modelData, weights = DEFAULT_WEIGHTS, freshnessLimit = 4) {
    const now = Date.now();
    const freshLimitMs = freshnessLimit * 60 * 60 * 1000;

    // Calculate effective weights with staleness penalty
    let totalWeight = 0;
    let weightedSum = 0;

    modelData.forEach(({ value, modelKey, fetchedAt }) => {
        if (value == null) return;

        // If modelKey is missing (e.g. legacy data), default to equal low weight or look up
        // But we expect modelKey to be present from weatherService
        const baseWeight = weights[modelKey] || 0.1;
        let effectiveWeight = baseWeight;

        // Staleness penalty: if data is older than freshness limit,
        // reduce weight proportionally
        if (fetchedAt) {
            const ageMs = now - fetchedAt;
            if (ageMs > freshLimitMs) {
                // Linear decay: at 2x freshLimit, weight is 10% of base
                // floor at 0.1 * baseWeight to avoid 0 completely if we want to keep some influence
                const staleFactor = Math.max(0.1, 1 - (ageMs - freshLimitMs) / freshLimitMs);
                effectiveWeight = baseWeight * staleFactor;
                // Optional: log or track staleness if needed, but keep this pure
            }
        }

        weightedSum += value * effectiveWeight;
        totalWeight += effectiveWeight;
    });

    if (totalWeight === 0) return null;
    return weightedSum / totalWeight;
}

/**
 * Calculate rainfall consensus from multiple models
 * @param {Array} modelData - Array of model precipitation probability data
 * @returns {Object|null} Consensus object with avg, min, max, range, etc.
 */
export function calculateRainfallConsensus(modelData) {
    const validProbs = modelData.filter(m => m?.precipitation_probability != null);

    if (validProbs.length === 0) return null;

    const values = validProbs.map(m => m.precipitation_probability);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min;
    const isWideRange = range > 30;

    return {
        avg,
        min,
        max,
        range,
        isWideRange,
        displayString: `${isWideRange ? '!' : '~'}${avg}% (${min}-${max}%)`,
        symbol: isWideRange ? '!' : '~',
        models: validProbs.length
    };
}

/**
 * Average temperature from multiple models (Weighted)
 * @param {Array} modelData - Array of objects containing temperature_2m, modelKey, fetchedAt
 * @param {Object} weights
 * @param {number} freshnessLimit
 * @returns {number|null} Averaged temperature
 */
export function averageTemperature(modelData, weights, freshnessLimit) {
    const entries = modelData
        .filter(m => m?.temperature_2m != null)
        .map(m => ({
            value: m.temperature_2m,
            modelKey: m.modelKey,
            fetchedAt: m.fetchedAt
        }));

    // If no modelKey present (legacy/simple array), fallback to simple average
    if (entries.length > 0 && !entries[0].modelKey) {
        const values = entries.map(e => e.value);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    const avg = weightedAverage(entries, weights, freshnessLimit);
    return avg != null ? Math.round(avg) : null;
}

/**
 * Average apparent temperature (feels like) from multiple models (Weighted)
 * @param {Array} modelData - Array of objects containing apparent_temperature, modelKey, fetchedAt
 * @param {Object} weights
 * @param {number} freshnessLimit
 * @returns {number|null} Averaged apparent temperature
 */
export function averageApparentTemperature(modelData, weights, freshnessLimit) {
    const entries = modelData
        .filter(m => m?.apparent_temperature != null)
        .map(m => ({
            value: m.apparent_temperature,
            modelKey: m.modelKey,
            fetchedAt: m.fetchedAt
        }));

    // Fallback for legacy data
    if (entries.length > 0 && !entries[0].modelKey) {
        const values = entries.map(e => e.value);
        return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
    }

    const avg = weightedAverage(entries, weights, freshnessLimit);
    return avg != null ? Math.round(avg) : null;
}

/**
 * Get most common weather code from models
 * @param {Array} modelData - Array of model weather code data
 * @returns {number|null} Most common weather code
 */
export function getMostCommonWeatherCode(modelData) {
    const validCodes = modelData.filter(m => m?.weather_code != null);

    if (validCodes.length === 0) return null;

    const codes = validCodes.map(m => m.weather_code);

    // Count occurrences
    const counts = {};
    codes.forEach(code => {
        counts[code] = (counts[code] || 0) + 1;
    });

    // Find most common
    let maxCount = 0;
    let mostCommon = codes[0];

    for (const [code, count] of Object.entries(counts)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommon = parseInt(code);
        }
    }

    return mostCommon;
}

/**
 * For precipitation: use maximum across models (conservative approach).
 * When models disagree widely (range > 50% relative to max), add warning.
 * @param {Array} modelData - Array of { precipitation, modelKey } or objects with precipitation property
 * @returns {Object} { value: number, warning: boolean, range: number }
 */
export function maxPrecipitation(modelData) {
    const values = modelData
        .map(m => (m.precipitation != null ? m.precipitation : m.value)) // Handle both raw objects and {value, modelKey}
        .filter(v => v != null);

    if (values.length === 0) return { value: 0, warning: false, range: 0 };

    const max = Math.max(...values);
    const min = Math.min(...values);

    // Calculate range percentage relative to max
    // If max is 0, range is 0.
    const rangePercent = max > 0 ? ((max - min) / max) * 100 : 0;

    return {
        value: max,
        warning: rangePercent > 50, // Models disagree significantly
        range: Math.round(rangePercent)
    };
}

/**
 * Average precipitation amount from multiple models
 * @deprecated Use maxPrecipitation instead for conservative estimates
 * @param {Array} modelData - Array of model precipitation data
 * @returns {number} Averaged precipitation in mm
 */
export function averagePrecipitation(modelData) {
    const validPrecip = modelData.filter(m => m?.precipitation != null);

    if (validPrecip.length === 0) return 0;

    const values = validPrecip.map(m => m.precipitation);
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
}

/**
 * Get model names from successful fetches
 * @param {Object} modelResults - Object with model names as keys
 * @returns {Array} Array of successful model names
 */
export function getSuccessfulModels(modelResults) {
    return Object.entries(modelResults)
        .filter(([_, data]) => data !== null)
        .map(([name, _]) => name);
}

/**
 * Format model names for display
 * @param {Array} modelNames - Array of model names
 * @returns {string} Formatted string
 */
export function formatModelNames(modelNames) {
    const displayNames = {
        'ecmwf': 'ECMWF',
        'gfs': 'GFS',
        'icon': 'ICON',
        'best_match': 'Best Match'
    };

    return modelNames.map(name => displayNames[name] || name).join(', ');
}
