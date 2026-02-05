import { geminiService } from '../geminiService.js';
import { getSettings } from '../../utils/storage.js';
import { getCachedEvaluation, setCachedEvaluation } from './aiCache.js';

/**
 * Evaluates a list of items using AI (Gemini).
 * Uses caching and batching.
 *
 * @param {Array} items - List of NormalizedFeedItem
 * @returns {Promise<Array>} - Items with 'aiScore' and 'aiReason' attached
 */
export async function evaluateWithAI(items) {
    const settings = getSettings();
    const apiKey = settings.geminiKey;

    if (!apiKey) {
        // AI not configured, return items as is (or with neutral score)
        return items.map(item => ({
            ...item,
            aiScore: 1.0,
            aiReason: null
        }));
    }

    const itemsToEvaluate = [];
    const results = new Map(); // id -> { score, reason }

    // 1. Check Cache
    for (const item of items) {
        const cached = getCachedEvaluation(item);
        if (cached) {
            results.set(item.id, cached);
        } else {
            itemsToEvaluate.push(item);
        }
    }

    // 2. Call AI for misses (Batching)
    if (itemsToEvaluate.length > 0) {
        console.log(`[AI Evaluator] evaluating ${itemsToEvaluate.length} items...`);
        try {
            // We might need to split into chunks if > 10
            const CHUNK_SIZE = 10;
            for (let i = 0; i < itemsToEvaluate.length; i += CHUNK_SIZE) {
                const chunk = itemsToEvaluate.slice(i, i + CHUNK_SIZE);
                const evaluations = await geminiService.evaluateImportance(chunk, apiKey);

                // Process results
                for (const item of chunk) {
                    const evalData = evaluations[item.id];
                    if (evalData) {
                        // Normalize 0-100 to 0.5-1.5 multiplier?
                        // Or just store the raw score and let the aggregator decide.
                        // Let's store raw score (0-100) and convert to multiplier later.

                        // Convert 0-100 to 0.5 - 2.0 multiplier
                        // 0 -> 0.5
                        // 50 -> 1.0
                        // 100 -> 2.0
                        // Formula: 0.5 + (score / 100) * 1.5 ??
                        // 0 => 0.5
                        // 50 => 1.25
                        // 100 => 2.0
                        const multiplier = 0.5 + (evalData.score / 100) * 1.5;

                        const result = {
                            score: multiplier,
                            rawScore: evalData.score,
                            reason: evalData.reason
                        };

                        results.set(item.id, result);
                        setCachedEvaluation(item, result);
                    } else {
                        // AI failed for this item or didn't return it
                        results.set(item.id, { score: 1.0, reason: null });
                    }
                }
            }
        } catch (e) {
            console.error('[AI Evaluator] Batch failed', e);
            // Fallback for failed items
            for (const item of itemsToEvaluate) {
                if (!results.has(item.id)) {
                    results.set(item.id, { score: 1.0, reason: null });
                }
            }
        }
    }

    // 3. Merge results
    return items.map(item => {
        const evaluation = results.get(item.id) || { score: 1.0, reason: null };
        return {
            ...item,
            aiScore: evaluation.score,
            aiReason: evaluation.reason
        };
    });
}
