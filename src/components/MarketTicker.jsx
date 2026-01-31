import React, { useState, useEffect } from 'react';
import { fetchMarketData } from '../services/marketService';
import './MarketTicker.css';

const MarketTicker = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadMarkets = async () => {
            const data = await fetchMarketData();
            setMarkets(data);
            setLoading(false);
        };

        loadMarkets();
        // Update every 30 seconds
        const interval = setInterval(loadMarkets, 30000);
        return () => clearInterval(interval);
    }, []);

    if (loading || markets.length === 0) return null;

    return (
        <div className="market-ticker-container">
            <div className="ticker-label">MARKETS</div>
            <div className="ticker-track-wrapper">
                <div className="ticker-track">
                    {/* Double the list for infinite scroll effect */}
                    {[...markets, ...markets].map((item, index) => (
                        <div key={`${item.name}-${index}`} className="ticker-item">
                            <span className="ticker-name">{item.name}</span>
                            <span className="ticker-price">{item.price}</span>
                            <span className={`ticker-change ${item.change >= 0 ? 'positive' : 'negative'}`}>
                                {item.change >= 0 ? '▲' : '▼'} {Math.abs(item.change).toFixed(2)}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default MarketTicker;
