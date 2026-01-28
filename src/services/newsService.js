/**
 * News Service
 * Fetches data from NewsData.io
 * NO MOCK DATA - Returns empty array or throws error on failure
 */

const BASE_URL = 'https://newsdata.io/api/1/news';

/**
 * Fetch news for a specific category/query
 * @param {string} query - Search query (e.g., "India", "Chennai")
 * @param {string} apiKey - User provided API Key
 * @returns {Promise<Array>} Array of news items
 */
export async function fetchNews(query, apiKey) {
    if (!apiKey) {
        throw new Error('API Key missing');
    }

    try {
        const url = `${BASE_URL}?apikey=${apiKey}&q=${encodeURIComponent(query)}&language=en`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`News API Error: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.status !== 'success') {
            throw new Error('News API returned error status');
        }

        return (data.results || []).map(item => ({
            id: item.article_id,
            headline: item.title,
            summary: item.description ? item.description.substring(0, 150) + '...' : 'No summary available.',
            source: item.source_id,
            url: item.link,
            time: new Date(item.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            confidence: getConfidence(item.source_priority), // Heuristic
            sourceCount: 1 // API doesn't aggregate, so default to 1
        }));

    } catch (error) {
        console.error(`Error fetching news for ${query}:`, error);
        throw error;
    }
}

/**
 * Heuristic to assign confidence based on source priority (if available) or random default for now
 * NewsData.io doesn't strictly give "confidence", but we can infer from domain rank if we had it.
 * For now, we'll mark known major sources as High, others as Medium.
 */
function getConfidence(priority) {
    // This is a placeholder logic. Real logic depends on if the API sends meaningful priority data.
    // Assuming the API might sort by relevance, usually top results are decent.
    return 'MEDIUM';
}
