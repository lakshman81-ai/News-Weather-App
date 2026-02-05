import { proxyManager } from './proxyManager.js';

// Configuration for search queries based on categories
const CATEGORY_QUERIES = {
    movies: [
        'new movie releases this week',
        'upcoming ott releases india',
        'movie theater releases',
        'audio launch event'
    ],
    events: [
        'events happening this week',
        'music concerts upcoming',
        'art exhibitions',
        'standup comedy shows'
    ],
    festivals: [
        'upcoming festivals india',
        'bank holidays upcoming',
        'public holidays list',
        'religious festivals this month'
    ],
    alerts: [
        'traffic advisory',
        'heavy rain alert',
        'power shutdown scheduled',
        'metro rail maintenance'
    ],
    sports: [
        'cricket match schedule upcoming',
        'football match upcoming',
        'sports events this week'
    ]
};

// Standard RSS feeds to supplement search queries
const STATIC_FEEDS = {
    movies: [
        "https://www.hindustantimes.com/feeds/rss/entertainment/tamil-cinema/rssfeed.xml",
        "https://www.hindustantimes.com/feeds/rss/entertainment/bollywood/rssfeed.xml"
    ],
    sports: [
        "https://www.espn.com/espn/rss/news"
    ],
    festivals: [
        "https://www.timeanddate.com/holidays/india/feed" // Note: Might need proxy
    ]
};

/**
 * Main function to fetch Up Ahead data based on user settings
 * @param {Object} settings - { categories: { movies: true... }, locations: ['Chennai', 'Muscat'] }
 */
export async function fetchUpAheadData(settings) {
    console.log('[UpAheadService] Fetching data with settings:', settings);

    const categories = settings?.categories || { movies: true, events: true, festivals: true, alerts: true, sports: true };
    const locations = settings?.locations && settings.locations.length > 0 ? settings.locations : ['Chennai', 'India']; // Default fallback

    let allItems = [];

    // 1. Build list of RSS/Search URLs
    const urlsToFetch = [];

    // Helper to add Google News Search URL
    const addSearchUrl = (query) => {
        const encoded = encodeURIComponent(query);
        // Using "when:7d" to ensure freshness
        urlsToFetch.push({
            url: `https://news.google.com/rss/search?q=${encoded}+when:7d&hl=en-IN&gl=IN&ceid=IN:en`,
            type: 'search',
            originalQuery: query
        });
    };

    // Iterate categories and locations
    for (const [cat, isEnabled] of Object.entries(categories)) {
        if (!isEnabled) continue;

        // A. Add Static Feeds for this category (if any)
        if (STATIC_FEEDS[cat]) {
            STATIC_FEEDS[cat].forEach(url => {
                urlsToFetch.push({ url, type: 'static', category: cat });
            });
        }

        // B. Add Search Queries (combined with locations for relevance)
        const queries = CATEGORY_QUERIES[cat] || [];
        queries.forEach(baseQuery => {
            // Add a general query (e.g., "upcoming festivals india")
            // addSearchUrl(baseQuery);

            // Add location-specific queries (e.g., "events happening this week Chennai")
            if (cat === 'events' || cat === 'alerts' || cat === 'movies') {
                locations.forEach(loc => {
                    addSearchUrl(`${baseQuery} ${loc}`);
                });
            } else {
                 // For sports/festivals, location might be less strict or handled by "India"
                 addSearchUrl(`${baseQuery}`);
            }
        });
    }

    // Deduplicate URLs
    const uniqueUrls = [...new Map(urlsToFetch.map(item => [item.url, item])).values()];

    console.log(`[UpAheadService] Prepared ${uniqueUrls.length} feeds to fetch.`);

    // 2. Fetch All Feeds in Parallel
    // We use a simplified version of what's in rssAggregator, or reuse it directly.
    // To allow better tagging, we'll fetch individually here but reuse the proxy logic.

    const fetchPromises = uniqueUrls.map(async (feedConfig) => {
        try {
            // Using proxyManager directly to get raw items, then processing
            const { items } = await proxyManager.fetchViaProxy(feedConfig.url);

            // Map items to our structure immediately
            return items.map(item => normalizeUpAheadItem(item, feedConfig));
        } catch (error) {
            console.warn(`[UpAheadService] Failed to fetch ${feedConfig.url}:`, error.message);
            return [];
        }
    });

    const results = await Promise.all(fetchPromises);
    allItems = results.flat();

    // 3. Process, Deduplicate, and Organize
    const organizedData = processUpAheadData(allItems);

    return organizedData;
}

