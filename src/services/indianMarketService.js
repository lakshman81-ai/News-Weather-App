/**
 * Indian Market Data Service
 * Fetches: Stock Indices, Mutual Funds, IPO Data
 * All FREE APIs - No API keys required
 */

// ============================================
// 1. STOCK INDICES (NSE/BSE)
// ============================================

// Using Yahoo Finance symbols for Indian indices
const INDICES = {
    nifty50: '^NSEI',
    sensex: '^BSESN',
    niftyBank: '^NSEBANK',
    niftyIT: '^CNXIT',
    niftyMidcap: 'NIFTYMIDCAP150.NS'
};

// Proxy to avoid CORS (use any Yahoo Finance proxy or self-host)
const YAHOO_PROXY = 'https://query1.finance.yahoo.com/v8/finance/chart/';

export async function fetchIndices() {
    console.log('[MarketService] Fetching Indian indices...');

    const results = [];

    for (const [name, symbol] of Object.entries(INDICES)) {
        try {
            const url = `${YAHOO_PROXY}${encodeURIComponent(symbol)}?interval=1d&range=1d`;
            const response = await fetch(url);
            const data = await response.json();

            const quote = data.chart?.result?.[0];
            if (!quote) continue;

            const meta = quote.meta;
            const currentPrice = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || meta.previousClose;
            const change = currentPrice - prevClose;
            const changePercent = ((change / prevClose) * 100).toFixed(2);

            results.push({
                name: name === 'nifty50' ? 'NIFTY 50' :
                    name === 'sensex' ? 'SENSEX' :
                        name === 'niftyBank' ? 'BANK NIFTY' :
                            name === 'niftyIT' ? 'NIFTY IT' : 'MIDCAP 150',
                symbol: symbol,
                value: currentPrice.toLocaleString('en-IN'),
                change: change.toFixed(2),
                changePercent: changePercent,
                direction: change >= 0 ? 'up' : 'down',
                currency: '₹'
            });

            console.log(`[MarketService] ✅ ${name}: ${currentPrice}`);
        } catch (err) {
            console.warn(`[MarketService] ⚠️ Failed to fetch ${name}:`, err.message);
        }
    }

    return results;
}

// ============================================
// 2. MUTUAL FUNDS (mfapi.in - FREE, no key)
// ============================================

const MF_API = 'https://api.mfapi.in/mf/';

// Popular scheme codes (can be expanded)
const POPULAR_MF_SCHEMES = [
    { code: '119551', name: 'SBI Bluechip Fund' },
    { code: '120503', name: 'HDFC Mid-Cap Opportunities' },
    { code: '118834', name: 'ICICI Prudential Value Discovery' },
    { code: '122639', name: 'Axis Long Term Equity Fund' },
    { code: '125354', name: 'Mirae Asset Large Cap Fund' },
    { code: '118989', name: 'Kotak Emerging Equity Fund' }
];

export async function fetchMutualFunds() {
    console.log('[MarketService] Fetching Mutual Fund NAVs...');

    const results = await Promise.allSettled(
        POPULAR_MF_SCHEMES.map(async (scheme) => {
            const response = await fetch(`${MF_API}${scheme.code}`);
            const data = await response.json();

            if (!data.data || data.data.length === 0) {
                throw new Error('No NAV data');
            }

            const latestNAV = parseFloat(data.data[0].nav);
            const prevNAV = data.data.length > 1 ? parseFloat(data.data[1].nav) : latestNAV;
            const change = latestNAV - prevNAV;
            const changePercent = ((change / prevNAV) * 100).toFixed(2);

            return {
                code: scheme.code,
                name: data.meta?.scheme_name || scheme.name,
                category: data.meta?.scheme_category || 'Equity',
                fundHouse: data.meta?.fund_house || 'Unknown',
                nav: latestNAV.toFixed(2),
                navDate: data.data[0].date,
                change: change.toFixed(2),
                changePercent: changePercent,
                direction: change >= 0 ? 'up' : 'down'
            };
        })
    );

    const successful = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

    console.log(`[MarketService] ✅ Fetched ${successful.length}/${POPULAR_MF_SCHEMES.length} MF NAVs`);

    return successful;
}

// ============================================
// 3. IPO DATA (ipoalerts.in - FREE tier)
// ============================================

