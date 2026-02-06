import React, { useEffect, useRef, useMemo, useState } from 'react';
import { useMarket } from '../context/MarketContext';
import './MarketTicker.css';

const MarketTicker = () => {
    const { marketData, loading, lastFetch } = useMarket();
    const scrollRef = useRef(null);
    const isPaused = useRef(false);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Filter and prepare market items
    const markets = useMemo(() => {
        if (!marketData) return [];

        const { indices = [], commodities = [] } = marketData;
        const allItems = [...indices, ...commodities];

        // Specific items to show in the ticker
        const allowedNames = ['NIFTY 50', 'SENSEX', 'Gold', 'Silver'];

        return allItems.filter(item => allowedNames.includes(item.name) && item.value !== null && item.value !== undefined);
    }, [marketData]);

    const repeatCount = useMemo(() => {
        if (markets.length === 0) return 0;

        // Each ticker item is roughly 180-220px wide
        const estimatedItemWidth = 200;
        const minItemsToFill = Math.ceil(windowWidth / estimatedItemWidth);

        // Need at least 2x items to fill screen + buffer for seamless scroll
        let repeats = Math.ceil((minItemsToFill * 2) / Math.max(markets.length, 1));

        // Ensure even number of repeats for the half-width reset logic to work perfectly
        if (repeats % 2 !== 0) repeats++;

        // Minimum repeats to be safe
        return Math.max(4, repeats);
    }, [markets.length, windowWidth]);

    const tickerItems = useMemo(() => {
        const items = [];
        for (let i = 0; i < repeatCount; i++) {
            items.push(...markets);
        }

        // Debug logging
        console.log(`[Ticker] ${markets.length} items × ${repeatCount} repeats = ${items.length} total items`);

        return items;
    }, [markets, repeatCount]);

    // Auto-scroll logic (Same as before)
    useEffect(() => {
        let animationFrameId;
        let lastTimestamp = 0;
        const speed = 40; // pixels per second
        let accumulator = 0;

        const scroll = (timestamp) => {
            if (!lastTimestamp) lastTimestamp = timestamp;
            const deltaTime = timestamp - lastTimestamp;
            lastTimestamp = timestamp;

            if (scrollRef.current && !isPaused.current) {
                const move = (speed * deltaTime) / 1000;
                accumulator += move;

                if (accumulator >= 1) {
                    const pixelsToMove = Math.floor(accumulator);
                    accumulator -= pixelsToMove;

                    const { scrollLeft, scrollWidth } = scrollRef.current;

                    // Reset if passed halfway point (infinite loop illusion)
                    if (scrollLeft >= scrollWidth / 2) {
                         scrollRef.current.scrollLeft = 0;
                    } else {
                         scrollRef.current.scrollLeft += pixelsToMove;
                    }
                }
            } else {
                lastTimestamp = timestamp;
            }
            animationFrameId = requestAnimationFrame(scroll);
        };

        const timeoutId = setTimeout(() => {
            animationFrameId = requestAnimationFrame(scroll);
        }, 1000);

        return () => {
            cancelAnimationFrame(animationFrameId);
            clearTimeout(timeoutId);
        };
    }, [tickerItems]);

    const isItemStale = (item) => {
        if (!item.timestamp) return true;
        const now = Date.now();
        const diff = now - item.timestamp;

        // Commodities: 60 mins, Others: 15 mins
        const isCommodity = ['Gold', 'Silver', 'Crude Oil'].includes(item.name);
        const threshold = isCommodity ? 60 * 60 * 1000 : 15 * 60 * 1000;

        return diff > threshold;
    };

    const formatTime = (ts) => {
        if (!ts) return '';
        return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    if ((loading && markets.length === 0) || markets.length === 0) return null;

    return (
        <div className="market-ticker-container">
            <div className="ticker-label">📈</div>

            <div
                className="ticker-track-wrapper"
                ref={scrollRef}
                onMouseEnter={() => isPaused.current = true}
                onMouseLeave={() => isPaused.current = false}
                onTouchStart={() => isPaused.current = true}
                onTouchEnd={() => isPaused.current = false}
            >
                <div className="ticker-track">
                    {/* Dynamic list for infinite scroll effect */}
                    {tickerItems.map((item, index) => {
                        const stale = isItemStale(item);
                        return (
                            <div key={`${item.name}-${index}`} className={`ticker-item ${stale ? 'stale-data' : ''}`}>
                                <span className="ticker-name">{item.name}</span>
                                <span className="ticker-price">
                                    {/* Handle unit display for commodities */}
                                    {item.name === 'Gold' || item.name === 'Silver' ? item.value :
                                     (typeof item.value === 'number' ? item.value.toFixed(2) : item.value)}
                                    {item.unit ? <span style={{fontSize: '0.7em', marginLeft: '2px'}}>{item.unit}</span> : ''}
                                </span>
                                <span className={`ticker-change ${parseFloat(item.change) >= 0 ? 'positive' : 'negative'}`}>
                                    {parseFloat(item.change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(item.changePercent)).toFixed(2)}%
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Static Last Updated Label */}
            {lastFetch && (
                <div className="ticker-updated">
                    <span style={{marginRight: '4px'}}>🕒</span> {formatTime(lastFetch)}
                </div>
            )}
        </div>
    );
};

export default MarketTicker;
