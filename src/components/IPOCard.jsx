import React, { useState } from 'react';

/**
 * IPO Listings Card
 * Shows upcoming, live, and recent IPOs
 */
function IPOCard({ ipoData }) {
    const [activeTab, setActiveTab] = useState('upcoming');

    if (!ipoData) {
        return (
            <div className="ipo-card ipo-card--empty">
                <div className="ipo-card__header">
                    <span>🎯</span> IPO Tracker
                </div>
                <p>IPO data unavailable</p>
            </div>
        );
    }

    const tabs = [
        { key: 'upcoming', label: 'Upcoming', icon: '📅' },
        { key: 'live', label: 'Live', icon: '🔴' },
        { key: 'recent', label: 'Recent', icon: '✅' }
    ];

    const currentList = ipoData[activeTab] || [];

    return (
        <div className="ipo-card">
            <div className="ipo-card__header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>🎯</span> IPO Tracker
                </div>
                {ipoData.isFallback && (
                    <span className="ipo-card__fallback-badge">Demo Data</span>
                )}
            </div>

            <div className="ipo-card__tabs">
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        className={`ipo-tab ${activeTab === tab.key ? 'ipo-tab--active' : ''}`}
                        onClick={() => setActiveTab(tab.key)}
                    >
                        {tab.icon} {tab.label}
                        <span className="ipo-tab__count">{ipoData[tab.key]?.length || 0}</span>
                    </button>
                ))}
            </div>

            <div className="ipo-card__list">
                {currentList.length === 0 ? (
                    <div className="ipo-card__empty">
                        No {activeTab} IPOs at the moment
                    </div>
                ) : (
                    currentList.map((ipo, idx) => (
                        <div key={idx} className="ipo-item">
                            <div className="ipo-item__header">
                                <div className="ipo-item__name">{ipo.name}</div>
                                <div className={`ipo-item__status ipo-item__status--${ipo.status || activeTab}`}>
                                    {ipo.status || activeTab}
                                </div>
                            </div>
                            <div className="ipo-item__details">
                                <div className="ipo-item__detail">
                                    <span className="ipo-item__label">Price Band:</span>
                                    <span className="ipo-item__value">{ipo.issuePrice || 'TBA'}</span>
                                </div>
                                <div className="ipo-item__detail">
                                    <span className="ipo-item__label">Issue Size:</span>
                                    <span className="ipo-item__value">{ipo.issueSize || 'TBA'}</span>
                                </div>
                                <div className="ipo-item__detail">
                                    <span className="ipo-item__label">Lot Size:</span>
                                    <span className="ipo-item__value">{ipo.lotSize || 'TBA'}</span>
                                </div>
                                {ipo.openDate && (
                                    <div className="ipo-item__dates">
                                        📅 {ipo.openDate} - {ipo.closeDate}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default IPOCard;
