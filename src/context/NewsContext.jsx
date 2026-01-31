import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchSectionNews } from '../services/rssAggregator';
import { getSettings } from '../utils/storage';

const NewsContext = createContext();

export function NewsProvider({ children }) {
    const [newsData, setNewsData] = useState({});
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});

    const refreshNews = useCallback(async (specificSections = null) => {
        setLoading(true);
        const settings = getSettings();
        if (!settings) { setLoading(false); return; }

        const allSections = ['world', 'india', 'chennai', 'trichy', 'local', 'social', 'entertainment', 'business', 'technology'];
        const sectionsToFetch = specificSections || allSections;

        const newResults = {};
        const newErrors = {};

        await Promise.all(sectionsToFetch.map(async (key) => {
            if (settings.sections[key]?.enabled) {
                try {
                    const count = settings.sections[key]?.count || 10;
                    // Fetch more than needed to ensure "See More" triangle appears
                    // rankAndFilter in rssAggregator now uses settings.freshnessLimitHours correctly
                    const articles = await fetchSectionNews(key, count + 5, settings.newsSources);

                    if (articles && articles.length > 0) {
                        newResults[key] = articles;
                    } else if (settings.strictFreshness) {
                        // Fail-Closed: If strict freshness is on and no fresh articles are found,
                        // explicitly clear the section to remove any old/stale data from the UI.
                        newResults[key] = [];
                    }
                } catch (err) {
                    console.error(`News Context: Error fetching ${key}`, err);
                    newErrors[key] = 'Failed to load news.';
                }
            }
        }));

        setNewsData(prev => {
            // If strictly fresh, we might want to drop sections that aren't in newResults but were in prev?
            // For now, we just merge updates. If fetchSectionNews returns empty because of filter, 
            // the UI will show empty state.
            return { ...prev, ...newResults };
        });
        setErrors(prev => ({ ...prev, ...newErrors }));
        setLoading(false);
    }, []);

    useEffect(() => {
        refreshNews();
    }, [refreshNews]);

    return (
        <NewsContext.Provider value={{ newsData, loading, errors, refreshNews }}>
            {children}
        </NewsContext.Provider>
    );
}

export function useNews() {
    return useContext(NewsContext);
}
