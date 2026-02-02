import React, { useState, useEffect } from 'react';
import { fetchIndices, fetchCommodities, fetchCurrencyRates } from '../services/indianMarketService';
import './MarketTicker.css';

const MarketTicker = () => {
    const [markets, setMarkets] = useState([]);
    const [loading, setLoading] = useState(true);

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
