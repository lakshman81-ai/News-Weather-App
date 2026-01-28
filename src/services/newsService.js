/**
 * News Service
 * Fetches data from NewsData.io (Priority) or RSS Fallback (Basic Data)
 */

const BASE_URL = 'https://newsdata.io/api/1/news';

export async function fetchNews(query, keys = {}) {
    // Handle both old signature (query, apiKeyString) and new (query, keyObject)
    let apiKey = '';
    let ddgApiKey = '';

    if (typeof keys === 'string') {
        apiKey = keys;
    } else {
        apiKey = keys.newsApiKey;
        ddgApiKey = keys.ddgApiKey; // Used as flag for DDG preference/enablement
    }

    // 1. Try DuckDuckGo "Crawler" style (Bing RSS Proxy) if requested/enabled
    if (ddgApiKey && ddgApiKey.length > 0) {
        try {
            console.log('Fetching via DDG/Crawler proxy...');
            const results = await fetchDDGNews(query);
            if (results && results.length > 0) return results;
        } catch (error) { void error;
            console.warn('DDG Fetch failed, trying next option.', error);
        }
    }

    // 2. Try NewsData.io API (High Priority if key exists)
    if (apiKey) {
        try {
            const url = `${BASE_URL}?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
            const response = await fetch(url);

            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.results?.length > 0) {
                    return (data.results || []).map(item => ({
                        id: item.article_id,
                        headline: item.title,
                        summary: item.description ? item.description.substring(0, 150) + '...' : 'No summary available.',
                        source: item.source_id,
                        url: item.link,
                        time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        confidence: 'HIGH',
                        sourceCount: 1
                    }));
                }
            }
        } catch (error) { void error;
            console.warn(`API fetch failed for ${query}, falling back to RSS.`);
        }
    }

    // 3. Fallback to Google News RSS (Basic Data / "Crawler Data")
    // This works without any API key.
    return fetchRSSNews(query);
}

/**
 * Fetch "Basic Data" via Google News RSS + rss2json
 */
async function fetchRSSNews(query) {
    try {
        const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('RSS Proxy failed');

        const data = await response.json();
        if (data.status !== 'ok') throw new Error('RSS Parse failed');

        return (data.items || []).slice(0, 5).map((item, idx) => ({
            id: `rss-${idx}`,
            headline: item.title,
            summary: 'Latest coverage from Google News', // RSS description is often just html snippet
            source: item.author || 'Google News',
            url: item.link,
            time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confidence: 'MEDIUM',
            sourceCount: 1
        }));
    } catch (error) { void error;
        console.error(`RSS Fetch failed for ${query}`, error);
        return [];
    }
}

/**
 * Fetch "Crawler" Data via Bing RSS (Proxy for DDG-style results)
 */
async function fetchDDGNews(query) {
    try {
        const rssUrl = `https://www.bing.com/news/search?q=${encodeURIComponent(query)}&format=rss`;
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error('DDG/Bing RSS Proxy failed');

        const data = await response.json();
        return (data.items || []).map((item, idx) => ({
            id: `ddg-${idx}`,
            headline: item.title,
            summary: item.description || 'Web Result',
            source: item.author || 'DuckDuckGo/Bing',
            url: item.link,
            time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confidence: 'MEDIUM',
            sourceCount: 1
        }));
    } catch (error) { void error;
        throw new Error('DDG Fetch Failed');
    }
}
