/**
 * Centralized RSS aggregation & ranking service.
 * Designed for section-wise fetching and high-impact news extraction.
 */

import { GOOGLE_FEEDS } from './googleNewsService';
import { getSettings } from '../utils/storage';

const RSS_PROXY_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";

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
        GOOGLE_FEEDS.BUSINESS_IN,
        "https://feeds.bbci.co.uk/news/business/rss.xml",
        "https://www.cnbc.com/id/10001147/device/rss/rss.html"
    ],
    technology: [
        GOOGLE_FEEDS.TECH_IN,
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

const SOURCE_WEIGHTS = {
    "NDTV": 1.5,
    "The Hindu": 1.5,
    "BBC": 1.2,
    "CNN": 1.1,
    "CNBC": 1.1,
    "Oman Observer": 1.2,
    "Muscat Daily": 1.1,
    "TechCrunch": 1.2,
    "ESPN": 1.0,
    "Times of India": 1.1,
    "Hindustan Times": 1.1,
    "Indian Express": 1.1,
    "DT Next": 1.2,
    "Moneycontrol": 1.1,
    "Al Jazeera": 1.1,
    "Variety": 1.1,
    "Hollywood Reporter": 1.1,
    "Bollywood Hungama": 1.1,
    "default": 0.9
};

// Mapping from Settings keys to Source Names
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

/* ---------- Public API ---------- */

/**
 * Fetches news for a given section.
 * @param {string} section
 * @param {number} limit
 * @param {Object} allowedSources - Map of enabled source keys (optional)
 * @returns {Promise<NewsItem[]>}
 */
export async function fetchSectionNews(section, limit = 10, allowedSources = null) {
    const cacheKey = section;
    let items = [];
    const cached = memoryCache.get(cacheKey);

    // Check cache for RAW items
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
        console.log(`[RSS] Serving ${section} from cache`);
        items = cached.data;
    } else {
        console.log(`[RSS] Fetching live for ${section}`);
        const feeds = SECTION_FEEDS[section] || [];
        if (feeds.length === 0) return [];

        try {
            const results = await Promise.allSettled(feeds.map(fetchAndParseFeed));

            // Flatten results from successful fetches
            items = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value)
                .flat();

            memoryCache.set(cacheKey, {
                timestamp: Date.now(),
                data: items
            });
        } catch (error) {
            console.error(`[RSS] Error fetching section ${section}:`, error);
            return [];
        }
    }

    // Filter and Rank (Always applied, even on cached data)
    return rankAndFilter(items, section, limit, allowedSources);
}

/* ---------- Core Logic ---------- */

/**
 * Fetches a single feed via proxy and normalizes items.
 * @param {string} feedUrl
 * @returns {Promise<NewsItem[]>}
 */
/**
 * Fetches a single feed via proxy and normalizes items.
 * Tries `rss2json` first (easy JSON).
 * Fallback to `allorigins` (raw XML) if rss2json fails or returns status 'error'.
 * @param {string} feedUrl
 * @returns {Promise<NewsItem[]>}
 */
async function fetchAndParseFeed(feedUrl) {
    try {
        // Strategy 1: RSS2JSON (Best for simple JSON)
        // Note: Often fails or rate limits.
        const response = await fetch(`${RSS_PROXY_BASE}${encodeURIComponent(feedUrl)}`);

        if (response.ok) {
            const data = await response.json();
            if (data.status === 'ok') {
                const feedSource = data.feed?.title || "Unknown Source";
                return (data.items || []).map(item => normalizeItem(item, feedSource));
            }
        }

        throw new Error('RSS2JSON Failed or returned error status');

    } catch (error) {
        console.warn(`[RSS] Primary proxy failed for ${feedUrl}, trying fallback...`, error);
        return fetchWithAllOrigins(feedUrl);
    }
}

/**
 * Strategy 2: AllOrigins + DOMParser (Robust Fallback)
 * Fetches raw XML via proxy and parses it in the browser.
 */
