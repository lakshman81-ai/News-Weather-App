// LocalStorage Cache for AI Evaluations

const STORAGE_KEY = 'dailyEventAI_aiCache';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 Hours

/**
 * Generates a hash for the content
 */
function createContentHash(item) {
    // Simple hash based on title and source
    // We assume title doesn't change for the same story
    let str = `${item.source}:${item.title}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
}

/**
 * Get cached evaluation
 */
export function getCachedEvaluation(item) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;

        const cache = JSON.parse(raw);
        const hash = createContentHash(item);
        const entry = cache[hash];

        if (!entry) return null;

        // Check expiry
        if (Date.now() > entry.expiresAt) {
            delete cache[hash];
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
            return null;
        }

        return entry.data;
    } catch (e) {
        console.error('AI Cache Read Error', e);
        return null;
    }
}

/**
 * Set cached evaluation
 */
export function setCachedEvaluation(item, evaluation) {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        const cache = raw ? JSON.parse(raw) : {};

        const hash = createContentHash(item);

        // Prune old entries if cache gets too big (> 500 items)
        const keys = Object.keys(cache);
        if (keys.length > 500) {
            // Simple prune: remove first 100 keys (approx LRU if insertion order preserved)
             for (let i = 0; i < 100; i++) delete cache[keys[i]];
        }

        cache[hash] = {
            data: evaluation,
            expiresAt: Date.now() + CACHE_TTL_MS
        };

        localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
    } catch (e) {
        console.error('AI Cache Write Error', e);
    }
}

/**
 * Clear cache
 */
export function clearAICache() {
    localStorage.removeItem(STORAGE_KEY);
}
