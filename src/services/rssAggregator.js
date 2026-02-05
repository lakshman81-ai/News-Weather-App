/**
 * Centralized RSS aggregation & ranking service.
 * Designed for section-wise fetching and high-impact news extraction.
 */

import { GOOGLE_FEEDS } from './googleNewsService';
import { getSettings } from '../utils/storage';
import { fetchAllEntertainment } from './entertainmentService';
import { analyzeArticleSentiment } from '../utils/sentimentAnalyzer';
import { deduplicateAndCluster } from '../utils/similarity';
import { breakingDetector } from '../utils/breakingNewsDetector';
import { calculateSourceScore, getSourceWeightForCategory, SOURCE_METRICS } from '../data/sourceMetrics';
import { calculateImpactScore } from '../utils/impactScorer.js';
import { calculateProximityScore } from '../utils/proximityScorer.js';
import { calculateNoveltyScore } from '../utils/noveltyScorer.js';
import { calculateCurrencyScore } from '../utils/currencyScorer.js';
import { calculateHumanInterestScore } from '../utils/humanInterestScorer.js';
import { calculateVisualScore } from '../utils/visualScorer.js';
import { classifySection } from '../utils/sectionClassifier.js';
import { proxyManager } from './proxyManager.js';

// Phase 2-4: Ranking Modules
import { calculateTemporalWeight } from './ranking/temporalScorer.js';
import { calculateGeoRelevance } from './ranking/geoScorer.js';
import { analyzeNoise } from './ranking/noiseFilter.js';
import { evaluateWithAI } from './ranking/aiEvaluator.js';
import { getActiveGeoProfile } from './ranking/geoProfiles.js';

/**
 * @typedef {Object} NewsItem
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {string} link
 * @property {string} source
 * @property {number} publishedAt
 * @property {string} section
 * @property {number} impactScore
 * @property {string} time - Formatted time string
 */

const SECTION_FEEDS = {
    world: [
        GOOGLE_FEEDS.WORLD_IN, // Google News (IN Edition)
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://www.aljazeera.com/xml/rss/all.xml",
        GOOGLE_FEEDS.WORLD_US // Google News (US Edition for backup/variety)
    ],
    india: [
        GOOGLE_FEEDS.TAMIL_NADU, // Special Tamil focus via Google
        "https://feeds.feedburner.com/ndtvnews-top-stories",
        "https://www.thehindu.com/news/national/feeder/default.rss",
        "https://timesofindia.indiatimes.com/rssfeedstopstories.cms"
    ],
    chennai: [
        GOOGLE_FEEDS.CHENNAI,
        "https://www.thehindu.com/news/cities/chennai/feeder/default.rss"
    ],
    trichy: [
        "https://www.thehindu.com/news/cities/Tiruchirapalli/feeder/default.rss"
    ],
    local: [
        "https://news.google.com/rss/search?q=Muscat+Oman&hl=en-OM&gl=OM&ceid=OM:en",
        "https://www.muscatdaily.com/feed" // Backup (often > 48h old)
    ],
    business: [
        // "https://news.google.com/rss/search?q=Business+Economy+India&hl=en-IN&gl=IN&ceid=IN:en", // Working Replacement
        GOOGLE_FEEDS.BUSINESS_IN_SEARCH, // Switched to search-based
        "https://economictimes.indiatimes.com/rssfeedstopstories.cms",
        "https://www.moneycontrol.com/rss/business.xml",
        "https://www.livemint.com/rss/money",
        "https://feeds.bbci.co.uk/news/business/rss.xml", // Keeps BBC as global backup
        "https://www.cnbc.com/id/10001147/device/rss/rss.html"
    ],
    technology: [
        // "https://news.google.com/rss/search?q=Technology+Startups+India&hl=en-IN&gl=IN&ceid=IN:en", // Working Replacement
        GOOGLE_FEEDS.TECH_IN_SEARCH, // Switched to search-based
        "https://gadgets360.com/rss/news",
        "https://techcrunch.com/feed/",
        "https://www.theverge.com/rss/index.xml"
    ],
    sports: [
        "https://www.espn.com/espn/rss/news"
    ],
    entertainment: [
        "https://www.bollywoodhungama.com/rss/news.xml",
        "https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml"
    ],
    social: [
        "https://www.theverge.com/rss/index.xml" // Proxy for trends
    ]
};

