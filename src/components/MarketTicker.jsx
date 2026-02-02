import React, { useState, useEffect, useRef } from 'react';
import { fetchIndices, fetchCommodities, fetchCurrencyRates } from '../services/indianMarketService';
import './MarketTicker.css';

const MarketTicker = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);
    const scrollRef = useRef(null);
    const isPaused = useRef(false);

    useEffect(() => {
        const loadMarkets = async () => {
            try {
                // Fetch required data
                const [indices, commodities, currencies] = await Promise.all([
                    fetchIndices(),
                    fetchCommodities(),
                    fetchCurrencyRates()
                ]);

                // Filter and Map to specific items: NIFTY 50, SENSEX, Gold, Silver, OMR/INR
                const allowedNames = ['NIFTY 50', 'SENSEX', 'Gold', 'Silver', 'OMR/INR'];

                const allItems = [...indices, ...commodities, ...currencies];
                const filtered = allItems.filter(item => allowedNames.includes(item.name));

                // Enforce specific order
                const ordered = allowedNames.map(name => filtered.find(item => item.name === name)).filter(Boolean);

                setMarkets(ordered);
                setLoading(false);
            } catch (err) {
                console.error("Market Ticker Error:", err);
                setLoading(false);
            }
        };

        loadMarkets();
        const interval = setInterval(loadMarkets, 60000); // 1 min update
        return () => clearInterval(interval);
    }, []);

    // Auto-scroll logic with speed control
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

                // Only write to DOM when we have at least 1 pixel to move
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
                // If paused, reset timestamp to prevent jumps on resume
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
    }, [markets]);

    if (loading || markets.length === 0) return null;

    return (
        <div className="market-ticker-container">
            <div className="ticker-label">MARKETS</div>
            <div
                className="ticker-track-wrapper"
                ref={scrollRef}
                onMouseEnter={() => isPaused.current = true}
                onMouseLeave={() => isPaused.current = false}
                onTouchStart={() => isPaused.current = true}
                onTouchEnd={() => isPaused.current = false}
            >
                <div className="ticker-track">
                    {/* Double the list for infinite scroll effect */}
                    {[...markets, ...markets].map((item, index) => (
                        <div key={`${item.name}-${index}`} className="ticker-item">
                            <span className="ticker-name">{item.name}</span>
                            <span className="ticker-price">
                                {typeof item.value === 'number' ? item.value.toFixed(2) : item.value}
                            </span>
                            <span className={`ticker-change ${parseFloat(item.change) >= 0 ? 'positive' : 'negative'}`}>
                                {parseFloat(item.change) >= 0 ? '▲' : '▼'} {Math.abs(parseFloat(item.changePercent)).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketTicker;
