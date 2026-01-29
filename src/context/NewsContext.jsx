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

         const allSections = ['world', 'india', 'chennai', 'trichy', 'local', 'social', 'entertainment'];
         const sectionsToFetch = specificSections || allSections;

         const newResults = {};
         const newErrors = {};

         await Promise.all(sectionsToFetch.map(async (key) => {
            if (settings.sections[key]?.enabled) {
                try {
                    const count = settings.sections[key]?.count || 10;
                    const articles = await fetchSectionNews(key, count, settings.newsSources);
                    if (articles && articles.length > 0) {
                        newResults[key] = articles;
                    }
                } catch (err) {
                    console.error(`News Context: Error fetching ${key}`, err);
                    newErrors[key] = 'Failed to load news.';
                }
            }
         }));

         setNewsData(prev => ({ ...prev, ...newResults }));
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
