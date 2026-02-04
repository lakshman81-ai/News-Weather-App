import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useWatchlist } from '../hooks/useWatchlist';
import { downloadCalendarEvent } from '../utils/calendar';
import './UpAhead.css';

function UpAheadPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('feed'); // 'feed' | 'plan'
    const { watchlist, toggleWatchlist, isWatched } = useWatchlist();

    useEffect(() => {
        fetch('./data/up_ahead.json')
            .then(res => res.json())
            .then(jsonData => {
                setData(jsonData);
                setLoading(false);
            })
            .catch(err => {
                console.error("Failed to load Up Ahead data", err);
                setLoading(false);
            });
    }, []);

    const isStale = React.useMemo(() => {
        if (!data?.lastUpdated) return false;
        const diff = Date.now() - new Date(data.lastUpdated).getTime();
        return diff > 48 * 60 * 60 * 1000; // 48 hours
    }, [data]);

    if (loading) {
        return (
            <div className="page-container">
                <Header title="Up Ahead" icon="🗓️" />
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <p>Scanning the horizon...</p>
                </div>
            </div>
        );
    }

    if (!data || data.error || isStale) {
         return (
            <div className="page-container">
                <Header title="Up Ahead" icon="🗓️" />
                <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>🔭</span>
                    <h3>{isStale ? "Data Outdated" : "Nothing on the radar"}</h3>
                    <p>{isStale ? "Refreshing forecasts..." : "Check back later for updates."}</p>
                </div>
            </div>
        );
    }

    // Phase 2: Alerts Banner
    const alerts = data.sections?.alerts || [];
    const highPriorityAlert = alerts.length > 0 ? alerts[0] : null;

    return (
        <div className="page-container up-ahead-page">
            <Header title="Up Ahead" icon="🗓️" />

            {/* Alert Banner */}
            {highPriorityAlert && (
                <div className="ua-alert-banner">
                    <span className="ua-alert-icon">⚠️</span>
                    <div className="ua-alert-content">
                        <h4>Worth Knowing</h4>
                        <p>{highPriorityAlert.text}</p>
                    </div>
                </div>
            )}

            {/* View Toggle */}
            <div className="ua-view-toggle">
                <button
                    className={`ua-toggle-btn ${view === 'feed' ? 'active' : ''}`}
                    onClick={() => setView('feed')}
                >
                    Timeline
                </button>
                <button
                    className={`ua-toggle-btn ${view === 'plan' ? 'active' : ''}`}
                    onClick={() => setView('plan')}
                >
                    Plan My Week
                </button>
            </div>

            {/* Main Content */}
            {view === 'feed' ? (
                <div className="ua-timeline">
                    {data.timeline?.map((day, idx) => (
                        <div key={idx} className="ua-day-section">
                            <div className="ua-day-header">
                                <div className="ua-day-label">{day.dayLabel}</div>
                                <div className="ua-date-sub">{day.date}</div>
                            </div>

                            {day.items?.map(item => (
                                <div key={item.id} className={`ua-card ${idx === 0 ? 'today' : ''}`}>
                                    <div className="ua-card-header">
                                        <div className="ua-type-badge type-{item.type}">
                                            {item.type}
                                        </div>
                                        <button
                                            className={`ua-action-btn ${isWatched(item.id) ? 'active' : ''}`}
                                            onClick={() => toggleWatchlist(item.id)}
                                        >
                                            {isWatched(item.id) ? '♥' : '♡'}
                                        </button>
                                    </div>

                                    <div className="ua-card-title">{item.title}</div>
                                    <div className="ua-card-subtitle">
                                        <span>⏰</span> {item.subtitle}
                                    </div>
                                    <p className="ua-card-desc">{item.description}</p>

                                    <div className="ua-card-footer">
                                        <div className="ua-tags">
                                            {item.tags?.map(tag => (
                                                <span key={tag} className="ua-tag">#{tag}</span>
                                            ))}
                                        </div>
                                        <div className="ua-actions">
                                            <button
                                                className="ua-action-btn"
                                                onClick={() => downloadCalendarEvent(item.title, item.description)}
                                                title="Add to Calendar"
                                            >
                                                📅
                                            </button>
                                            <button className="ua-action-btn" title="Share">
                                                📤
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ))}

                    {/* Worth Knowing Section */}
                    <div className="ua-worth-knowing">
                        {data.sections?.festivals?.length > 0 && (
                            <div className="ua-wk-card">
                                <div className="ua-wk-title">🪔 Festivals & Holidays</div>
                                <ul className="ua-wk-list">
                                    {data.sections.festivals.map((f, i) => (
                                        <li key={i} className="ua-wk-item">
                                            <span>{f.title}</span>
                                            <span>{f.date}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {data.sections?.movies?.length > 0 && (
                            <div className="ua-wk-card">
                                <div className="ua-wk-title">🎬 Releasing Soon</div>
                                <ul className="ua-wk-list">
                                    {data.sections.movies.map((m, i) => (
                                        <li key={i} className="ua-wk-item">
                                            <span>{m.title} ({m.language})</span>
                                            <span>{m.releaseDate}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                /* Plan My Week View */
                <div className="ua-weekly-plan">
                     {Object.entries(data.weekly_plan || {}).map(([day, plan], idx) => (
                         <div key={day} className="ua-plan-item">
                             <div className="ua-plan-day">
                                 <span className="ua-plan-day-name">{day.substring(0, 3)}</span>
                                 <div className="ua-plan-day-circle"></div>
                             </div>
                             <div className="ua-plan-content">
                                 <p className="ua-plan-text">{plan}</p>
                             </div>
                         </div>
                     ))}
                </div>
            )}
        </div>
    );
}

export default UpAheadPage;