const SETTINGS_MAPPING = {
    bbc: "BBC",
    ndtv: "NDTV",
    theHindu: "The Hindu",
    toi: "Times of India",
    financialExpress: "Financial Express",
    dtNext: "DT Next",
    omanObserver: "Oman Observer",
    moneyControl: "Moneycontrol",
    indiaToday: "India Today",
    variety: "Variety",
    hollywoodReporter: "Hollywood Reporter",
    bollywoodHungama: "Bollywood Hungama",
    alJazeera: "Al Jazeera"
};

const KEYWORDS = [
    "breaking",
    "election",
    "war",
    "crisis",
    "ai",
    "market",
    "inflation",
    "conflict",
    "gold",
    "storm",
    "rain"
];

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const memoryCache = new Map();

/* ---------- Utility Functions (Moved to Top) ---------- */

/**
 * Checks if text contains high-impact keywords
 */
function checkKeywords(title, description) {
    if (!title || !description) return false;

    const text = (title + " " + description).toLowerCase();

    return KEYWORDS.some(keyword => {
        if (!keyword) return false;
        return text.includes(keyword.toLowerCase());
    });
}

/**
 * Cleans HTML tags from description
 */
function cleanDescription(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, "")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
}

/**
 * Simple string hash for ID generation
 */
function hash(value) {
    let h = 0;
    if (!value) return "0";
    for (let i = 0; i < value.length; i++) {
        h = (h << 5) - h + value.charCodeAt(i);
        h |= 0;
    }
    return h.toString();
}

/**
 * Cleans source name
 */
function cleanSource(sourceName) {
    if (!sourceName) return "Unknown";

    // Fix for Google News Search feeds where title is "Query - Google News"
    if (sourceName.includes(" - Google News")) {
        return "Google News";
    }

    // Search for known keys in the source name
    const foundKey = Object.keys(SOURCE_METRICS).find(key =>
        key !== 'default' && sourceName.toLowerCase().includes(key.toLowerCase())
    );
    return foundKey ? SOURCE_METRICS[foundKey].name : sourceName;
}

/**
 * Generates a "Critic's One Liner" heuristic from title/description
 */
/**
 * Generates a "Critic's One Liner" heuristic from title/description
 */
function generateCriticsOneLiner(title, description, source) {
    const text = (title + " " + description).toLowerCase();

    // 1. Sector-Specific Insights
    if (/\bsensex\b|\bnifty\b|\bmarket\b/i.test(text)) {
        if (/\brecord high\b|\bsurge\b|\bjump\b/i.test(text)) {
            return `Bullish sentiment prevails as key indices hit significant milestones; analysts watch for profit booking.`;
        }
        if (/\bslump\b|\bcrash\b|\bdrop\b/i.test(text)) {
            return `Market volatility spikes amid global cues; institutional investors remain cautious.`;
        }
        return `Financial observers highlight the underlying strength despite mixed global signals in the equity space.`;
    }

    if (/\belection\b|\bpoll\b|\bvote\b/i.test(text)) {
        return `Political strategists emphasize the shifting dynamic as latest polling data suggests a tightening race.`;
    }

    // Strict regex for AI to avoid matching 'air', 'said', etc.
    if (/\b(ai|artificial intelligence)\b/i.test(text) || /\btech\b/i.test(text)) {
        return `Industry experts view this as a pivotal move in the ongoing race for AI supremacy and infrastructure.`;
    }

    if (/\binflation\b|\brbi\b|\binterest rate\b/i.test(text)) {
        return `Monetary policy experts weigh the impact of fiscal pressures on long-term consumer spending patterns.`;
    }

    // 2. Structural Extractions
    // If description has a clear quote, use it
    const quoteMatch = description.match(/"([^"]{20,100})"/);
    if (quoteMatch) return `"${quoteMatch[1]}"`;

    // 3. Narrative Heuristics
    if (title.includes('?')) {
        return `This development raises critical questions about the future trajectory of the sector.`;
    }

    // 4. No generic fallback - return null to hide component
    return null;
}

