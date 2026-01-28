import React, { useState } from 'react';

/**
 * News Section Component
 * Displays news items for a specific region (World/India/Chennai/Trichy/Local/Entertainment)
 * Features:
 * - Clickable headlines open story URL
 * - Critics/public view shown where applicable
 * - Source count displayed
 */
function NewsSection({
    title,
    icon,
    colorClass,
    news = [],
    maxDisplay = 3,
    showExpand = true
}) {
    const [expanded, setExpanded] = useState(false);

    const displayCount = expanded ? news.length : Math.min(maxDisplay, news.length);
    const displayNews = news.slice(0, displayCount);
    const hasMore = news.length > maxDisplay;

    const getConfidenceClass = (confidence) => {
        switch (confidence?.toUpperCase()) {
            case 'HIGH': return 'news-item__confidence--high';
            case 'MEDIUM': return 'news-item__confidence--medium';
            case 'LOW': return 'news-item__confidence--low';
            default: return '';
        }
    };

    const handleStoryClick = (url, headline) => {
        // Prioritize direct URL if available
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
        } else if (headline) {
            // Fallback to Google Search if no URL
            const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(headline + ' news')}`;
            window.open(searchUrl, '_blank', 'noopener,noreferrer');
        }
    };

    if (news.length === 0) {
        return (
            <section className="news-section">
                <h2 className={`news-section__title ${colorClass}`}>
                    <span>{icon}</span>
                    {title}
                </h2>
                <div className="empty-state">
                    <div className="empty-state__icon">📭</div>
                    <p>No news available for this section</p>
                </div>
            </section>
        );
    }

    return (
        <section className="news-section">
            <h2 className={`news-section__title ${colorClass}`}>
                <span>{icon}</span>
                {title}
                <span style={{
                    fontSize: '0.75rem',
                    color: 'var(--text-muted)',
                    marginLeft: 'auto',
                    fontWeight: 'normal'
                }}>
                    {news.length} items
                </span>
            </h2>

            <div className="news-list">
                {displayNews.map((item, idx) => (
                    <article
                        key={item.id || idx}
                        className="news-item"
                        onClick={() => handleStoryClick(item.url, item.headline)}
                        style={{ cursor: 'pointer' }}
                    >
                        <h3 className="news-item__headline">
                            {item.headline}
                        </h3>

                        <div className="news-item__meta" style={{ marginTop: '4px' }}>
                            <span className="news-item__source">{item.source}</span>
                            <span>•</span>
                            <span>{item.time}</span>
                            {item.sourceCount && (
                                <>
                                    <span>•</span>
                                    <span>{item.sourceCount} sources</span>
                                </>
                            )}
                            <span>•</span>
                            <span className={`news-item__confidence ${getConfidenceClass(item.confidence)}`}>
                                {item.confidence}
                            </span>
                        </div>

                        {item.summary && (
                            <p style={{
                                fontSize: '0.9rem',
                                color: 'var(--text-secondary)',
                                marginTop: '8px',
                                lineHeight: '1.5'
                            }}>
                                {item.summary}
                            </p>
                        )}

                        {/* Critics/Public View */}
                        {item.criticsView && (
                            <div style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                                fontStyle: 'italic',
                                marginTop: '8px',
                                padding: '4px 8px',
                                background: 'rgba(88, 166, 255, 0.1)',
                                borderRadius: '4px',
                                borderLeft: '2px solid var(--accent-secondary)'
                            }}>
                                💬 {item.criticsView}
                            </div>
                        )}
                    </article>
                ))}
            </div>

            {showExpand && hasMore && (
                <div
                    className="news-more"
                    onClick={() => setExpanded(!expanded)}
                >
                    {expanded ? '▲ Show less' : `▼ +${news.length - maxDisplay} more...`}
                </div>
            )}
        </section>
    );
}

export default NewsSection;
