import React, { useEffect } from 'react';
import Header from '../components/Header';
import MutualFundCard from '../components/MutualFundCard';
import IPOCard from '../components/IPOCard';
import QuickMarket from '../components/QuickMarket';
import SectionNavigator from '../components/SectionNavigator';
import { useMarket } from '../context/MarketContext';
import { useSettings } from '../context/SettingsContext';

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
    const { settings } = useSettings();
    const marketSettings = settings?.market || {};

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

    // Navigation Sections
    const navSections = [
        { id: 'market-indices', icon: '📊', label: 'Indices' },
        marketSettings.showSectorals !== false && { id: 'sectoral-indices', icon: '🏛️', label: 'Sectorals' },
        (marketSettings.showGainers !== false || marketSettings.showLosers !== false) && { id: 'market-movers', icon: '📈', label: 'Top Movers' },
        marketSettings.showCommodities !== false && { id: 'commodities', icon: '🪙', label: 'Commodities' },
        marketSettings.showCurrency !== false && { id: 'currency', icon: '💱', label: 'Currency' },
        marketSettings.showFIIDII !== false && { id: 'fiidii', icon: '🏦', label: 'FII/DII' },
        marketSettings.showMutualFunds !== false && { id: 'mutual-funds', icon: '💰', label: 'Mutual Funds' },
        marketSettings.showIPO !== false && { id: 'ipo-tracker', icon: '🎯', label: 'IPO Watch' }
    ].filter(Boolean);

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

    const { indices, mutualFunds, ipo, movers, sectorals, commodities, currencies, fiidii } = marketData || {};

    return (
        <div className="page-container">
            <Header
                title="Indian Markets"
                icon="📈"
                onRefresh={handleRefresh}
                loading={loading}
            />

            <main className="main-content market-page">
                {/* Quick Market Overview (New Widget) */}
                <QuickMarket />

                {/* Last Updated */}
                <div className="market-page__timestamp">
                    Last updated: {formatTime(lastFetch)}
                    {loading && <span className="market-page__refreshing"> (Refreshing...)</span>}
                </div>

                {/* =========== INDICES =========== */}
                {marketSettings.showIndices !== false && (
                    <section id="market-indices" className="market-section">
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
                )}

                {/* =========== TOP MOVERS =========== */}
                {(marketSettings.showGainers !== false || marketSettings.showLosers !== false) && (
                    <section id="market-movers" className="market-section">
                        <h2 className="market-section__title">
                            <span>📈</span> Top Movers
                        </h2>

                        <div className="movers-grid">
                            {/* Gainers */}
                            {marketSettings.showGainers !== false && (
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
                            )}

                            {/* Losers */}
                            {marketSettings.showLosers !== false && (
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
                            )}
                        </div>
                    </section>
                )}

                {/* =========== SECTORAL INDICES =========== */}
                {marketSettings.showSectorals !== false && (
                    <section id="sectoral-indices" className="market-section">
                        <h2 className="market-section__title">
                            <span>🏛️</span> Sectoral Indices
                        </h2>
                        <div className="sectoral-grid">
                            {sectorals?.map((sector, idx) => (
                                <div key={idx} className="sectoral-card">
                                    <div className="sectoral-card__name">{sector.name}</div>
                                    <div className="sectoral-card__value">{sector.value}</div>
                                    <div className={`sectoral-card__change ${sector.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {sector.changePercent >= 0 ? '▲' : '▼'} {sector.changePercent}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* =========== COMMODITIES =========== */}
                {marketSettings.showCommodities !== false && (
                    <section id="commodities" className="market-section">
                        <h2 className="market-section__title">
                            <span>🪙</span> Commodity Watch
                        </h2>
                        <div className="commodity-grid">
                            {commodities?.map((commodity, idx) => (
                                <div key={idx} className="commodity-card">
                                    <div className="commodity-card__name">{commodity.name}</div>
                                    <div className="commodity-card__value">₹{commodity.value} <span className="commodity-card__unit">{commodity.unit}</span></div>
                                    <div className={`commodity-card__change ${commodity.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {commodity.changePercent >= 0 ? '+' : ''}{commodity.changePercent}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* =========== CURRENCY RATES =========== */}
                {marketSettings.showCurrency !== false && (
                    <section id="currency" className="market-section">
                        <h2 className="market-section__title">
                            <span>💱</span> Currency Rates
                        </h2>
                        <div className="currency-grid">
                            {currencies?.map((currency, idx) => (
                                <div key={idx} className="currency-card">
                                    <div className="currency-card__name">{currency.name}</div>
                                    <div className="currency-card__value">₹{currency.value}</div>
                                    <div className={`currency-card__change ${currency.changePercent >= 0 ? 'text-success' : 'text-danger'}`}>
                                        {currency.changePercent >= 0 ? '+' : ''}{currency.changePercent}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* =========== FII/DII ACTIVITY =========== */}
                {marketSettings.showFIIDII !== false && (
                    <section id="fiidii" className="market-section">
                        <h2 className="market-section__title">
                            <span>🏦</span> FII/DII Activity
                        </h2>
                        <div className="fiidii-container">
                            <div className="fiidii-block">
                                <h3 className="fiidii-block__title">FII (Foreign Institutional Investors)</h3>
                                <div className="fiidii-stats">
                                    <div className="fiidii-stat">
                                        <span className="fiidii-stat__label">Buy:</span>
                                        <span className="fiidii-stat__value text-success">₹{fiidii?.fii?.buy} Cr</span>
                                    </div>
                                    <div className="fiidii-stat">
                                        <span className="fiidii-stat__label">Sell:</span>
                                        <span className="fiidii-stat__value text-danger">₹{fiidii?.fii?.sell} Cr</span>
                                    </div>
                                    <div className="fiidii-stat">
                                        <span className="fiidii-stat__label">Net:</span>
                                        <span className={`fiidii-stat__value ${fiidii?.fii?.net >= 0 ? 'text-success' : 'text-danger'}`}>
                                            ₹{fiidii?.fii?.net} Cr
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="fiidii-block">
                                <h3 className="fiidii-block__title">DII (Domestic Institutional Investors)</h3>
                                <div className="fiidii-stats">
                                    <div className="fiidii-stat">
                                        <span className="fiidii-stat__label">Buy:</span>
                                        <span className="fiidii-stat__value text-success">₹{fiidii?.dii?.buy} Cr</span>
                                    </div>
                                    <div className="fiidii-stat">
                                        <span className="fiidii-stat__label">Sell:</span>
                                        <span className="fiidii-stat__value text-danger">₹{fiidii?.dii?.sell} Cr</span>
                                    </div>
                                    <div className="fiidii-stat">
                                        <span className="fiidii-stat__label">Net:</span>
                                        <span className={`fiidii-stat__value ${fiidii?.dii?.net >= 0 ? 'text-success' : 'text-danger'}`}>
                                            ₹{fiidii?.dii?.net} Cr
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="fiidii-date">As of: {fiidii?.date}</div>
                        </div>
                    </section>
                )}

                {/* =========== MUTUAL FUNDS =========== */}
                {marketSettings.showMutualFunds !== false && (
                    <section id="mutual-funds" className="market-section">
                        <h2 className="market-section__title">
                            <span>📊</span> Mutual Fund NAVs
                        </h2>
                        <MutualFundCard funds={mutualFunds} />
                    </section>
                )}

                {/* =========== IPO TRACKER =========== */}
                {marketSettings.showIPO !== false && (
                    <section id="ipo-tracker" className="market-section">
                        <h2 className="market-section__title">
                            <span>🎯</span> IPO Tracker
                        </h2>
                        <IPOCard ipoData={ipo} />
                    </section>
                )}

                {/* =========== DISCLAIMER =========== */}
                <div className="market-disclaimer">
                    * Data is for informational purposes only.
                    Delayed by 15 minutes. Not investment advice.
                </div>
            </main>

            {/* Floating Section Navigator */}
            <SectionNavigator sections={navSections} />
        </div>
    );
}

export default MarketPage;
