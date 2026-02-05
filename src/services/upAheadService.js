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
 * @param {Object} settings - { categories: { movies: true... }, locations: ['Chennai', 'Muscat'], hideOlderThanHours: 60 }
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
            // Add location-specific queries (e.g., "events happening this week Chennai")
            if (cat === 'events' || cat === 'alerts' || cat === 'movies') {
                locations.forEach(loc => {
                    // Skip "India" for hyper-local categories to avoid noise (e.g. "Traffic Advisory India" -> fetches Thane/Mumbai news)
                    if (loc.toLowerCase() === 'india' && (cat === 'alerts' || cat === 'events')) {
                        return;
                    }
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
    const organizedData = processUpAheadData(allItems, settings);

    return organizedData;
}

/**
 * Normalizes an RSS item into an Up Ahead item
 */
export function normalizeUpAheadItem(item, config) {
    const title = item.title || '';
    const description = item.description || '';
    const fullText = `${title} ${description}`;
    const pubDate = item.pubDate ? new Date(item.pubDate) : null;

    // Attempt to extract a date, using pubDate as context
    const extractedDate = extractFutureDate(fullText, pubDate);

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
        pubDate: pubDate, // Store as Date object or null
        extractedDate: extractedDate, // This is the crucial "Event Date"
        category: category,
        rawSource: config.originalQuery || 'feed'
    };
}

/**
 * Regex-based Category Detection
 */
export function detectCategory(text) {
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
 * @param {string} text - The text to search for dates
 * @param {Date|null} pubDate - The publication date of the article (for year context)
 */
export function extractFutureDate(text, pubDate) {
    // 1. Check for explicit dates e.g., "October 25", "25th Oct", "Oct 25, 2024"
    // Regex for Month Day pairs, optionally with Year
    const months = 'jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december';

    // Pattern: "October 25" or "October 25, 2025"
    const dateRegex = new RegExp(`\\b(${months})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?\\b`, 'i');

    // Pattern: "25th October" or "25 October 2025"
    const reverseDateRegex = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${months})(?:,?\\s+(\\d{4}))?\\b`, 'i');

    let match = text.match(dateRegex);
    let day, monthStr, explicitYear;

    if (match) {
        monthStr = match[1];
        day = parseInt(match[2]);
        if (match[3]) explicitYear = parseInt(match[3]);
    } else {
        match = text.match(reverseDateRegex);
        if (match) {
            day = parseInt(match[1]);
            monthStr = match[2];
            if (match[3]) explicitYear = parseInt(match[3]);
        }
    }

    if (day && monthStr) {
        // Contextualize the year
        const now = new Date();
        const monthIndex = new Date(`${monthStr} 1, 2000`).getMonth();
        let year;

        if (explicitYear) {
            // Use the explicit year found in the text
            year = explicitYear;
        } else {
            year = now.getFullYear();

            // If pubDate is available, use its year as the primary anchor
            if (pubDate && !isNaN(pubDate.getTime())) {
                year = pubDate.getFullYear();

                // Handle edge case: Article in Dec talking about Jan (Next Year)
                const eventMonthIsEarlier = monthIndex < pubDate.getMonth();
                if (eventMonthIsEarlier && (pubDate.getMonth() - monthIndex) > 6) {
                    year = year + 1;
                }
            } else {
                 // Fallback: if extracted date is "far past" relative to now, assume next year.
                 const currentMonth = now.getMonth();
                 if (monthIndex < currentMonth && (currentMonth - monthIndex) > 3) {
                     year = year + 1;
                 }
            }
        }

        return new Date(year, monthIndex, day);
    }

    // 2. Relative Dates: "Tomorrow", "This Friday"
    const lower = text.toLowerCase();

    // Use pubDate as "today" reference if available, otherwise real Today
    const refDate = (pubDate && !isNaN(pubDate.getTime())) ? pubDate : new Date();

    if (lower.includes('tomorrow')) {
        const d = new Date(refDate);
        d.setDate(refDate.getDate() + 1);
        return d;
    }

    return null;
}


/**
 * Processing Logic to create the final JSON structure
 */
export function processUpAheadData(rawItems, settings) {
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

    // Default max age: 60 hours (2.5 days)
    const maxAgeHours = settings?.hideOlderThanHours || 60;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    rawItems.forEach(item => {
        if (seenIds.has(item.id)) return;
        seenIds.add(item.id);

        // Strict Freshness Check
        // If pubDate exists and is older than limit, DISCARD IT.
        if (item.pubDate) {
            const ageMs = Date.now() - item.pubDate.getTime();
            if (ageMs > maxAgeMs) {
                // Old news. But check if it has a FUTURE extracted date?
                // Logic: If the news is old (e.g. 1 week ago) but talks about an event next month, should we keep it?
                // The user says "Old stories... from Oct 22". That story was published Oct 22.
                // That is ANCIENT (months ago). We definitely want to kill that.
                // However, legitimate "Up Ahead" might be announced weeks in advance.
                // BUT, we are fetching from Google News "when:7d". So we shouldn't GET old stuff unless
                // Google News is serving old stuff (which happens).
                // If Google News serves a 3-month-old article, it's probably spam or irrelevant now.
                // Let's enforce strict freshness on the *Source Article*.
                return;
            }
        }

        // Populate Sections
        if (item.category && sections[item.category]) {
            // STRICT FILTER: For planner sections (Movies, Festivals, Events, Sports),
            // we REQUIRE a valid extracted date.
            // Alerts are exempt as they often imply "Immediate/Now" without explicit dates.
            const isPlannerCategory = ['movies', 'festivals', 'events', 'sports'].includes(item.category);

            if (isPlannerCategory && !item.extractedDate) {
                // Skip generic news items that don't have a specific date (e.g. opinion pieces, rumors)
                return;
            }

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
        let targetDate = item.extractedDate;

        // If no date, but it's an alert or very recent news, put in Today
        if (!targetDate && item.category === 'alerts') {
             // Only if very fresh (< 24h)
             if (item.pubDate && (Date.now() - item.pubDate.getTime() < 24 * 60 * 60 * 1000)) {
                 targetDate = today;
             }
        }

        // Only add to timeline if targetDate is >= Today
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