export function computeImpactScore(item, section) {
    // 1. Freshness Decay (Linear)
    // 24 hours = 0 score. 0 hours = 1 score.
    const ageInHours = (Date.now() - item.publishedAt) / (1000 * 60 * 60);
    const freshness = Math.max(0, (26 - ageInHours) / 26) * 3; // Boost freshness importance

    // 2. Source Weight and Category Relevance (NEW)
    const sourceScore = calculateSourceScore(item.source);
    const categoryWeight = getSourceWeightForCategory(item.source, section);
    // Combined source component, scaled up
    const sourceComponent = sourceScore * categoryWeight * 5;

    // 3. Keyword Context Boost
    const keywordBoost = checkKeywords(item.title, item.description) ? 2 : 0;

    // 4. Section Priority
    const sectionPriority = section === "world" ? 1.5 : section === "business" ? 1.2 : 1;

    // 5. Sentiment Boost
    let sentimentBoost = 0;
    if (item.sentiment) {
        if (item.sentiment.label === 'positive') sentimentBoost = 0.5;
        else if (item.sentiment.label === 'negative') sentimentBoost = 0.3;
    }

    // Breaking News Detection (Phase 5)
    const breakingResult = breakingDetector.checkBreakingNews(item);
    item.isBreaking = breakingResult.isBreaking;
    item.breakingScore = breakingResult.breakingScore;
    const breakingBoost = breakingResult.multiplier;

    // --- NEW SCORING LOGIC CHECK ---
    const settings = getSettings();
    if (settings.enableNewScoring === false) {
        // ORIGINAL SCORING (Status Quo)
        return (freshness + sourceComponent + keywordBoost + sentimentBoost) * sectionPriority * breakingBoost;
    }

    // --- NEW SCORING LOGIC (9-Factor) ---
    // Calculate new multipliers
    const impactMultiplier = calculateImpactScore(item.title, item.description);
    const proximityMultiplier = calculateProximityScore(item.title, item.description);
    const noveltyMultiplier = calculateNoveltyScore(item.title, item.description, section);
    // Note: passing null for keywords array as it's not currently extracted in normalizeItem
    const currencyMultiplier = calculateCurrencyScore(item.title, null);
    const humanInterestMultiplier = calculateHumanInterestScore(item.title, item.description);
    const visualMultiplier = calculateVisualScore(item.imageUrl);

    // Base Score (Sum of additive components)
    const baseScore = freshness + sourceComponent + keywordBoost + sentimentBoost;

    // Multipliers (Product of multiplicative components)
    const multipliers = impactMultiplier * proximityMultiplier * noveltyMultiplier *
        currencyMultiplier * humanInterestMultiplier * visualMultiplier;

    // Final Calculation with multipliers
    const total = baseScore * multipliers * sectionPriority * breakingBoost;

    return total;
}

function isSourceAllowed(sourceName, allowedSources) {
    // If allowedSources is passed, we check if the source is enabled.
    let matchedKey = null;

    // Check mapping
    for (const [key, name] of Object.entries(SETTINGS_MAPPING)) {
        if (sourceName.includes(name) || name.includes(sourceName)) {
            matchedKey = key;
            break;
        }
    }

    if (matchedKey) {
        return allowedSources[matchedKey] !== false;
    }
    return true;
}

/* ---------- Public API ---------- */

/**
 * Fetches news for a given section.
 */
