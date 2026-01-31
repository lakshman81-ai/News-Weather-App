import React, { useEffect } from 'react';
import Header from '../components/Header';
import MutualFundCard from '../components/MutualFundCard';
import IPOCard from '../components/IPOCard';
import { useMarket } from '../context/MarketContext';

/**
 * Enhanced Market Dashboard
 * Focused on Indian Stock Market:
 * - NSE/BSE Indices
 * - Top Gainers/Losers
 * - Mutual Fund NAVs
 * - IPO Tracker
 * - Market Trends
 */
function MarketPage() {
    const { marketData, loading, error, refreshMarket, lastFetch } = useMarket();

    const handleRefresh = () => {
        refreshMarket();
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return 'Never';
        return new Date(timestamp).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading && !marketData) {
        return (
            <div className="page-container">
                <Header title="Indian Markets" icon="📈" />
                <main className="main-content">
                    <div className="loading-state">
                        <div className="loading-spinner">📊</div>
                        <p>Loading market data...</p>
                    </div>
                </main>
            </div>
        );
    }

    if (error && !marketData) {
        return (
            <div className="page-container">
                <Header title="Indian Markets" icon="📈" onRefresh={handleRefresh} />
                <main className="main-content">
                    <div className="error-state">
                        <p>Failed to load market data</p>
                        <button onClick={handleRefresh}>Retry</button>
                    </div>
                </main>
            </div>
        );
    }

    const { indices, mutualFunds, ipo, movers } = marketData || {};

    return (
        <div className="page-container">
            <Header
                title="Indian Markets"
                icon="📈"
                onRefresh={handleRefresh}
                loading={loading}
            />

            <main className="main-content market-page">
                {/* Last Updated */}
                <div className="market-page__timestamp">
                    Last updated: {formatTime(lastFetch)}
                    {loading && <span className="market-page__refreshing"> (Refreshing...)</span>}
                </div>

                {/* =========== INDICES =========== */}
                <section className="market-section">
                    <h2 className="market-section__title">
                        <span>📊</span> Market Indices
                    </h2>

                    <div className="market-indices-grid">
                        {indices?.map((index, idx) => (
                            <div key={idx} className={`market-index market-index--${index.direction}`}>
                                <div className="market-index__name">{index.name}</div>
                                <div className="market-index__value">{index.value}</div>
                                <div className={`market-index__change market-index__change--${index.direction}`}>
                                    {index.direction === 'up' ? '▲' : '▼'}
                                    {index.change} ({index.changePercent}%)
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* =========== TOP MOVERS =========== */}
                <section className="market-section">
                    <h2 className="market-section__title">
                        <span>📈</span> Top Movers
                    </h2>

                    <div className="movers-grid">
                        {/* Gainers */}
                        <div className="movers-column movers-column--gainers">
                            <h3 className="movers-column__title">🔼 Top Gainers</h3>
                            {movers?.gainers?.map((stock, idx) => (
                                <div key={idx} className="mover-item">
                                    <div className="mover-item__symbol">{stock.symbol}</div>
                                    <div className="mover-item__price">₹{stock.price}</div>
                                    <div className="mover-item__change text-success">
                                        +{stock.changePercent}%
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Losers */}
                        <div className="movers-column movers-column--losers">
                            <h3 className="movers-column__title">🔽 Top Losers</h3>
                            {movers?.losers?.map((stock, idx) => (
                                <div key={idx} className="mover-item">
                                    <div className="mover-item__symbol">{stock.symbol}</div>
                                    <div className="mover-item__price">₹{stock.price}</div>
                                    <div className="mover-item__change text-danger">
                                        {stock.changePercent}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* =========== MUTUAL FUNDS =========== */}
                <section className="market-section">
                    <h2 className="market-section__title">
                        <span>📊</span> Mutual Fund NAVs
                    </h2>
                    <MutualFundCard funds={mutualFunds} />
                </section>

                {/* =========== IPO TRACKER =========== */}
                <section className="market-section">
                    <h2 className="market-section__title">
                        <span>🎯</span> IPO Tracker
                    </h2>
                    <IPOCard ipoData={ipo} />
                </section>

                {/* =========== DISCLAIMER =========== */}
                <div className="market-disclaimer">
                    * Data is for informational purposes only.
                    Delayed by 15 minutes. Not investment advice.
                </div>
            </main>
        </div>
    );
}

export default MarketPage;
