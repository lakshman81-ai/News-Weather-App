import { TEMPORAL_RULES } from './temporalRules.js';

/**
 * Calculates a temporal weight multiplier for an item based on the current time/day context.
 *
 * @param {Object} item - The news item (title, section, etc.)
 * @param {Date} [currentTime] - Optional override for "now"
 * @returns {number} Multiplier (default 1.0)
 */
export function calculateTemporalWeight(item, currentTime = new Date()) {
    const dayOfWeek = currentTime.getDay(); // 0-6 (Sun-Sat)
    const dayOfMonth = currentTime.getDate(); // 1-31
    const hour = currentTime.getHours(); // 0-23

    // Normalize section/category
    // Map item.section to keys in TEMPORAL_RULES where possible
    const section = (item.section || 'general').toLowerCase();

    let weight = 1.0;

    // 1. Check Weekend Experience (Global Boost)
    const weekendRules = TEMPORAL_RULES.weekend_experience;
    const isWeekendWindow = isWithinWindow(dayOfWeek, hour, weekendRules.active_window);

    if (isWeekendWindow && weekendRules.boost_categories.includes(section)) {
        weight *= 1.5; // Significant boost for lifestyle/entertainment on weekends
    }

    // 2. Check Morning Brief (Global Boost)
    const morningRules = TEMPORAL_RULES.morning_brief;
    if (hour >= morningRules.active_window.start_hour && hour <= morningRules.active_window.end_hour) {
        if (morningRules.boost_categories.includes(section)) {
            weight *= 1.3; // Boost hard news in the morning
        }
    }

    // 3. Category Specific Rules
    if (section === 'entertainment' || section === 'lifestyle') {
        const entRules = TEMPORAL_RULES.entertainment;
        if (entRules.high_weight_days.includes(dayOfWeek)) {
            weight *= entRules.high_weight_multiplier;
        } else {
            weight *= entRules.normal_multiplier;
        }
    }
    else if (section === 'business' || section === 'technology' || section === 'shopping') {
        // Shopping logic applies to business/tech deals too
        const shopRules = TEMPORAL_RULES.shopping;

        // Payday boost (start/end of month)
        if (shopRules.high_intensity_days.includes(dayOfMonth)) {
            weight *= shopRules.high_intensity_multiplier;
        }

        // Keyword boost
        const text = `${item.title} ${item.description || ''}`.toLowerCase();
        const hasKeyword = shopRules.keywords_boost.some(kw => text.includes(kw.toLowerCase()));
        if (hasKeyword) {
            weight *= 1.2;
        }
    }

    // 4. Recency Decay (Exponential)
    // We use a 24h half-life as per report
    // Formula: R(t) = e^(-λt) where λ = ln(2) / halfLife
    const ageHours = (currentTime.getTime() - new Date(item.publishedAt).getTime()) / (1000 * 60 * 60);
    const halfLife = 24;
    const lambda = Math.log(2) / halfLife;
    const decay = Math.exp(-lambda * ageHours);

    // Clamp decay between 0.2 and 1.0 (don't kill old news completely, just deprioritize)
    const decayFactor = Math.max(0.2, Math.min(1.0, decay));

    return weight * decayFactor;
}

/**
 * Helper to check if current time is within a day/hour window
 * Handles wrapping (e.g. Fri 2PM to Sun 11PM)
 */
function isWithinWindow(day, hour, window) {
    if (!window) return false;

    // Simple case: same day window
    if (window.start_day === undefined && window.start_hour !== undefined) {
         return hour >= window.start_hour && hour <= window.end_hour;
    }

    // Complex case: multi-day window
    // Convert everything to "hours since start of week" for easier comparison?
    // Or just simple logic for the weekend case (Fri-Sun)

    // Check start boundary
    if (day === window.start_day && hour >= window.start_hour) return true;
    // Check end boundary
    if (day === window.end_day && hour <= window.end_hour) return true;
    // Check days in between (if any) - e.g. Saturday (6) is betwen Friday (5) and Sunday (0)??
    // JS days: 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
    // Weekend range: 5 (Fri) -> 6 (Sat) -> 0 (Sun)

    if (window.start_day === 5 && window.end_day === 0) {
        if (day === 6) return true; // Saturday is always in
    }

    return false;
}