export async function fetchSectionNews(section, limit = 10, allowedSources = null) {
    // Optimization: If limit is 0, don't fetch anything
    if (limit === 0) return [];

    const cacheKey = section;
    let items = [];

    // Check if cache is enabled in settings (Phase 6)
    const settings = getSettings();
    const cacheEnabled = settings.enableCache !== false; // Default to true

    // Check cache first if enabled
    if (cacheEnabled) {
        const cached = memoryCache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < CACHE_TTL_MS) {
            const ageSeconds = Math.round((Date.now() - cached.timestamp) / 1000);
            console.log(`[RSS] ✅ Cache HIT for ${section} (age: ${ageSeconds}s)`);
            return rankAndFilter(cached.data, section, limit, allowedSources);
        }
        console.log(`[RSS] ⚠️ Cache MISS for ${section} - Fetching fresh data`);
    } else {
        console.log(`[RSS] ℹ️ Cache DISABLED by user settings for ${section}`);
    }

    // Special handling for entertainment section
    if (section === 'entertainment') {
        console.log('[RSS] Using entertainmentService for entertainment section');
        try {
            const settings = getSettings();
            const entertainmentSettings = settings?.entertainment || {};
            const articles = await fetchAllEntertainment(entertainmentSettings);
            console.log(`[RSS] Entertainment: Got ${articles.length} articles with distribution`);
            return articles.slice(0, limit);
        } catch (error) {
            console.error('[RSS] Entertainment service failed:', error);
            // Fallback to regular RSS feeds
        }
    }

    const feeds = SECTION_FEEDS[section] || [];

    if (feeds.length === 0) {
        console.warn(`[RSS] No feeds defined for section: ${section}`);
        return [];
    }

    try {
        console.log(`[RSS] Feeds for ${section}:`, feeds);

        // Track failures per feed
        const results = await Promise.allSettled(
            feeds.map(url => fetchAndParseFeed(url, section))
        );

        const successfulResults = [];
        const failedFeeds = [];

        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successfulResults.push(result.value);
                console.log(`[RSS] ✅ Feed ${index + 1}/${feeds.length} succeeded`);
            } else {
                failedFeeds.push({
                    url: feeds[index],
                    reason: result.reason?.message || 'Unknown error'
                });
                console.warn(`[RSS] ⚠️ Feed ${index + 1}/${feeds.length} failed:`, result.reason);
            }
        });

        items = successfulResults.flat();

        console.log(`[RSS] Section '${section}' stats:`, {
            totalFeeds: feeds.length,
            successCount: successfulResults.length,
            failureCount: failedFeeds.length,
            totalItems: items.length
        });

        // Only cache if enabled (Phase 6)
        const settings = getSettings();
        if (settings.enableCache !== false) {
            memoryCache.set(cacheKey, {
                timestamp: Date.now(),
                data: items
            });
            console.log(`[RSS] 💾 Cached ${items.length} items for ${section}`);
        }


    } catch (error) {
        console.error(`[RSS] Unexpected error fetching section ${section}:`, {
            errorMessage: error.message,
            errorStack: error.stack,
            section
        });

        // Return partial results if some succeeded
        if (items.length > 0) return items;
        return [];
    }

    // Always apply filtering/ranking
    try {
        return rankAndFilter(items, section, limit, allowedSources);
    } catch (error) {
        console.error(`[RSS] Ranking failed for ${section}:`, error);
        // Fallback: return unsorted items rather than crashing
        return items.slice(0, limit);
    }
}

/* ---------- Core Logic ---------- */

export async function fetchAndParseFeed(feedUrl, section) {
    // Delegate to ProxyManager for rotation and failover
    // ProxyManager returns { title: string, items: Array<RawItem> }
    const { title: feedTitle, items } = await proxyManager.fetchViaProxy(feedUrl);

    // Normalize items to internal application structure
    // This includes scoring, sentiment analysis (if applicable), and cleaning
    return items.map(item => normalizeItem(item, feedTitle, section));
}

