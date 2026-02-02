import React, { useMemo, useState } from 'react';
import Header from '../components/Header';
import NewsSection from '../components/NewsSection';
import SectionNavigator from '../components/SectionNavigator';
import { useNews } from '../context/NewsContext';
import { useSettings } from '../context/SettingsContext';

/**
 * Tech & Social Page
 * Social Trends Distribution:
 * - 30% World
 * - 30% India
 * - 20% Tamil Nadu
 * - 20% Muscat/Local
 */
function TechSocialPage() {
    const { newsData, refreshNews, loading } = useNews();
    const { settings } = useSettings();
    const [activeEntTab, setActiveEntTab] = useState('tamil');

    const filterOldNews = React.useCallback((newsArray) => {
        if (!newsArray) return [];
        const limitMs = (settings.freshnessLimitHours || 72) * 3600000;
        const now = Date.now();
        return newsArray.filter(item => (now - (item.publishedAt || 0)) < limitMs);
    }, [settings.freshnessLimitHours]);

    // ============================================
    // SOCIAL TRENDS DISTRIBUTION LOGIC
    // 30% World, 30% India, 20% TN, 20% Muscat
    // ============================================

    const socialTrends = useMemo(() => {
        // Keywords for each region
        const REGION_KEYWORDS = {
            world: ['global', 'world', 'international', 'usa', 'europe', 'uk', 'china',
                'twitter', 'x.com', 'meta', 'tiktok', 'instagram', 'viral'],
            india: ['india', 'indian', 'bollywood', 'cricket', 'modi', 'delhi',
                'mumbai', 'bangalore', 'hyderabad', 'ipl', 'bcci'],
            tamilnadu: ['chennai', 'tamil', 'tamilnadu', 'kollywood', 'rajini',
                'kamal', 'vijay', 'trichy', 'coimbatore', 'madurai', 'tn'],
            muscat: ['muscat', 'oman', 'gulf', 'gcc', 'uae', 'dubai', 'arab',
                'middle east', 'expat', 'omani']
        };

        // Categorize social news by region
        const categorizeByRegion = (newsItem) => {
            const text = (newsItem.title + ' ' + (newsItem.summary || '')).toLowerCase();

            // Check Tamil Nadu first (most specific)
            if (REGION_KEYWORDS.tamilnadu.some(kw => text.includes(kw))) {
                return 'tamilnadu';
            }
            // Check Muscat/Oman
            if (REGION_KEYWORDS.muscat.some(kw => text.includes(kw))) {
                return 'muscat';
            }
            // Check India
            if (REGION_KEYWORDS.india.some(kw => text.includes(kw))) {
                return 'india';
            }
            // Default to World
            return 'world';
        };

        // Get all social news
        const allSocial = filterOldNews(newsData.social || []);

        // Also pull from world, india, chennai sections for social trends
        const worldNews = filterOldNews(newsData.world || []);
        const indiaNews = filterOldNews(newsData.india || []);
        const chennaiNews = filterOldNews(newsData.chennai || []);
        const localNews = filterOldNews(newsData.local || []); // Muscat/Oman

        // Categorize all news
        const regionBuckets = {
            world: [],
            india: [],
            tamilnadu: [],
            muscat: []
        };

        // Add social news to appropriate buckets
        allSocial.forEach(item => {
            const region = categorizeByRegion(item);
            regionBuckets[region].push({ ...item, source: 'social' });
        });

        // Add world news to world bucket (filter for social trends)
        worldNews
            .filter(item => item.title?.toLowerCase().includes('trend') ||
                item.title?.toLowerCase().includes('viral') ||
                item.title?.toLowerCase().includes('social'))
            .forEach(item => regionBuckets.world.push({ ...item, source: 'world' }));

        // Add India news to india bucket
        indiaNews
            .filter(item => item.title?.toLowerCase().includes('trend') ||
                item.title?.toLowerCase().includes('viral') ||
                item.title?.toLowerCase().includes('social'))
            .forEach(item => regionBuckets.india.push({ ...item, source: 'india' }));

        // Add Chennai news to TN bucket
        chennaiNews.forEach(item => {
            regionBuckets.tamilnadu.push({ ...item, source: 'chennai' });
        });

        // Add Local (Muscat) news to Muscat bucket
        localNews.forEach(item => {
            regionBuckets.muscat.push({ ...item, source: 'local' });
        });

        // Get target counts from settings (defaults if missing)
        const distribution = {
            world: settings.socialTrends?.worldCount ?? 8,
            india: settings.socialTrends?.indiaCount ?? 8,
            tamilnadu: settings.socialTrends?.tamilnaduCount ?? 5,
            muscat: settings.socialTrends?.muscatCount ?? 4
        };

        // Build final mixed array
        const result = [];

        // Add from each bucket according to counts
        Object.entries(distribution).forEach(([region, count]) => {
            const bucket = regionBuckets[region];
            // Sort bucket by date if possible
            bucket.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

            const toAdd = bucket.slice(0, count);
            toAdd.forEach(item => {
                result.push({
                    ...item,
                    region: region,
                    regionLabel: region === 'world' ? '🌍 World' :
                        region === 'india' ? '🇮🇳 India' :
                            region === 'tamilnadu' ? '🏛️ Tamil Nadu' :
                                '🏝️ Muscat'
                });
            });
        });

        // Sort by publishedAt (newest first)
        result.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));

        return result;
    }, [newsData, settings.freshnessLimitHours, settings.socialTrends, filterOldNews, settings.sections?.social?.count]);

    const handleRefresh = () => {
        refreshNews(['technology', 'social', 'world', 'india', 'chennai', 'local']);
    };

    // Navigation Sections
    const navSections = [
        { id: 'entertainment', icon: '🎬', label: 'Entertainment' },
        { id: 'social-trends', icon: '👥', label: 'Social Trends' },
        { id: 'tech-news', icon: '🚀', label: 'Tech & Startups' },
        { id: 'ai-innovation', icon: '🤖', label: 'AI & Innovation' }
    ];

    return (
        <div className="page-container">
            <Header
                title="Buzz Hub"
                icon="🎭"
                onRefresh={handleRefresh}
                loading={loading}
            />
            <main className="main-content">

                {/* Entertainment Hub */}
                <section id="entertainment" className="news-section entertainment-hub">
                    <h2 className="news-section__title news-section__title--entertainment">
                        <span>🎬</span> Entertainment
                    </h2>

                    <div className="entertainment-tabs">
                        <button
                            className={`ent-tab ${activeEntTab === 'tamil' ? 'ent-tab--active' : ''}`}
                            onClick={() => setActiveEntTab('tamil')}
                        >
                            🎭 Tamil
                        </button>
                        <button
                            className={`ent-tab ${activeEntTab === 'hindi' ? 'ent-tab--active' : ''}`}
                            onClick={() => setActiveEntTab('hindi')}
                        >
                            🎪 Hindi
                        </button>
                        <button
                            className={`ent-tab ${activeEntTab === 'hollywood' ? 'ent-tab--active' : ''}`}
                            onClick={() => setActiveEntTab('hollywood')}
                        >
                            🎬 Hollywood
                        </button>
                        <button
                            className={`ent-tab ${activeEntTab === 'ott' ? 'ent-tab--active' : ''}`}
                            onClick={() => setActiveEntTab('ott')}
                        >
                            📺 OTT
                        </button>
                    </div>

                    <div className="entertainment-content">
                        <NewsSection
                            title={activeEntTab === 'tamil' ? 'Tamil Cinema' :
                                activeEntTab === 'hindi' ? 'Hindi Cinema' :
                                    activeEntTab === 'hollywood' ? 'Hollywood' : 'OTT & Streaming'}
                            icon={activeEntTab === 'tamil' ? '🎭' :
                                activeEntTab === 'hindi' ? '🎪' :
                                    activeEntTab === 'hollywood' ? '🎬' : '📺'}
                            news={filterOldNews(newsData.entertainment || [])}
                            maxDisplay={
                                activeEntTab === 'tamil' ? (settings.entertainment?.tamilCount ?? 5) :
                                    activeEntTab === 'hindi' ? (settings.entertainment?.hindiCount ?? 5) :
                                        activeEntTab === 'hollywood' ? (settings.entertainment?.hollywoodCount ?? 3) :
                                            (settings.entertainment?.ottCount ?? 2)
                            }
                            hideTitle
                        />
                    </div>
                </section>

                {/* Social Trends with Distribution (Moved to Top) */}
                <section id="social-trends" className="news-section">
                    <h2 className="news-section__title news-section__title--social">
                        <span>👥</span> Social Trends
                    </h2>

                    <div className="news-list">
                        {socialTrends.map((item, idx) => (
                            <article key={idx} className="news-item">
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: '4px'
                                }}>
                                    <span className="news-item__region-badge" style={{
                                        fontSize: '0.65rem',
                                        color: 'var(--accent-secondary)',
                                        fontWeight: 600,
                                        textTransform: 'uppercase'
                                    }}>
                                        {item.regionLabel}
                                    </span>
                                    {item.region === 'tamilnadu' && <span style={{ fontSize: '0.8rem' }}>🏛️</span>}
                                    {item.region === 'muscat' && <span style={{ fontSize: '0.8rem' }}>🏝️</span>}
                                </div>

                                <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="news-item__headline"
                                >
                                    {item.title}
                                </a>

                                {item.summary && (
                                    <p className="news-item__summary">{item.summary}</p>
                                )}

                                <div className="news-item__meta">
                                    <span className="news-item__source">{item.source}</span>
                                    <span>{item.timeAgo || 'Recently'}</span>
                                </div>
                            </article>
                        ))}

                        {socialTrends.length === 0 && (
                            <div className="empty-state">
                                <p>No social trends available</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Tech Section */}
                <NewsSection
                    id="tech-news"
                    title="Tech & Startups"
                    icon="🚀"
                    colorClass="news-section__title--world"
                    news={filterOldNews(newsData.technology)}
                    maxDisplay={settings.sections?.technology?.count || 5} // Dynamic
                />

                {/* AI & Innovation */}
                <NewsSection
                    id="ai-innovation"
                    title="AI & Innovation"
                    icon="🤖"
                    colorClass="news-section__title--entertainment"
                    news={filterOldNews(newsData.technology?.filter(
                        item => item.title?.toLowerCase().includes('ai') ||
                            item.title?.toLowerCase().includes('innovation') ||
                            item.title?.toLowerCase().includes('machine learning') ||
                            item.title?.toLowerCase().includes('chatgpt') ||
                            item.title?.toLowerCase().includes('gemini')
                    ))}
                    maxDisplay={6}
                />
            </main>

            {/* Floating Section Navigator */}
            <SectionNavigator sections={navSections} />
        </div>
    );
}

export default TechSocialPage;
