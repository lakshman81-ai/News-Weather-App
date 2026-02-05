import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { useWatchlist } from '../hooks/useWatchlist';
import { downloadCalendarEvent } from '../utils/calendar';
import { fetchUpAheadData } from '../services/upAheadService';
import { useSettings } from '../context/SettingsContext';
import './UpAhead.css';

function UpAheadPage() {
    const { settings } = useSettings();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [view, setView] = useState('feed'); // 'feed' | 'plan'
    const { toggleWatchlist, isWatched } = useWatchlist();

    useEffect(() => {
        // Pass settings to the service so it knows what to fetch
        const upAheadSettings = settings.upAhead || {
            categories: { movies: true, events: true, festivals: true, alerts: true, sports: true },
            locations: ['Chennai']
        };

        let isMounted = true;

        // Show loading spinner when settings change
        setLoading(true);

        fetchUpAheadData(upAheadSettings)
            .then(fetchedData => {
                if (isMounted) {
                    setData(fetchedData);
                    setLoading(false);
                }
            })
            .catch(err => {
                if (isMounted) {
                    console.error("Failed to load Up Ahead data", err);
                    setLoading(false);
                }
            });

        return () => {
            isMounted = false;
        };
        // We depend on settings.upAhead to refetch when config changes.
        // The linter might warn about `setLoading` causing updates, but it's intentional here.
    }, [settings.upAhead]);

    if (loading) {
        return (
            <div className="page-container">
                <Header title="Up Ahead" icon="🗓️" />
                <div className="loading">
                    <div className="loading__spinner"></div>
                    <p>Scanning horizon for {settings.upAhead?.locations?.join(', ') || 'events'}...</p>
                </div>
            </div>
        );
    }

    if (!data || !data.timeline || data.timeline.length === 0) {
         return (
            <div className="page-container">
                <Header title="Up Ahead" icon="🗓️" />
                <div className="empty-state">
                    <span style={{ fontSize: '3rem' }}>🔭</span>
                    <h3>Nothing on the radar</h3>
                    <p>No upcoming events found for your selected locations.</p>
                    <div style={{ marginTop: '1rem' }}>
                         <small>Try adding more locations in Settings.</small>
                    </div>
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

            {/* Source Indicator */}
            <div style={{
                textAlign: 'center',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                padding: '4px',
                background: 'var(--bg-secondary)'
            }}>
                Live Feed • {settings.upAhead?.locations?.join(', ') || 'All Locations'}
            </div>

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
                    {data.timeline?.map((day) => (
                        <div key={day.date} className="ua-day-section">
                            <div className="ua-day-header">
                                <div className="ua-day-label">{day.dayLabel}</div>
                                <div className="ua-date-sub">{day.date}</div>
                            </div>

                            {day.items?.map(item => (
                                <div key={item.id} className="ua-card">
                                    <div className="ua-card-header">
                                        <div className={`ua-type-badge type-${item.type}`}>
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

                                    {item.link && (
                                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="ua-read-more">
                                            Read Source
                                        </a>
                                    )}

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

                    {/* Worth Knowing Section (Sections fallback) */}
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
                                            <span>{m.title}</span>
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
                     {Object.entries(data.weekly_plan || {}).map(([day, plan]) => (
                         <div key={day} className="ua-plan-item">
                             <div className="ua-plan-day">
                                 <span className="ua-plan-day-name" style={{ textTransform: 'capitalize' }}>{day}</span>
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
