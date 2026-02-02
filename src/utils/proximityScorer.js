import { getSettings } from './storage.js';
import { LOCATIONS } from '../data/geolocation.js';

/**
 * Calculates proximity score based on user's location relevance.
 * Checks against hardcoded LOCATIONS and user settings.
 */
export function calculateProximityScore(title, description) {
    const settings = getSettings();

    // 1. Check if proximity scoring is enabled
    if (settings.enableProximityScoring === false) {
        return 1.0;
    }

    const text = `${title} ${description}`.toLowerCase();
    let maxBoost = 1.0;

    // 2. Check against LOCATIONS list
    for (const [locationName, data] of Object.entries(LOCATIONS)) {
        // Simple text matching
        if (text.includes(locationName.toLowerCase())) {
            if (data.boost > maxBoost) {
                maxBoost = data.boost;
            }
        }
    }

    // AI NOTE: Future enhancement - check user's specifically configured city
    // if (settings.weather?.cities?.some(city => text.includes(city))) ...

    return maxBoost;
}
