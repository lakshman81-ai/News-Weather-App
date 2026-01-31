import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import NewsSection from '../components/NewsSection';
import { getSettings, getTimeSinceRefresh } from '../utils/storage';
import { useNews } from '../context/NewsContext';

/**
 * Market Dashboard
 * Displays financial indices (Simulated/Placeholder) and Business News.
 */
function MarketPage({ isWidget = false }) {
    const [settings] = useState(() => getSettings());
    const { newsData, refreshNews } = useNews();
    const { market: marketSettings } = settings;

    // Pull-to-Refresh Logic (Local) - Only active if NOT a widget (full page)
    useEffect(() => {
        if (isWidget) return;

        let startY = 0;
        let isPulling = false;

        const handleTouchStart = (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        };
        const handleTouchEnd = (e) => {
            if (!isPulling) return;
            const endY = e.changedTouches[0].clientY;
            if (endY - startY > 150 && window.scrollY === 0) {
                refreshNews(['business', 'technology']);
            }
            isPulling = false;
        };
        document.addEventListener('touchstart', handleTouchStart);
        document.addEventListener('touchend', handleTouchEnd);
        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [refreshNews, isWidget]);

    // Simulated Market Data (Since no API key)
    // In future phase, replace these with fetch calls
    const marketIndices = [
        { name: 'SENSEX', value: '71,657.71', change: '+0.53%', up: true, key: 'showBSE' },
        { name: 'NIFTY 50', value: '21,618.70', change: '+0.47%', up: true, key: 'showNSE' },
        { name: 'GOLD (10g)', value: '₹62,450', change: '-0.12%', up: false, key: 'showGainers' }, // Reuse toggle
        { name: 'USD/INR', value: '₹83.15', change: '+0.02%', up: true, key: 'showMovers' }
    ];

    const filterOldNews = (newsArray, sectionName) => {
        if (!newsArray) {
            // console.log(`[MarketPage] No data for ${sectionName}`);
            return [];
        }
        // Match aggregator default of 72h to avoid double-filtering valid items
        const limitMs = (settings.freshnessLimitHours || 72) * 3600000;
        const now = Date.now();
        const filtered = newsArray.filter(item => (now - (item.publishedAt || 0)) < limitMs);
        return filtered;
    };

    // Market Indices (Only for full page, not widget)
    const indicesContent = (
        <>
            <div className="market-indices">
                {marketIndices.map((index, idx) => (
                    marketSettings[index.key] !== false && (
                        <div key={idx} className="market-index">
                            <div className="market-index__name">{index.name}</div>
                            <div className="market-index__value">{index.value}</div>
                            <div className={`market-index__change ${index.up ? 'market-index__change--up' : 'market-index__change--down'}`}>
                                <span>{index.up ? '▲' : '▼'}</span>
                                {index.change}
                            </div>
                        </div>
                    )
                ))}
            </div>
            <div style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
                marginBottom: 'var(--spacing-lg)',
                fontStyle: 'italic'
            }}>
                * Indices delayed by 15 mins (Simulated for Demo)
            </div>
        </>
    );

    // News Sections (Shared between widget and full page)
    const newsContent = (
        <>
            <NewsSection
                title="Business & Economy"
                icon="💼"
                colorClass="news-section__title--india"
                news={filterOldNews(newsData.business, 'Business')}
                maxDisplay={isWidget ? 4 : 10}
            />
            <NewsSection
                title="Tech & Startups"
                icon="💻"
                colorClass="news-section__title--world"
                news={filterOldNews(newsData.technology, 'Technology')}
                maxDisplay={isWidget ? 3 : 6}
            />
            <NewsSection
                title="Social Trends"
                icon="👥"
                colorClass="news-section__title--social"
                news={filterOldNews(newsData.social, 'Social')}
                maxDisplay={isWidget ? 3 : 8}
            />
        </>
    );

    if (isWidget) {
        // Widget mode: Only news sections, NO indices
        return newsContent;
    }

    return (
        <div className="page-container">
            <Header title="Market/Tech/Social" icon="📊" />
            <main className="main-content">
                {indicesContent}
                {newsContent}
            </main>
        </div>
    );
}

export default MarketPage;
