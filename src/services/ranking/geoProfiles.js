// Configuration for Geo-Aware Ranking

export const KNOWN_LOCATIONS = {
    chennai: {
        name: 'Chennai',
        city: 'Chennai',
        countryCode: 'IN',
        languageCode: 'en-IN',
        highIntentKeywords: [
            'chennai', 'madras', 'tamil nadu', 'tn govt', 'stalin',
            'metro', 'marina', 'beach', 'traffic', 'weather', 'rain',
            'corporation', 'gcc', 'police'
        ],
        localSources: ['The Hindu', 'DT Next', 'Times of India', 'Daily Thanthi']
    },
    trichy: {
        name: 'Trichy',
        city: 'Tiruchirappalli',
        countryCode: 'IN',
        languageCode: 'en-IN',
        highIntentKeywords: [
            'trichy', 'tiruchirappalli', 'kavery', 'cauvery', 'airport',
            'srirangam', 'rockfort', 'bhel', 'nit', 'collector'
        ],
        localSources: ['The Hindu', 'Dinamalar']
    },
    muscat: {
        name: 'Muscat',
        city: 'Muscat',
        countryCode: 'OM',
        languageCode: 'en-OM',
        highIntentKeywords: [
            'muscat', 'oman', 'sultan', 'haitham', 'royal oman police', 'rop',
            'civil aviation', 'cpa', 'ministry', 'ruwi', 'seeb', 'muttrah'
        ],
        localSources: ['Oman Observer', 'Muscat Daily', 'Times of Oman']
    },
    india: {
        name: 'India',
        city: 'India', // Generalized
        countryCode: 'IN',
        languageCode: 'en-IN',
        highIntentKeywords: [
            'india', 'delhi', 'mumbai', 'bangalore', 'hyderabad', 'modi',
            'parliament', 'supreme court', 'rbi', 'cricket', 'isro'
        ],
        localSources: ['NDTV', 'Indian Express', 'Hindustan Times']
    }
};

/**
 * Helper to get the active profile based on settings
 * @param {Object} settings - The application settings object
 * @returns {Object} The GeoProfile to use
 */
export function getActiveGeoProfile(settings) {
    // Priority 1: Custom Location from Up Ahead (if mapped)
    // Priority 2: First enabled city in Weather
    // Priority 3: Default to Chennai

    // For now, we simple-map to the first enabled weather city
    // In a real scenario, we might want to geolocate the IP

    if (settings?.weather?.cities) {
        if (settings.weather.cities.includes('muscat')) return KNOWN_LOCATIONS.muscat;
        if (settings.weather.cities.includes('trichy')) return KNOWN_LOCATIONS.trichy;
        if (settings.weather.cities.includes('chennai')) return KNOWN_LOCATIONS.chennai;
    }

    return KNOWN_LOCATIONS.chennai;
}
