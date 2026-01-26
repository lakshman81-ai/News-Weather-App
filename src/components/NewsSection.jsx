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
                        {item.summary && (
                            <p style={{
                                fontSize: '0.85rem',
                                color: 'var(--text-secondary)',
                                marginBottom: 'var(--spacing-sm)',
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
                                marginBottom: 'var(--spacing-sm)',
                                padding: 'var(--spacing-xs) var(--spacing-sm)',
                                background: 'rgba(88, 166, 255, 0.1)',
                                borderRadius: 'var(--radius-sm)',
                                borderLeft: '2px solid var(--accent-secondary)'
                            }}>
                                💬 {item.criticsView}
                            </div>
                        )}
                        <div className="news-item__meta">
                            <span className="news-item__source">{item.source}</span>
                            <span>|</span>
                            <span>{item.time}</span>
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
                    {expanded ? '▲ Show less' : `▼ +${news.length - maxDisplay} more...`}
                </div>
            )}
        </section>
    );
}

export default NewsSection;
