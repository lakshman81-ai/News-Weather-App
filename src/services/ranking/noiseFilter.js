/**
 * Analyzer for detecting noise, clickbait, and spam.
 */

const CLICKBAIT_PATTERNS = [
    /you won't believe/i,
    /\d+ things .*(will|that)/i,
    /doctors hate/i,
    /one weird trick/i,
    /!!+/,
    /\?\?\?+/,
    /SHOCKING/i,
    /what happens next/i,
    /mind-blowing/i,
    /jaw-dropping/i
];

const AFFILIATE_SIGNALS = [
    'best.*for',
    'top \\d+ (best|cheap)',
    'our pick',
    'editor\'s choice',
    'deal of the day'
];

/**
 * Analyzes an item for noise.
 * @param {Object} item
 * @returns {Object} { isNoise: boolean, score: number, reason: string }
 */
export function analyzeNoise(item) {
    const text = item.title; // Focus on title for clickbait

    // Check clickbait
    for (const pattern of CLICKBAIT_PATTERNS) {
        if (pattern.test(text)) {
            return {
                isNoise: true,
                score: 0.5, // 50% penalty
                reason: 'Potential Clickbait'
            };
        }
    }

    // Check affiliate (softer penalty, might be useful)
    for (const signal of AFFILIATE_SIGNALS) {
        const regex = new RegExp(signal, 'i');
        if (regex.test(text)) {
            return {
                isNoise: false, // Don't hide, just flag
                score: 0.8, // 20% penalty
                reason: 'Commercial Content'
            };
        }
    }

    return {
        isNoise: false,
        score: 1.0,
        reason: null
    };
}