async function fetchWithAllOrigins(feedUrl) {
    const ALL_ORIGINS = `https://api.allorigins.win/get?url=${encodeURIComponent(feedUrl)}`;

    try {
        const response = await fetch(ALL_ORIGINS);
        if (!response.ok) throw new Error('AllOrigins Network Error');

        const data = await response.json();
        const xmlString = data.contents;
        if (!xmlString) throw new Error('AllOrigins empty content');

        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlString, "text/xml");

        // Parse parse error
        if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
            throw new Error('XML Parsing Error');
        }

        const items = Array.from(xmlDoc.querySelectorAll("item"));
        const feedTitle = xmlDoc.querySelector("channel > title")?.textContent || "Unknown Source";

        return items.map(node => {
            const title = node.querySelector("title")?.textContent || "No Title";
            const link = node.querySelector("link")?.textContent || "";
            const pubDate = node.querySelector("pubDate")?.textContent || "";
            const description = node.querySelector("description")?.textContent || "";
            const sourceNode = node.querySelector("source");
            const author = node.querySelector("author") || node.querySelector("dc\\:creator"); // Handle namespaces if possible, though querySelector might struggle without ns resolver

            // Normalize to match rss2json structure for normalizeItem re-use?
            // Actually, easier to normalize directly here.

            // Normalize Date
            const publishedAt = Date.parse(pubDate) || Date.now();

            // Normalize Source
            let source = feedTitle;
            if (sourceNode) source = sourceNode.textContent;
            else if (author) source = author.textContent;

            source = cleanSource(source);

            // Clean description
            const summary = cleanDescription(description);

            return {
                id: hash(link || title),
                title: title,
                headline: title,
                description: description,
                summary: summary,
                link: link,
                url: link,
                source: source,
                publishedAt: publishedAt,
                fetchedAt: Date.now(),
                time: new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                impactScore: 0,
                criticsView: generateCriticsOneLiner(title, summary, source)
            };
        });

    } catch (err) {
        console.error(`[RSS] All Fallbacks failed for ${feedUrl}`, err);
        return [];
    }
}