function normalizeItem(item, feedSource, section = 'general') {
    const pubDateStr = item.pubDate || item.created || new Date().toISOString();
    const publishedAt = Date.parse(pubDateStr) || Date.now();

    let source = feedSource;
    if (item.author) source = item.author;
    source = cleanSource(source);

    const articleId = hash(item.link || item.guid || item.title);
    const description = item.description || "";

    // Dynamic Section Classification
    const detectedSection = classifySection(item.title || '', description || '', source);
    // If classification found a match, use it. Otherwise, stick to the feed's section.
    const finalSection = detectedSection || section;

    // NEW - Phase 7: Image Extraction
    let imageUrl = null;

    // Method 1: RSS enclosure (most common)
    if (item.enclosure && item.enclosure.url) {
        imageUrl = item.enclosure.url;
    }
    // Method 2: media:thumbnail (MediaRSS)
    else if (item.thumbnail) {
        imageUrl = item.thumbnail;
    }
    // Method 3: media:content
    else if (item['media:content'] && item['media:content'].url) {
        imageUrl = item['media:content'].url;
    }
    // Method 4: Extract from description HTML
    else if (description.includes('<img')) {
        const imgMatch = description.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch) {
            imageUrl = imgMatch[1];
        }
    }

    // Validate image URL
    if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = null; // Reject invalid URLs
    }

    const isFinanceRelated = ['business', 'market'].includes(section) ||
        /\b(stock|market|shares|trading|sensex|nifty|bank|economy|crypto|ipo|revenue|profit)\b/i.test(item.title + description);

    let sentimentData = null;
    if (isFinanceRelated) {
        sentimentData = analyzeArticleSentiment(item.title, cleanDescription(description));
    }

    return {
        id: articleId,
        title: item.title,
        headline: item.title,
        description: description,
        summary: cleanDescription(description),
        link: item.link,
        url: item.link,
        source: source,
        publishedAt: publishedAt,
        fetchedAt: Date.now(),
        time: new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        impactScore: 0,
        section: finalSection, // Use the classified section
        criticsView: generateCriticsOneLiner(item.title, cleanDescription(description), source),
        sentiment: sentimentData ? {
            label: sentimentData.label,
            comparative: sentimentData.comparative,
            titleSentiment: sentimentData.titleSentiment,
            descriptionSentiment: sentimentData.descriptionSentiment
        } : null,
        imageUrl: imageUrl  // NEW - Phase 7
    };
}

