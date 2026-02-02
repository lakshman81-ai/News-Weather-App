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

            const newResults = {};
            const newErrors = {};

            await Promise.all(sectionsToFetch.map(async (key) => {
                if (settings.sections[key]?.enabled) {
                    try {
                        const count = settings.sections[key]?.count || 10;

                        console.log(`[NewsContext] Fetching ${key}...`);
                        const articles = await fetchSectionNews(
                            key,
                            count + 5,
                            settings.newsSources
                        );

                        if (articles && Array.isArray(articles)) {
                            if (articles.length > 0) {
                                newResults[key] = articles;
                                console.log(`[NewsContext] ✅ ${key}: Got ${articles.length} articles`);
                            } else {
                                newResults[key] = [];
                                console.warn(`[NewsContext] ⚠️ ${key}: No articles found (may be empty feed)`);
                            }
                        } else {
                            throw new Error(
                                `Invalid response format. Got: ${typeof articles}. Expected: Array`
                            );
                        }

                    } catch (err) {
                        console.error(`[NewsContext] ❌ Error fetching ${key}:`, {
                            errorMessage: err.message,
                            errorStack: err.stack,
                            errorType: err.name,
                            timestamp: new Date().toISOString()
                        });

                        newErrors[key] = err.message || 'Failed to load news.';
                        newResults[key] = []; // Fallback
                    }
                }
            }));

            setNewsData(prev => ({ ...prev, ...newResults }));
            setErrors(prev => ({ ...prev, ...newErrors }));
            setLastFetch(Date.now());

            // Breaking News
            const allFetchedArticles = Object.values(newResults).flat();
            if (allFetchedArticles.length > 0) {
                const breaking = allFetchedArticles
                    .filter(item => item.isBreaking || (item.breakingScore && item.breakingScore > 1.5))
                    .sort((a, b) => (b.breakingScore || 0) - (a.breakingScore || 0))
                    .slice(0, 3);

                setBreakingNews(breaking);
                console.log(`[NewsContext] ✅ Breaking news: ${breaking.length} items`);
            }

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
