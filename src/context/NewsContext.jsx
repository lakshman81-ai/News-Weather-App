import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSectionNews, clearNewsCache } from '../services/rssAggregator';
import { getSettings } from '../utils/storage';

const NewsContext = createContext();

export function NewsProvider({ children }) {
    const [newsData, setNewsData] = useState({});
    const [breakingNews, setBreakingNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const [lastFetch, setLastFetch] = useState(0);
    const [settingsHash, setSettingsHash] = useState(''); // NEW - Phase 6: Track settings changes


    const refreshNews = useCallback(async (specificSections = null) => {
        setLoading(true);
        const fetchStartTime = Date.now();

        try {
            const settings = getSettings();
            if (!settings) {
                console.error('[NewsContext] Settings not available');
                return;
            }

            const allSections = ['world', 'india', 'chennai', 'trichy', 'local', 'social', 'entertainment', 'business', 'technology'];
            const sectionsToFetch = specificSections || allSections;

            // Prioritize Sections: Main Page (High) -> Others (Low)
            const highPriority = sectionsToFetch.filter(s => ['world', 'india', 'chennai', 'trichy'].includes(s));
            const lowPriority = sectionsToFetch.filter(s => !['world', 'india', 'chennai', 'trichy'].includes(s));

            const batches = [highPriority, lowPriority].filter(b => b.length > 0);

            let allCollectedResults = {};

            for (const batch of batches) {
                const batchResults = {};
                const batchErrors = {};

                console.log(`[NewsContext] Fetching batch: ${batch.join(', ')}`);

                await Promise.all(batch.map(async (key) => {
                    if (settings.sections[key]?.enabled) {
                        try {
                            const count = settings.sections[key]?.count || 10;
                            const articles = await fetchSectionNews(key, count + 5, settings.newsSources);

                            if (articles && Array.isArray(articles)) {
                                batchResults[key] = articles;
                            } else {
                                batchResults[key] = [];
                            }
                        } catch (err) {
                            console.error(`[NewsContext] Error ${key}:`, err);
                            batchErrors[key] = err.message;
                            batchResults[key] = [];
                        }
                    }
                }));

                // Incremental Update Logic
                // We need to redistribute the *accumulated* results to ensure classification moves items correctly
                // across sections that might be in different batches.
                // However, doing full redistribution on partial data is fine.

                Object.assign(allCollectedResults, batchResults);

                // --- REDISTRIBUTION PASS ---
                const allFetched = Object.values(allCollectedResults).flat();
                const redistributed = {};

                // Initialize buckets for all fetched keys to ensure clearing
                Object.keys(allCollectedResults).forEach(key => redistributed[key] = []);

                allFetched.forEach(item => {
                    const section = item.section || 'uncategorized';
                    if (!redistributed[section]) redistributed[section] = [];
                    redistributed[section].push(item);
                });

                Object.keys(redistributed).forEach(key => {
                    redistributed[key].sort((a, b) => (b.impactScore || 0) - (a.impactScore || 0));
                });

                setNewsData(prev => ({ ...prev, ...redistributed }));
                setErrors(prev => ({ ...prev, ...batchErrors }));

                // Breaking News Update (Incremental)
                const breaking = allFetched
                    .filter(item => item.isBreaking || (item.breakingScore && item.breakingScore > 1.5))
                    .sort((a, b) => (b.breakingScore || 0) - (a.breakingScore || 0))
                    .slice(0, 3);
                setBreakingNews(breaking);
            }

            setLastFetch(Date.now());

            const fetchDuration = Date.now() - fetchStartTime;
            console.log(`[NewsContext] ✅ Refresh complete in ${fetchDuration}ms`);

        } catch (error) {
            console.error("[NewsContext] ❌ Fatal refresh error:", {
                errorMessage: error.message,
                errorStack: error.stack,
                timestamp: new Date().toISOString()
            });
        } finally {
            setLoading(false);
        }
    }, []);

    // Watch for settings changes and invalidate cache (Phase 6)
    useEffect(() => {
        const settings = getSettings();
        const newHash = JSON.stringify({
            sources: settings.newsSources,
            freshness: settings.freshnessLimitHours,
            enableCache: settings.enableCache
        });

        if (settingsHash && settingsHash !== newHash) {
            console.log('[NewsContext] ⚙️ Settings changed - clearing cache and refreshing');
            clearNewsCache();
            refreshNews();
        }
        setSettingsHash(newHash);
    }, [refreshNews, settingsHash]); // Only run when hash changes

    useEffect(() => {
        console.log('[NewsContext] Mounting - Initial fetch');
        refreshNews();

        const interval = setInterval(() => {
            console.log('[NewsContext] Auto-refresh (5min cycle)');
            refreshNews();
        }, 5 * 60 * 1000);

        return () => {
            clearInterval(interval);
            console.log('[NewsContext] Unmounting');
        };
    }, [refreshNews]);

    return (
        <NewsContext.Provider value={{
            newsData,
            loading,
            errors,
            refreshNews,
            breakingNews,
            lastFetch
        }}>
            {children}
        </NewsContext.Provider>
    );
}

export function useNews() {
    return useContext(NewsContext);
}
