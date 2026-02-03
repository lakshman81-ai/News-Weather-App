import { buildTopicQuery } from '../utils/topicQueryBuilder.js';
import { fetchAndParseFeed } from './rssAggregator.js';
import { updateTopicLastFetched } from '../utils/storage.js';

/**
 * Fetches news articles for a specific followed topic
 */
export async function fetchTopicNews(topic) {
    try {
        // Build RSS URL from topic query
        const feedUrl = buildTopicQuery(topic.query || topic.name, topic.options || {});

        console.log(`[TopicService] Fetching news for "${topic.name}"`);

        // Reuse existing RSS fetching logic
        // We pass 'following' as the section, which allows the aggregator to
        // try auto-classifying (e.g., to 'world', 'business'), or fallback to 'following'
        const articles = await fetchAndParseFeed(feedUrl, 'following');

        // Update last fetched timestamp
        updateTopicLastFetched(topic.id);

        // Add topic metadata to each article
        const articlesWithTopic = articles.map(article => ({
            ...article,
            topicId: topic.id,
            topicName: topic.name,
            // Ensure we don't accidentally overwrite the classified section
            // if it was successfully detected as something specific (e.g. 'business')
            // but if it's generic, we know it belongs to this topic context.
            context: 'following'
        }));

        return articlesWithTopic;

    } catch (error) {
        console.error(`[TopicService] Failed to fetch topic "${topic.name}":`, error);
        return [];
    }
}

/**
 * Fetches news for all followed topics in parallel
 */
export async function fetchAllTopicsNews(followedTopics) {
    if (!followedTopics || followedTopics.length === 0) return {};

    const promises = followedTopics.map(topic => fetchTopicNews(topic));
    const results = await Promise.all(promises);

    // Combine and flatten results
    const allArticles = results.flat();

    // Group by topic ID
    const byTopic = {};
    allArticles.forEach(article => {
        if (article && article.topicId) {
            if (!byTopic[article.topicId]) {
                byTopic[article.topicId] = [];
            }
            byTopic[article.topicId].push(article);
        }
    });

    return byTopic;
}
