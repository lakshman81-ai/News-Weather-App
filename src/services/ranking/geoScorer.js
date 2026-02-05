/**
 * Scores an item's relevance to the user's location profile.
 *
 * @param {Object} item - The news item
 * @param {Object} geoProfile - The active GeoProfile (from geoProfiles.js)
 * @returns {number} Multiplier (0.5 to 2.0)
 */
export function calculateGeoRelevance(item, geoProfile) {
    if (!geoProfile) return 1.0;

    let score = 1.0;
    const textLower = `${item.title} ${item.description || ''}`.toLowerCase();
    const cityLower = geoProfile.city.toLowerCase();

    // 1. Explicit City Mention
    if (textLower.includes(cityLower)) {
        score += 0.5;
    }

    // 2. High Intent Keywords
    if (geoProfile.highIntentKeywords) {
        let keywordHits = 0;
        for (const keyword of geoProfile.highIntentKeywords) {
            if (textLower.includes(keyword.toLowerCase())) {
                keywordHits++;
            }
        }
        // Cap keyword boost
        score += Math.min(0.5, keywordHits * 0.15);
    }

    // 3. Local Source Boost
    if (geoProfile.localSources) {
        const itemSource = (item.source || '').toLowerCase();
        const isLocalSource = geoProfile.localSources.some(ls => itemSource.includes(ls.toLowerCase()));
        if (isLocalSource) {
            score += 0.3;
        }
    }

    // 4. "Travel Away" Penalty (False Positive Check)
    // Pattern: "[City] residents travel to [OtherCity]"
    const travelAwayPattern = new RegExp(
        `${cityLower}.*(?:travel|visit|go|fly).*to\\s+(?!${cityLower})`,
        'i'
    );
    if (travelAwayPattern.test(item.title)) {
        score -= 0.8; // Stronger penalty to offset the keyword match
    }

    // Clamp score
    return Math.max(0.5, Math.min(3.0, score));
}
