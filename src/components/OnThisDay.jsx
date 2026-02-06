import React, { useState, useEffect } from 'react';
import './OnThisDay.css';

/**
 * On This Day — Compact card showing notable historical events.
 * Data source: Wikipedia On This Day API (Wikimedia REST).
 * Cache Strategy: 'otd_daily_cache' stores { date: 'MM-DD', data: ... }
 *
 * Design: Compact card with 3 events by default, expandable.
 * Visual: Vintage sepia styling with timeline dots.
 */
const OnThisDay = () => {
    const [events, setEvents] = useState([]);
    const [births, setBirths] = useState([]);
    const [expanded, setExpanded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOnThisDay();
    }, []);

    const fetchOnThisDay = async () => {
        const today = new Date();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateKey = `${month}-${day}`;
        const cacheKey = 'otd_daily_cache';

        // Check Cache
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const parsed = JSON.parse(cached);
                // Check if cache is from today
                if (parsed.date === dateKey) {
                    setEvents(parsed.data.events || []);
                    setBirths(parsed.data.births || []);
                    setLoading(false);
                    console.log('[OnThisDay] Loaded from cache');
                    return;
                }
            }
        } catch (e) {
            console.warn('[OnThisDay] Cache read error:', e);
        }

        // Fetch from Wikipedia
        try {
            const url = `https://api.wikimedia.org/feed/v1/wikipedia/en/onthisday/selected/${month}/${day}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();

            // Extract selected events (most notable) and births
            const selectedEvents = (data.selected || [])
                .slice(0, 7)  // Get up to 7 for expanded view
                .map(e => ({
                    year: e.year,
                    text: e.text,
                    pages: e.pages?.map(p => p.title) || []
                }));

            const selectedBirths = (data.births || [])
                .slice(0, 3)
                .map(b => ({
                    year: b.year,
                    text: b.text,
                    pages: b.pages?.map(p => p.title) || []
                }));

            setEvents(selectedEvents);
            setBirths(selectedBirths);

            // Update Cache
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    date: dateKey,
                    data: { events: selectedEvents, births: selectedBirths },
                    timestamp: Date.now()
                }));
            } catch (e) {
                console.warn('[OnThisDay] Cache write error:', e);
            }

            console.log(`[OnThisDay] Fetched ${selectedEvents.length} events, ${selectedBirths.length} births`);
        } catch (err) {
            console.error('[OnThisDay] Fetch failed:', err.message);
            setError('Could not load historical events');
        } finally {
            setLoading(false);
        }
    };

    // If loading, render nothing until ready (to avoid layout shift or skeletons for this low-priority item)
    // Or render null to just pop in when ready.
    if (loading) return null;

    // If error or empty, render nothing (graceful degradation)
    if (error || events.length === 0) return null;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

    const visibleEvents = expanded ? events : events.slice(0, 3);
    const visibleBirths = expanded ? births : [];

    return (
        <section className="otd-card">
            <div className="otd-header">
                <span className="otd-icon">📜</span>
                <span className="otd-title">On This Day</span>
                <span className="otd-date">{dateStr}</span>
            </div>

            <div className="otd-events">
                {visibleEvents.map((event, i) => (
                    <div key={i} className="otd-event">
                        <div className="otd-timeline-dot" />
                        <div className="otd-event-content">
                            <span className="otd-year">{event.year}</span>
                            <span className="otd-text">{event.text}</span>
                        </div>
                    </div>
                ))}

                {expanded && visibleBirths.length > 0 && (
                    <>
                        <div className="otd-births-header">Notable Births</div>
                        {visibleBirths.map((birth, i) => (
                            <div key={`b-${i}`} className="otd-event otd-birth">
                                <div className="otd-timeline-dot otd-dot--birth" />
                                <div className="otd-event-content">
                                    <span className="otd-year">{birth.year}</span>
                                    <span className="otd-text">{birth.text}</span>
                                </div>
                            </div>
                        ))}
                    </>
                )}
            </div>

            {events.length > 3 && (
                <button className="otd-expand" onClick={() => setExpanded(!expanded)}>
                    {expanded ? 'Show less' : `Show ${events.length - 3} more`}
                </button>
            )}
        </section>
    );
};

export default OnThisDay;
