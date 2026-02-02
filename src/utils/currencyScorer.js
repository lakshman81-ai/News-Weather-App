import { getSettings } from './storage.js';

/**
 * Calculates currency score based on user's followed topics.
 */
export function calculateCurrencyScore(title, keywords = []) {
    const settings = getSettings();
    const followedTopics = settings.followedTopics || [];

    // If no topics followed, no boost
    if (followedTopics.length === 0) return 1.0;

    const text = title.toLowerCase();

    // Check match
    const hasMatch = followedTopics.some(topic =>
        text.includes(topic.toLowerCase()) ||
        (keywords && keywords.some(k => k.toLowerCase().includes(topic.toLowerCase())))
    );

    return hasMatch ? 1.5 : 1.0;
}