/**
 * Normalizes an RSS item into an Up Ahead item
 */
function normalizeUpAheadItem(item, config) {
    const title = item.title || '';
    const description = item.description || '';
    const fullText = `${title} ${description}`;

    // Attempt to extract a date
    const extractedDate = extractFutureDate(fullText);

    // Determine Category (if not already known from config)
    let category = config.category;
    if (!category || config.type === 'search') {
        category = detectCategory(fullText);
    }

    return {
        id: item.guid || item.link || title,
        title: title,
        link: item.link,
        description: description,
        pubDate: item.pubDate,
        extractedDate: extractedDate, // This is the crucial "Event Date"
        category: category,
        rawSource: config.originalQuery || 'feed'
    };
}

/**
 * Regex-based Category Detection
 */
function detectCategory(text) {
    const t = text.toLowerCase();
    if (t.includes('movie') || t.includes('release') || t.includes('trailer') || t.includes('film') || t.includes('cinema') || t.includes('ott')) return 'movies';
    if (t.includes('cricket') || t.includes('match') || t.includes('football') || t.includes('tournament') || t.includes('vs')) return 'sports';
    if (t.includes('festival') || t.includes('holiday') || t.includes('jayanti') || t.includes('puja')) return 'festivals';
    if (t.includes('alert') || t.includes('warning') || t.includes('heavy rain') || t.includes('traffic') || t.includes('shut')) return 'alerts';
    if (t.includes('concert') || t.includes('exhibition') || t.includes('show') || t.includes('workshop')) return 'events';
    return 'general';
}

/**
 * Intelligent Date Extraction
 * Looks for patterns like "Oct 20", "Next Friday", "Tomorrow", etc.
 */
function extractFutureDate(text) {
    // 1. Check for explicit dates e.g., "October 25", "25th Oct"
    // Simple regex for Month Day pairs
    const months = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december';
    const dateRegex = new RegExp(`\\b(${months})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
    const reverseDateRegex = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${months})\\b`, 'i');

    let match = text.match(dateRegex);
    let day, monthStr;

    if (match) {
        monthStr = match[1];
        day = parseInt(match[2]);
    } else {
        match = text.match(reverseDateRegex);
        if (match) {
            day = parseInt(match[1]);
            monthStr = match[2];
        }
    }

    if (day && monthStr) {
        // Construct a date object for the current/next year
        const now = new Date();
        const monthIndex = new Date(`${monthStr} 1, 2000`).getMonth();
        let year = now.getFullYear();

        // If the extracted month is earlier than this month, assume next year (unless it's very close)
        // Simple logic: just use current year first.
        let potentialDate = new Date(year, monthIndex, day);

        // If date is in the past (more than a few days), maybe it's next year?
        // For "Up Ahead", we mostly care about future.
        if (potentialDate < new Date(now.getTime() - 86400000 * 2)) {
             // It was in the past. But wait, maybe the news is *about* a past event?
             // Or maybe it's next year. Let's assume current year for simplicity unless explicitly 202X.
        }

        return potentialDate;
    }

    // 2. Relative Dates: "Tomorrow", "This Friday"
    const lower = text.toLowerCase();
    const today = new Date();

    if (lower.includes('tomorrow')) {
        const d = new Date(today);
        d.setDate(today.getDate() + 1);
        return d;
    }

    // "This Friday", "Next Monday" etc. - Simplified for now.
    // Parsing this robustly requires a heavier library, keeping it light.

    // Fallback: If no event date found, use the publication date if it's very recent?
    // No, for "Up Ahead" we specifically want future events.
    // If we can't find a future date, it might not belong in the timeline but in "Worth Knowing".

    return null;
}