const IPO_API = 'https://ipoalerts.in/api/v1/ipos';

export async function fetchIPOData() {
    console.log('[MarketService] Fetching IPO data...');

    try {
        // Fallback: Use simulated data if API is unavailable
        // In production, replace with actual API call
        const response = await fetch(IPO_API, {
            headers: { 'Accept': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('IPO API unavailable');
        }

        const data = await response.json();

        return {
            upcoming: data.upcoming || [],
            live: data.live || [],
            recent: data.recent || [],
            fetchedAt: Date.now()
        };
    } catch (err) {
        console.warn('[MarketService] ⚠️ IPO API failed, using fallback data');

        // Fallback with sample data structure
        return {
            upcoming: [
                {
                    name: 'Sample Upcoming IPO',
                    issuePrice: '₹100-120',
                    openDate: 'TBA',
                    closeDate: 'TBA',
                    lotSize: 100,
                    issueSize: '₹500 Cr',
                    status: 'upcoming'
                }
            ],
            live: [],
            recent: [],
            fetchedAt: Date.now(),
            isFallback: true
        };
    }
}

// ============================================
// 4. MARKET MOVERS (Gainers/Losers)
// ============================================

const TOP_STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'BAJFINANCE.NS'
];

export async function fetchTopMovers() {
    console.log('[MarketService] Fetching top movers...');

    const results = [];

    // Fetch top 15 stocks
    for (const symbol of TOP_STOCKS.slice(0, 10)) {
        try {
            const url = `${YAHOO_PROXY}${encodeURIComponent(symbol)}?interval=1d&range=1d`;
            const response = await fetch(url);
            const data = await response.json();

            const quote = data.chart?.result?.[0];
            if (!quote) continue;

            const meta = quote.meta;
            const currentPrice = meta.regularMarketPrice;
            const prevClose = meta.chartPreviousClose || meta.previousClose;
            const change = currentPrice - prevClose;
            const changePercent = ((change / prevClose) * 100).toFixed(2);

            results.push({
                symbol: symbol.replace('.NS', ''),
                price: currentPrice.toFixed(2),
                change: change.toFixed(2),
                changePercent: parseFloat(changePercent),
                direction: change >= 0 ? 'up' : 'down',
                volume: meta.regularMarketVolume || 0
            });
        } catch (err) {
            console.warn(`[MarketService] ⚠️ Failed ${symbol}`);
        }
    }

    // Sort to get gainers and losers
    const sorted = results.sort((a, b) => b.changePercent - a.changePercent);

    return {
        gainers: sorted.filter(s => s.changePercent > 0).slice(0, 5),
        losers: sorted.filter(s => s.changePercent < 0).slice(-5).reverse(),
        fetchedAt: Date.now()
    };
}

// ============================================
// 5. COMBINED MARKET DATA FETCH
// ============================================

export async function fetchAllMarketData() {
    console.log('[MarketService] 🚀 Fetching all market data...');

    const [indices, mutualFunds, ipoData, movers] = await Promise.allSettled([
        fetchIndices(),
        fetchMutualFunds(),
        fetchIPOData(),
        fetchTopMovers()
    ]);

    const result = {
        indices: indices.status === 'fulfilled' ? indices.value : [],
        mutualFunds: mutualFunds.status === 'fulfilled' ? mutualFunds.value : [],
        ipo: ipoData.status === 'fulfilled' ? ipoData.value : { upcoming: [], live: [], recent: [] },
        movers: movers.status === 'fulfilled' ? movers.value : { gainers: [], losers: [] },
        fetchedAt: Date.now(),
        errors: {
            indices: indices.status === 'rejected' ? indices.reason?.message : null,
            mutualFunds: mutualFunds.status === 'rejected' ? mutualFunds.reason?.message : null,
            ipo: ipoData.status === 'rejected' ? ipoData.reason?.message : null,
            movers: movers.status === 'rejected' ? movers.reason?.message : null
        }
    };

    console.log('[MarketService] ✅ All market data fetched');
    return result;
}

// Export individual functions for flexibility
export default {
    fetchIndices,
    fetchMutualFunds,
    fetchIPOData,
    fetchTopMovers,
    fetchAllMarketData
};
