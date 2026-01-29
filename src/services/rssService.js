
/**
 * RSS Service
 * Fetches high-quality news from direct RSS feeds (NDTV, The Hindu, etc.)
 * Implements "Smart Mix" logic: Top + Trending + Latest
 */

// Feed Configurations
// We use a proxy (rss2json) because browser can't fetch RSS XML directly due to CORS
const RSS_PROXY = 'https://api.rss2json.com/v1/api.json?rss_url=';

const FEEDS = {
    world: {
        top: [
            'https://feeds.feedburner.com/ndtvnews-world-news', // NDTV World
            'https://www.thehindu.com/news/international/feeder/default.rss' // The Hindu World
        ],
        trending: [
            'https://feeds.feedburner.com/ndtvnews-trending-news' // NDTV Trending
        ],
        latest: [
            'https://feeds.feedburner.com/ndtvnews-latest' // NDTV Latest
        ]
    },
    india: {
        top: [
            'https://feeds.feedburner.com/ndtvnews-top-stories', // NDTV Top
            'https://www.thehindu.com/news/national/feeder/default.rss' // The Hindu National
        ],
        trending: [
            'https://feeds.feedburner.com/ndtvnews-trending-news'
        ],
        latest: [
            'https://feeds.feedburner.com/ndtvnews-india-news'
        ]
    },
    chennai: {
        top: [
            'https://www.thehindu.com/news/cities/chennai/feeder/default.rss', // The Hindu Chennai
            'https://www.dtnext.in/rss/chennai' // DT Next Chennai (Hypothetical/Common pattern, if fails we handle it)
        ],
        trending: [],
        latest: []
    },
    trichy: {
        top: [
            'https://www.dtnext.in/rss/trichy' // Hypothetical, often these specific city feeds are scarce
        ],
        trending: [],
        latest: []
    },
    local: { // Muscat / Oman
        top: [
            'https://www.omanobserver.om/rss', // Oman Observer
            'https://timesofoman.com/rss' // Times of Oman
        ],
        trending: [],
        latest: []
    },
    sports: {
        top: [
            'https://feeds.feedburner.com/ndtvnews-sports', // NDTV Sports
            'https://www.thehindu.com/sport/feeder/default.rss', // Hindu Sport
            'https://www.espncricinfo.com/rss/content/story/feeds/0.xml' // ESPN Cricinfo
        ],
        trending: [],
        latest: []
    }
};

/**
 * Fetch and mix stories for a section
 * @param {string} section - 'world', 'india', 'chennai', 'trichy', 'local', 'sports'
 * @returns {Promise<Array>} Mixed articles
 */
export async function fetchDirectRSS(section) {
    const config = FEEDS[section];
    if (!config) return [];

    console.log(`Fetching Direct RSS for ${section}...`);

    // Fetch all categories in parallel
    const [topDocs, trendingDocs, latestDocs] = await Promise.all([
        fetchCategory(config.top),
        fetchCategory(config.trending),
        fetchCategory(config.latest)
    ]);

    // Smart Mix Logic
    // 1. Identify duplicates (appearing in Top AND Trending) -> High Priority
    // 2. Result Order:
    //    - Overlap (Top & Trending)
    //    - Top Stories (unique)
    //    - Trending (unique)
    //    - Latest (filler)

    const allArticles = [];
    const seenTitles = new Set();

    // Helper to process and push unique
    const process = (list, tag) => {
        const unique = [];
        list.forEach(item => {
            // Simple fuzzy title match or exact url match
            const key = item.link || item.headline;
            if (!seenTitles.has(key)) {
                seenTitles.add(key);
                // Tagging for debug/UI if needed
                item.tags = [tag];
                unique.push(item);
            } else {
                // Find existing and add tag
                const existing = allArticles.find(a => (a.link === item.link));
                if (existing) existing.tags.push(tag);
            }
        });
        return unique;
    };

    // 1. Process Top
    const topUnique = process(topDocs, 'Top');
    allArticles.push(...topUnique);

    // 2. Process Trending (Checks for overlap with Top)
    const trendingUnique = process(trendingDocs, 'Trending');
    allArticles.push(...trendingUnique);

    // 3. Process Latest
    const latestUnique = process(latestDocs, 'Latest');
    allArticles.push(...latestUnique);

    // Re-Sort based on "Smart Logic"
    // Priority:
    // 1. Has both 'Top' and 'Trending'
    // 2. Has 'Top'
    // 3. Has 'Trending'
    // 4. 'Latest'

    return allArticles.sort((a, b) => {
        const scoreA = getScore(a.tags);
        const scoreB = getScore(b.tags);
        return scoreB - scoreA; // Descending score
    });
}

function getScore(tags) {
    let score = 0;
    if (tags.includes('Top')) score += 10;
    if (tags.includes('Trending')) score += 5;
    if (tags.includes('Latest')) score += 1;
    // Boost overlap
    if (tags.includes('Top') && tags.includes('Trending')) score += 20;
    return score;
}

/**
 * Fetch from a list of feed URLs and combine
 */
async function fetchCategory(urls) {
    if (!urls || urls.length === 0) return [];

    const results = await Promise.all(urls.map(async url => {
        try {
            const res = await fetch(RSS_PROXY + encodeURIComponent(url));
            if (!res.ok) return [];
            const data = await res.json();
            if (data.status !== 'ok') return [];

            return (data.items || []).map(item => ({
                headline: item.title,
                summary: cleanSummary(item.description),
                source: cleanSource(data.feed?.title || 'Unknown'),
                url: item.link,
                time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                confidence: 'HIGH', // Direct RSS is trusted
                sourceCount: 1,
                originalDate: new Date(item.pubDate)
            }));
        } catch (e) {
            console.warn(`Failed to fetch RSS: ${url}`, e);
            return [];
        }
    }));

    return results.flat();
}

function cleanSummary(html) {
    if (!html) return '';
    // Remove HTML tags
    const tmp = html.replace(/<[^>]*>?/gm, '');
    return tmp.length > 150 ? tmp.substring(0, 150) + '...' : tmp;
}

function cleanSource(title) {
    // NDTV News - Top Stories -> NDTV
    if (title.includes('NDTV')) return 'NDTV';
    if (title.includes('The Hindu')) return 'The Hindu';
    if (title.includes('Times of Oman')) return 'Times of Oman';
    if (title.includes('Oman Observer')) return 'Oman Observer';
    if (title.includes('Cricinfo')) return 'ESPN Cricinfo';
    return title;
}