/**
 * Processing Logic to create the final JSON structure
 */
function processUpAheadData(rawItems) {
    const today = new Date();
    today.setHours(0,0,0,0);

    const timelineMap = new Map(); // Key: "YYYY-MM-DD", Value: { dateObj, items: [] }
    const sections = {
        movies: [],
        festivals: [],
        alerts: [],
        events: [],
        sports: []
    };

    const seenIds = new Set();

    rawItems.forEach(item => {
        if (seenIds.has(item.id)) return;
        seenIds.add(item.id);

        // Filter out very old items (older than 3 days) if no future date extracted
        const pubAge = (Date.now() - new Date(item.pubDate).getTime()) / (1000 * 60 * 60 * 24);
        if (!item.extractedDate && pubAge > 3) return;

        // Populate Sections
        if (item.category && sections[item.category]) {
            // Simplify item for display
            const displayItem = {
                title: item.title,
                link: item.link,
                releaseDate: item.extractedDate ? item.extractedDate.toDateString() : null, // For movies
                date: item.extractedDate ? item.extractedDate.toDateString() : null, // For festivals
                text: item.title, // For alerts
                severity: 'medium', // Default
                language: 'Unknown' // Placeholder
            };
            sections[item.category].push(displayItem);
        }

        // Populate Timeline
        // Logic: If we have an extracted date, put it there.
        // If not, but it's "Breaking" or "Alert", maybe put it in Today/Tomorrow?

        let targetDate = item.extractedDate;

        // If no date, but it's an alert or very recent news, put in Today
        if (!targetDate && item.category === 'alerts' && pubAge < 1) {
            targetDate = today;
        }

        if (targetDate && targetDate >= today) {
            const dateKey = targetDate.toISOString().split('T')[0];

            if (!timelineMap.has(dateKey)) {
                timelineMap.set(dateKey, {
                    date: dateKey,
                    dayLabel: getDayLabel(targetDate),
                    items: []
                });
            }

            const timelineItem = {
                id: item.id,
                type: getItemType(item.category), // "movie", "alert", etc.
                title: item.title,
                subtitle: item.category.toUpperCase(),
                description: item.description,
                tags: [item.category],
                link: item.link
            };

            timelineMap.get(dateKey).items.push(timelineItem);
        }
    });

    // Sort Timeline by Date
    const sortedTimeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Limit sections length
    Object.keys(sections).forEach(k => {
        sections[k] = sections[k].slice(0, 5);
    });

    // Generate Mock Weekly Plan if empty (or heuristic based)
    const weekly_plan = generateWeeklyPlan(sortedTimeline);

    return {
        timeline: sortedTimeline,
        sections: sections,
        weekly_plan: weekly_plan,
        lastUpdated: new Date().toISOString()
    };
}

function getDayLabel(date) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const d = new Date(date);
    d.setHours(0,0,0,0);

    if (d.getTime() === today.getTime()) return "Today";
    if (d.getTime() === tomorrow.getTime()) return "Tomorrow";

    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
}

function getItemType(category) {
    // map plural categories to singular types expected by UI
    const map = {
        movies: 'movie',
        events: 'event',
        festivals: 'festival',
        alerts: 'alert',
        sports: 'sport'
    };
    return map[category] || 'event';
}

function generateWeeklyPlan(timeline) {
    // Simple heuristic: Take the first event of each day for the plan
    const plan = {};
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    // This is a naive mapping. A better one would map actual dates to weekdays.

    timeline.forEach(day => {
        const dateObj = new Date(day.date);
        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

        if (day.items.length > 0) {
            plan[dayName] = `Attend ${day.items[0].title}`;
        }
    });

    // Fill gaps
    days.forEach(d => {
        if (!plan[d]) plan[d] = "Relax and recharge.";
    });

    return plan;
}
