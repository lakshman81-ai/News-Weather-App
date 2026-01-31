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

    const getTimeAgo = (timestamp) => {
        if (!timestamp) return '';
        const seconds = Math.floor((Date.now() - timestamp) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + "y ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + "mo ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + "d ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + "h ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + "m ago";
        return "Just now";
    };

    const handleStoryClick = (url) => {
        if (url) {
            window.open(url, '_blank', 'noopener,noreferrer');
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
                <span style={{ opacity: 0.6, fontSize: '0.9em', marginLeft: '6px' }}>({news.length})</span>

                {/* Data Age Badge */}
                {news.length > 0 && news[0].fetchedAt && (
                    <span style={{
                        fontSize: '0.65rem',
                        marginLeft: 'auto',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: (Date.now() - news[0].fetchedAt) < 3600000 ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 165, 0, 0.2)',
                        color: (Date.now() - news[0].fetchedAt) < 3600000 ? '#4caf50' : '#ffa726',
                        border: '1px solid currentColor',
                        fontWeight: 'normal'
                    }}>
                        {(Date.now() - news[0].fetchedAt) < 300000 ? 'LIVE' : getTimeAgo(news[0].fetchedAt)}
                    </span>
                )}
            </h2>

            <div className="news-list">
                {displayNews.map((item, idx) => (
                    <article
                        key={item.id || idx}
                        className="news-item"
                        onClick={() => handleStoryClick(item.url)}
                        style={{ cursor: item.url ? 'pointer' : 'default' }}
                    >
                        <h3 className="news-item__headline">
                            • {item.headline}
                            {item.url && (
                                <span style={{
                                    fontSize: '0.7rem',
                                    marginLeft: '8px',
                                    color: 'var(--accent-secondary)'
                                }}>↗</span>
                            )}
                        </h3>
                        {/* Summary: Always show if available (3-4 lines clamped via CSS) */}
                        {item.summary && (
                            <p className="news-item__summary">
                                {item.summary}
                            </p>
                        )}

                        {/* Critics/Public View */}
                        {item.criticsView && (
                            <div className="news-item__critics">
                                <span>💬</span>
                                <div>
                                    <strong style={{ color: 'var(--accent-secondary)', display: 'block', marginBottom: '2px' }}>Critics Take:</strong>
                                    {item.criticsView}
                                </div>
                            </div>
                        )}
                        <div className="news-item__meta">
                            <span className="news-item__source">{item.source}</span>
                            <span>|</span>
                            <span>{getTimeAgo(item.publishedAt) || item.time}</span>
                            {item.sourceCount && (
                                <>
                                    <span>|</span>
                                    <span>#{item.sourceCount} Sources</span>
                                </>
                            )}
                            <span>|</span>
                            <span className={`news-item__confidence ${getConfidenceClass(item.confidence)}`}>
                                {item.confidence}
                            </span>
                        </div>
                    </article>
                ))}
            </div>

            {showExpand && hasMore && (
                <div
                    className="news-more"
                    onClick={() => setExpanded(!expanded)}
                >
                    <span style={{ fontSize: '1.2rem' }}>{expanded ? '▲' : '▼'}</span>
                    <span>{expanded ? 'Collapse' : `See ${news.length - maxDisplay} more stories`}</span>
                </div>
            )}
        </section>
    );
}

export default NewsSection;