async function rankAndFilter(items, section, limit, allowedSources) {
    try {
        const seen = new Set();
        const now = Date.now();

        const settings = getSettings();
        // Use new setting hideOlderThanHours, fallback to legacy freshnessLimitHours
        const limitHours = settings.hideOlderThanHours || settings.freshnessLimitHours || 60;
        const MAX_AGE_MS = limitHours * 60 * 60 * 1000;
        const bypassFreshness = settings.strictFreshness === false; // If strict is off, bypass

        console.log(`[RSSDebug] filtering for ${section}: Limit=${limitHours}h. Items=${items.length}`);

        const preProcessed = items
            .filter(item => {
                // 1. Freshness Filter (Strict)
                if (!bypassFreshness && (now - item.publishedAt > MAX_AGE_MS)) return false;

                // 2. Filtering Mode (Source vs Keyword)
                if (settings.filteringMode === 'keyword') {
                    // Strict Keyword Mode: Must match high-impact keywords
                    if (!checkKeywords(item.title, item.description)) return false;
        } else if (settings.topWebsitesOnly) {
             // Phase 8: Top Websites Only Mode
             const TOP_SOURCES = ['BBC', 'Reuters', 'NDTV', 'The Hindu', 'Times of India', 'Moneycontrol'];
             if (!TOP_SOURCES.some(s => item.source.includes(s))) return false;
                } else {
                    // Source Mode (Default): Check allowlist
                    if (allowedSources && !isSourceAllowed(item.source, allowedSources)) return false;
                }

                return true;
            })
            .map(item => {
                // Use the item's section (which might have been re-classified)
                // or fallback to the requested section if missing
                const itemSection = item.section || section;
                return {
                    ...item,
                    section: itemSection,
                    impactScore: computeImpactScore(item, itemSection)
                };
            })
            .filter(item => {
                if (seen.has(item.id)) return false;
                seen.add(item.id);
                return true;
            });

        const clustered = deduplicateAndCluster(preProcessed, 0.75);

        // Ranking Mode
        if (settings.rankingMode === 'legacy') {
            clustered.sort((a, b) => b.publishedAt - a.publishedAt);
            return clustered.slice(0, limit);
        }
        else if (settings.rankingMode === 'context-aware') {
            // --- NEW: Context Aware Ranking (Two-Pass) ---
            console.log(`[RSS] Running Context-Aware Ranking for ${section}`);

            const geoProfile = getActiveGeoProfile(settings);

            // Pass 1: Rule-Based Scoring & Filtering
            let candidates = clustered.map(item => {
                const temporal = calculateTemporalWeight(item);
                const geo = calculateGeoRelevance(item, geoProfile);
                const noise = analyzeNoise(item);

                // Base impact is freshness + source quality (calculated in computeImpactScore)
                // We use it as a baseline signal
                const baseSignal = item.impactScore || 1.0;

                // Combined Score
                // We apply a power curve to the boosts to ensure they truly standout
                // if they match multiple criteria
                const contextMultiplier = temporal * geo;

                // If context multiplier is high (> 1.5), we supercharge the base signal
                // This ensures "Local + Timely" > "Global High Impact"
                const boostedSignal = contextMultiplier > 1.5
                    ? baseSignal * (contextMultiplier * 1.5)
                    : baseSignal * contextMultiplier;

                const contextScore = boostedSignal * noise.score;

                // Collect Reasons
                const reasons = [];
                if (temporal > 1.5) reasons.push('Time Sensitive');
                else if (temporal > 1.1) reasons.push('Time Boost');

                if (geo > 2.0) reasons.push('📍 Local Top Story');
                else if (geo > 1.1) reasons.push('Location Boost');

                if (noise.isNoise) reasons.push(noise.reason);

                return {
                    ...item,
                    contextScore,
                    rankingReason: reasons.join(' • ') || null,
                    _debug: { temporal, geo, noise: noise.score, base: baseSignal }
                };
            }).filter(item => {
                // Hard Filter for Noise
                const noise = analyzeNoise(item);
                if (noise.isNoise && noise.score < 0.6) return false;
                return true;
            });

            // Sort by Context Score (Descending)
            candidates.sort((a, b) => b.contextScore - a.contextScore);

            // Pass 2: AI Evaluation on Top Candidates (Top 10)
            // Only if we have an API key and it's worth it
            if (settings.geminiKey && candidates.length > 0) {
                const topCandidates = candidates.slice(0, 10);
                const rest = candidates.slice(10);

                // Async AI Call
                const evaluated = await evaluateWithAI(topCandidates);

                // Merge back
                candidates = [...evaluated, ...rest].map(item => {
                    if (item.aiScore) {
                        // Apply AI multiplier
                        item.contextScore *= item.aiScore;
                        if (item.aiReason) item.rankingReason = `AI: ${item.aiReason}`;
                    }
                    return item;
                });

                // Final Sort
                candidates.sort((a, b) => b.contextScore - a.contextScore);
            }

            // Map contextScore back to impactScore for UI compatibility
            const finalResult = candidates.map(item => ({
                ...item,
                impactScore: item.contextScore
            }));

            return finalResult.slice(0, limit);
        }
        else {
            // Default 'smart' (Original Impact Score)
            clustered.sort((a, b) => b.impactScore - a.impactScore);
            return clustered.slice(0, limit);
        }

    } catch (error) {
        console.error(`[RSS] Ranking error for ${section}:`, error);
        throw error;
    }
}

/* ---------- Cache Management API (Phase 6) ---------- */

/**
 * Get cache statistics for debugging
 * @returns {Object} Cache stats including entries and ages
 */
export function getCacheStats() {
    const stats = {
        totalEntries: memoryCache.size,
        cacheEnabled: getSettings().enableCache !== false,
        cacheTTL: CACHE_TTL_MS / 1000, // in seconds
        entries: []
    };

    memoryCache.forEach((value, key) => {
        const ageSeconds = Math.round((Date.now() - value.timestamp) / 1000);
        stats.entries.push({
            section: key,
            ageSeconds,
            itemCount: value.data?.length || 0,
            isExpired: ageSeconds > (CACHE_TTL_MS / 1000)
        });
    });

    return stats;
}

/**
 * Clear all cached news data
 * Useful when settings change or manual refresh needed
 */
export function clearNewsCache() {
    const size = memoryCache.size;
    memoryCache.clear();
    console.log(`[RSS] 🗑️ Cleared ${size} cache entries`);
    return size;
}
