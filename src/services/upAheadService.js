import { proxyManager } from './proxyManager.js';

// Configuration for search queries based on categories
const CATEGORY_QUERIES = {
    movies: [
        'Tamil movie release this week',
        'new movie release OTT',
        'BookMyShow Chennai movies',
        'upcoming movies Kollywood',
        'movie tickets showtimes'
    ],
    events: [
        // General Events
        'Chennai events this week',
        'LiveChennai events',
        'concert tickets Chennai',
        'standup comedy show Chennai',
        'exhibition workshops Chennai',
        'things to do Chennai weekend',
        'Muscat events this week',
        'Muscat concerts exhibitions',
        // Entertainment (Merged)
        'theatre shows Chennai this week',
        'art exhibition Chennai',
        'food festival Chennai',
        'cultural event Chennai',
        'music sabha Chennai',
        'Muscat Royal Opera House events'
    ],
    festivals: [
        'upcoming festivals Tamil Nadu 2026',
        'bank holidays India upcoming',
        'public holidays Tamil Nadu',
        'religious festivals this month India',
        'Oman festivals holidays'
    ],
    alerts: [
        'TANGEDCO power cut Chennai tomorrow',
        'TNEB power shutdown schedule',
        'Chennai traffic advisory today',
        'Chennai metro maintenance',
        'water supply disruption Chennai',
        'road closure Chennai'
    ],
    weather_alerts: [
        'IMD Chennai weather warning',
        'Tamil Nadu heavy rain alert',
        'cyclone warning Chennai',
        'heat wave advisory Tamil Nadu',
        'Oman weather warning Muscat'
    ],
    sports: [
        'IPL 2026 schedule matches',
        'cricket match Chennai CSK',
        'ISL football match schedule',
        'Pro Kabaddi schedule',
        'sports events Chennai this week'
    ],
    shopping: [
        'Chennai sale offers discount today',
        'exhibition sale Chennai',
        'Pongal sale Tamil Nadu',
        'Diwali offers Chennai',
        'end of season sale Chennai mall',
        'Muscat shopping festival offers'
    ],
    civic: [
        'VIP visit Chennai road closure',
        'minister visit Tamil Nadu traffic',
        'protest bandh Chennai tomorrow',
        'Chennai corporation announcement',
        'Muscat road closure traffic'
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
        "https://www.timeanddate.com/holidays/india/feed"
    ],
    events: [
        "https://www.thehindu.com/news/cities/chennai/feeder/default.rss"
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
function stripHtml(html) {
    if (!html) return "";
    let text = html.toString();

    // Decode common entities first
    const entities = {
        '&nbsp;': ' ',
        '&amp;': '&',
        '&quot;': '"',
        '&#39;': "'",
        '&lt;': '<',
        '&gt;': '>'
    };

    text = text.replace(/&[a-z0-9#]+;/gi, (match) => entities[match] || match);

    // Remove scripts and styles
    text = text.replace(/<script[^>]*>([\S\s]*?)<\/script>/gmi, "");
    text = text.replace(/<style[^>]*>([\S\s]*?)<\/style>/gmi, "");

    // Remove all HTML tags
    text = text.replace(/<\/?[^>]+(>|$)/g, "");

    return text.trim();
}

export function normalizeUpAheadItem(item, config) {
    const title = stripHtml(item.title || '');
    const description = stripHtml(item.description || '');
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
    // Order matters — more specific checks first
    if (t.includes('power cut') || t.includes('power shutdown') || t.includes('tangedco') || t.includes('tneb')) return 'alerts';
    if (t.includes('traffic advisory') || t.includes('road closure') || t.includes('water supply')) return 'alerts';
    if (t.includes('cyclone') || t.includes('heavy rain') || t.includes('weather warning') || t.includes('heat wave') || t.includes('imd')) return 'weather_alerts';
    if (t.includes('movie') || t.includes('release') || t.includes('trailer') || t.includes('film') || t.includes('cinema') || t.includes('ott') || t.includes('booking')) return 'movies';
    if (t.includes('cricket') || t.includes('ipl') || t.includes('match') || t.includes('football') || t.includes('kabaddi') || t.includes('tournament')) return 'sports';
    if (t.includes('festival') || t.includes('holiday') || t.includes('jayanti') || t.includes('puja') || t.includes('pongal') || t.includes('diwali') || t.includes('ramadan') || t.includes('eid')) return 'festivals';
    if (t.includes('sale') || t.includes('offer') || t.includes('discount') || t.includes('shopping') || t.includes('deal') || t.includes('expo')) return 'shopping';
    if (t.includes('minister') || t.includes('vip visit') || t.includes('rally') || t.includes('protest') || t.includes('bandh') || t.includes('corporation')) return 'civic';
    // Entertainment merged into events logic
    if (t.includes('concert') || t.includes('exhibition') || t.includes('show') || t.includes('workshop') || t.includes('theatre') || t.includes('opera') || t.includes('sabha') || t.includes('comedy')) return 'events';
    if (t.includes('alert') || t.includes('warning') || t.includes('shut')) return 'alerts';
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
        sports: [],
        shopping: [],
        civic: [],
        weather_alerts: []
    };

    const seenIds = new Set();

    // Default max age: 60 hours (2.5 days)
    const maxAgeHours = settings?.hideOlderThanHours || 60;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;

    rawItems.forEach(item => {
        if (seenIds.has(item.id)) return;
        seenIds.add(item.id);

        // Strict Freshness Check
        if (item.pubDate) {
            const ageMs = Date.now() - item.pubDate.getTime();
            if (ageMs > maxAgeMs) {
                return;
            }
        }

        const fullText = (item.title + " " + item.description).toLowerCase();

        // --- KEYWORD FILTERING (Phase 9) ---
        const keywords = settings?.upAhead?.keywords || {};

        // 1. Negative Filtering (Global)
        const negativeWords = keywords.negative || ["review", "interview", "shares", "gossip", "opinion", "reaction"];
        if (negativeWords.some(w => fullText.includes(w.toLowerCase()))) {
            return; // Drop item
        }

        // 2. Positive Filtering (Category Specific)
        if (['movies', 'events'].includes(item.category)) {
            const positiveWords = keywords[item.category]; // e.g. ["tickets", "showtimes"]
            if (positiveWords && positiveWords.length > 0) {
                // If user defined positive keywords, require at least one match?
                // Or just boost? The user said "Focus on...", which implies strictness or strong ranking.
                // Let's implement strictness for now as requested to "remove generic news".
                const hasMatch = positiveWords.some(w => fullText.includes(w.toLowerCase()));
                if (!hasMatch) return; // Drop if it doesn't match focus keywords
            }
        }

        // 3. Strict Location for Alerts
        if (item.category === 'alerts') {
            const userLocations = settings?.upAhead?.locations || ['Chennai', 'Muscat', 'Trichy'];
            const hasLocation = userLocations.some(loc => fullText.includes(loc.toLowerCase()));
            if (!hasLocation) {
                return; // Drop alerts not mentioning user's specific locations
            }
        }

        // Populate Sections
        if (item.category && sections[item.category]) {
            // STRICT FILTER: For planner sections, we REQUIRE a valid extracted date.
            // Alerts/Weather Alerts are exempt as they often imply "Immediate/Now".
            const isPlannerCategory = ['movies', 'festivals', 'events', 'sports', 'shopping', 'civic'].includes(item.category);

            if (isPlannerCategory && !item.extractedDate) {
                return;
            }

            // Simplify item for display
            const displayItem = {
                title: item.title,
                link: item.link,
                releaseDate: item.extractedDate ? item.extractedDate.toDateString() : null,
                date: item.extractedDate ? item.extractedDate.toDateString() : null,
                text: item.title,
                severity: 'medium',
                language: 'Unknown'
            };
            sections[item.category].push(displayItem);
        }

        // Populate Timeline
        let targetDate = item.extractedDate;

        // If no date, but it's an alert/weather_alert or very recent news, put in Today
        if (!targetDate && (item.category === 'alerts' || item.category === 'weather_alerts')) {
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
        sports: 'sport',
        shopping: 'shopping',
        civic: 'civic',
        weather_alerts: 'weather_alert'
    };
    return map[category] || 'event';
}

function generateWeeklyPlan(timeline) {
    const plan = {};
    const today = new Date();

    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

        const timelineDay = timeline.find(t => t.date === dateStr);

        if (timelineDay && timelineDay.items.length > 0) {
            plan[dayName] = timelineDay.items.map(item => ({
                title: item.title,
                type: item.type,
                icon: getCategoryIcon(item.type),
                link: item.link
            }));
        } else {
            plan[dayName] = []; // Return empty array
        }
    }

    return plan;
}

function getCategoryIcon(type) {
    const icons = {
        movie: '🎬',
        event: '🎭',
        festival: '🎊',
        alert: '⚠️',
        sport: '⚽',
        shopping: '🛒',
        civic: '🏛️',
        entertainment: '🎶',
        weather_alert: '🌪️',
        general: '📅'
    };
    return icons[type] || '📅';
}