function normalizeItem(item, feedSource) {
    // rss2json returns 'pubDate' usually.
    const pubDateStr = item.pubDate || item.created || new Date().toISOString();
    const publishedAt = Date.parse(pubDateStr) || Date.now();

    // Attempt to extract cleaner source from title if possible, or use feed title
    // Some feeds put "Title - Source"
    let source = feedSource;
    if (item.author) source = item.author;

    // Clean up source name using known weights keys
    source = cleanSource(source);

    const articleId = hash(item.link || item.guid || item.title);
    return {
        id: articleId,
        title: item.title,
        headline: item.title, // Alias for UI compatibility
        description: item.description || "",
        summary: cleanDescription(item.description || ""), // Ensure summary is populated
        link: item.link,
        url: item.link, // Alias for UI compatibility
        source: source,
        publishedAt: publishedAt,
        fetchedAt: Date.now(),
        time: new Date(publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        impactScore: 0, // calculated later
        criticsView: generateCriticsOneLiner(item.title, cleanDescription(item.description || ""), source)
    };
}

function rankAndFilter(items, section, limit, allowedSources) {
    const seen = new Set();
    const now = Date.now();

    // Get limit from settings or legacy fallback
    // Since this is a pure service, we should ideally pass settings in, or import strictly if safe.
    // Importing getSettings here is safe as it's sync from localStorage.
    // settings is already available via import, but we need to ensure we call it inside the function 
    // or if we rely on the import being live. getSettings() reads from localStorage, so calling it here is correct.
    const settings = getSettings();
    const limitHours = settings.freshnessLimitHours || 26;
    const MAX_AGE_MS = limitHours * 60 * 60 * 1000;

    console.log(`[RSS Debug] filtering for ${section}: Limit=${limitHours}h (${MAX_AGE_MS}ms). Now=${now}`);


    return items
        .filter(item => {
            // Freshness Gate: Hard filter based on settings
            if (now - item.publishedAt > MAX_AGE_MS) {
                return false;
            }

            // Filter by allowed sources if provided
            if (allowedSources) {
                return isSourceAllowed(item.source, allowedSources);
            }
            return true;
        })
        .map(item => ({
            ...item,
            section,
            impactScore: computeImpactScore(item, section)
        }))
        .filter(item => {
            // Deduplication by ID (hash of link/title)
            if (seen.has(item.id)) return false;
            seen.add(item.id);
            return true;
        })
        .sort((a, b) => b.impactScore - a.impactScore)
        .slice(0, limit);
}

function isSourceAllowed(sourceName, allowedSources) {
    // If allowedSources is passed, we check if the source is enabled.
    // We map the sourceName (e.g. "NDTV") back to settings keys (e.g. "ndtv")

    // 1. Direct match (if sourceName matches a key directly? unlikely due to formatting)
    // 2. Reverse lookup in SETTINGS_MAPPING

    let matchedKey = null;

    // Check mapping
    for (const [key, name] of Object.entries(SETTINGS_MAPPING)) {
        if (sourceName.includes(name) || name.includes(sourceName)) {
            matchedKey = key;
            break;
        }
    }

    // If we found a key, check if it's enabled
    if (matchedKey) {
        return allowedSources[matchedKey] !== false;
    }

    // If source is not in our mapping/controlled list, we allow it by default
    // (unless we want strict whitelist? The prompt implied strict whitelist for Google News fallback,
    // but for specific RSS feeds we added, we assume they are desired unless explicitly disabled).
    // The settings menu doesn't have toggles for EVERY possible source (e.g. ESPN).
    // So we default to TRUE for unlisted sources.
    return true;
}

function computeImpactScore(item, section) {
    // 1. Freshness Score (0 to 2 points)
    // Items < 24h get score. Newer = higher.
    const ageInMs = Date.now() - item.publishedAt;
    const ageInDays = ageInMs / (1000 * 60 * 60 * 24);
    const freshness = Math.max(0, 1 - ageInDays) * 2;

    // 2. Source Weight
    // Match partial strings to SOURCE_WEIGHTS keys
    let sourceWeight = SOURCE_WEIGHTS.default;
    for (const [key, weight] of Object.entries(SOURCE_WEIGHTS)) {
        if (item.source.includes(key) || (item.author && item.author.includes(key))) {
            sourceWeight = weight;
            break;
        }
    }

    // 3. Keyword Boost
    const keywordBoost = KEYWORDS.some(k =>
        item.title.toLowerCase().includes(k)
    ) ? 0.5 : 0;

    // 4. Section Priority
    const sectionPriority = section === "world" ? 1.5 : section === "business" ? 1.2 : 1;

    return freshness + sourceWeight + keywordBoost + sectionPriority;
}

function cleanSource(sourceName) {
    if (!sourceName) return "Unknown";
    for (const key of Object.keys(SOURCE_WEIGHTS)) {
        if (key !== 'default' && sourceName.includes(key)) {
            return key;
        }
    }
    return sourceName;
}

// Simple string hash for ID generation
function hash(value) {
    let h = 0;
    if (!value) return "0";
    for (let i = 0; i < value.length; i++) {
        h = (h << 5) - h + value.charCodeAt(i);
        h |= 0;
    }
    return h.toString();
}

// Helper to strip HTML tags from description
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
 * Generates a "Critic's One Liner" heuristic from title/description
 * @param {string} title 
 * @param {string} description 
 * @param {string} source 
 */
function generateCriticsOneLiner(title, description, source) {
    // 1. If description has a clear quote, use it
    const quoteMatch = description.match(/"([^"]{15,100})"/);
    if (quoteMatch) return `"${quoteMatch[1]}"`;

    // 2. If title is a question, answer it ambiguously or interestingly
    if (title.includes('?')) {
        return `Analysts debate the implications of this developing story from ${source}.`;
    }

    // 3. Extract the last sentence of description (often the impact/punchline)
    // sentences ending in . ! ?
    const sentences = description.split(/[.!?]\s+/);
    if (sentences.length > 1) {
        const last = sentences[sentences.length - 1];
        if (last.length > 20 && last.length < 120) return last;
        // If last is too short/long, try first
        const first = sentences[0];
        if (first.length > 20 && first.length < 120) return first;
    }

    // 4. Default fallbacks
    if (source === 'Google News') return "Breaking coverage on this trending topic.";
    return `Latest update from ${source} on this unfolding event.`;
}

