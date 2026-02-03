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
    niftyMidcap: 'NIFTYMIDCAP150.NS',
    // Sectoral Indices (Phase 2)
    niftyPharma: '^CNXPHARMA',
    niftyAuto: '^CNXAUTO'
};

// Yahoo Finance API Base
const YAHOO_BASE = 'https://query1.finance.yahoo.com/v8/finance/chart/';

// Helper to fetch with CORS proxy
async function fetchYahooData(symbol) {
    const targetUrl = `${YAHOO_BASE}${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const fetchWithTimeout = async (url, options = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    };

    // Strategy 1: Direct (works in some environments/extensions)
    try {
        const response = await fetchWithTimeout(targetUrl);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        // Ignore and try proxy
    }

    // Strategy 2: AllOrigins (CORS Proxy)
    try {
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
        const response = await fetchWithTimeout(proxyUrl);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.warn(`[MarketService] Proxy failed for ${symbol}:`, e);
    }

    throw new Error('Failed to fetch market data');
}

// Helper to extract price data from Yahoo response
function extractYahooPrice(data) {
    const quote = data.chart?.result?.[0]?.meta;
    if (!quote) return null;

    const currentPrice = quote.regularMarketPrice;
    const prevClose = quote.chartPreviousClose || quote.previousClose;
    const change = currentPrice - prevClose;
    const changePercent = prevClose ? ((change / prevClose) * 100) : 0;
    const timestamp = quote.regularMarketTime ? quote.regularMarketTime * 1000 : Date.now();

    return {
        price: currentPrice,
        change: change,
        changePercent: changePercent.toFixed(2),
        timestamp: timestamp
    };
}

export async function fetchIndices() {
    console.log('[MarketService] Fetching Indian indices...');

    const promises = Object.entries(INDICES).map(async ([name, symbol]) => {
        try {
            const data = await fetchYahooData(symbol);
            const priceData = extractYahooPrice(data);

            if (!priceData) return null;

            console.log(`[MarketService] ✅ ${name}: ${priceData.price}`);
            return {
                name: name === 'nifty50' ? 'NIFTY 50' :
                    name === 'sensex' ? 'SENSEX' :
                        name === 'niftyBank' ? 'BANK NIFTY' :
                            name === 'niftyIT' ? 'NIFTY IT' : 'MIDCAP 150',
                symbol: symbol,
                value: priceData.price.toLocaleString('en-IN'),
                change: priceData.change.toFixed(2),
                changePercent: priceData.changePercent,
                direction: priceData.change >= 0 ? 'up' : 'down',
                currency: '₹',
                timestamp: priceData.timestamp
            };
        } catch (err) {
            console.warn(`[MarketService] ⚠️ Failed to fetch ${name}:`, err.message);
            return null;
        }
    });

    const results = await Promise.all(promises);
    return results.filter(item => item !== null);
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

    const promises = TOP_STOCKS.slice(0, 10).map(async (symbol) => {
        try {
            const data = await fetchYahooData(symbol);
            const priceData = extractYahooPrice(data);

            if (!priceData) return null;

            const quote = data.chart?.result?.[0];
            const meta = quote.meta;

            return {
                symbol: symbol.replace('.NS', ''),
                price: priceData.price.toFixed(2),
                change: priceData.change.toFixed(2),
                changePercent: parseFloat(priceData.changePercent),
                direction: priceData.change >= 0 ? 'up' : 'down',
                volume: meta.regularMarketVolume || 0
            };
        } catch (err) {
            console.warn(`[MarketService] ⚠️ Failed ${symbol}`);
            return null;
        }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(r => r !== null);

    // Sort to get gainers and losers
    const sorted = validResults.sort((a, b) => b.changePercent - a.changePercent);

    return {
        gainers: sorted.filter(s => s.changePercent > 0).slice(0, 5),
        losers: sorted.filter(s => s.changePercent < 0).slice(-5).reverse(),
        fetchedAt: Date.now()
    };
}

// ============================================
// 5. SECTORAL INDICES (Phase 2)
// ============================================

export async function fetchSectoralIndices() {
    console.log('[MarketService] Fetching sectoral indices...');

    const sectorals = [
        { key: 'niftyBank', name: 'Bank Nifty', symbol: INDICES.niftyBank },
        { key: 'niftyIT', name: 'Nifty IT', symbol: INDICES.niftyIT },
        { key: 'niftyPharma', name: 'Nifty Pharma', symbol: INDICES.niftyPharma },
        { key: 'niftyAuto', name: 'Nifty Auto', symbol: INDICES.niftyAuto }
    ];

    const results = await Promise.allSettled(
        sectorals.map(async (sector) => {
            const data = await fetchYahooData(sector.symbol);
            const priceData = extractYahooPrice(data);

            if (!priceData) throw new Error('No data');

            return {
                name: sector.name,
                value: priceData.price.toFixed(2),
                change: priceData.change.toFixed(2),
                changePercent: priceData.changePercent,
                timestamp: priceData.timestamp
            };
        })
    );

    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
}

// ============================================
// 6. COMMODITIES (Gold, Silver, Crude in INR)
// ============================================

export async function fetchCommodities() {
    console.log('[MarketService] Fetching commodities...');

    try {
        // 1. Fetch USD/INR Rate first (for conversion)
        const usdInrData = await fetchYahooData('INR=X');
        const usdPriceData = extractYahooPrice(usdInrData);
        // Default to 84.0 if fetch fails, but it usually works
        const usdRate = usdPriceData ? usdPriceData.price : 84.0;
        console.log(`[MarketService] Live USD Rate: ${usdRate}`);

        // 2. Fetch Commodities (Gold, Silver, Crude)
        const commoditiesList = [
            { name: 'Gold', symbol: 'GC=F', type: 'gold' },
            { name: 'Silver', symbol: 'SI=F', type: 'silver' },
            { name: 'Crude Oil', symbol: 'CL=F', type: 'crude' }
        ];

        const results = await Promise.allSettled(
            commoditiesList.map(async (commodity) => {
                try {
                    const data = await fetchYahooData(commodity.symbol);
                    const priceData = extractYahooPrice(data);

                    if (!priceData) throw new Error('No data');

                    console.log(`[MarketService] ${commodity.name} Raw: Price=${priceData.price}, USD=${usdRate}`);

                    let value, change, unit;

                    if (commodity.type === 'gold') {
                        // Gold: Price per gram
                        // Formula: (USD/oz * USD_INR / 31.1035)
                        value = (priceData.price * usdRate) / 31.1035;
                        change = (priceData.change * usdRate) / 31.1035;
                        unit = '₹/g';
                    } else if (commodity.type === 'silver') {
                        // Silver: Price per kg
                        // Formula: (USD/oz * USD_INR / 31.1035) * 1000
                        value = ((priceData.price * usdRate) / 31.1035) * 1000;
                        change = ((priceData.change * usdRate) / 31.1035) * 1000;
                        unit = '₹/kg';
                    } else {
                        // Crude: Price per barrel
                        // Formula: USD/bbl * USD_INR
                        value = priceData.price * usdRate;
                        change = priceData.change * usdRate;
                        unit = '₹/bbl';
                    }

                    return {
                        name: commodity.name,
                        value: value.toFixed(2),
                        change: change.toFixed(2),
                        changePercent: priceData.changePercent,
                        unit: unit,
                        direction: change >= 0 ? 'up' : 'down',
                        timestamp: priceData.timestamp
                    };
                } catch (err) {
                    console.error(`[MarketService] Failed ${commodity.name}: ${err.message}`);
                    throw err;
                }
            })
        );

        return results
            .filter(r => r.status === 'fulfilled')
            .map(r => r.value);

    } catch (error) {
        console.error('[MarketService] Failed to fetch commodities:', error);
        return [];
    }
}

// ============================================
// 7. CURRENCY RATES (USD, EUR, AED to INR)
// ============================================

export async function fetchCurrencyRates() {
    console.log('[MarketService] Fetching currency rates...');

    const currencies = [
        { name: 'USD/INR', symbol: 'INR=X' },
        { name: 'EUR/INR', symbol: 'EURINR=X' },
        { name: 'OMR/INR', symbol: 'OMRINR=X' }
    ];

    const results = await Promise.allSettled(
        currencies.map(async (currency) => {
            const data = await fetchYahooData(currency.symbol);
            const priceData = extractYahooPrice(data);

            if (!priceData) throw new Error('No data');

            return {
                name: currency.name,
                value: priceData.price.toFixed(2),
                change: priceData.change.toFixed(2),
                changePercent: priceData.changePercent,
                timestamp: priceData.timestamp
            };
        })
    );

    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);
}

// ============================================
// 8. FII/DII ACTIVITY (Mock data)
// ============================================

export async function fetchFIIDII() {
    console.log('[MarketService] Fetching FII/DII activity...');

    // Note: Real FII/DII data requires NSE authentication
    // Using mock data for demonstration
    return {
        fii: {
            buy: 12500.5,
            sell: 11800.3,
            net: 700.2
        },
        dii: {
            buy: 8900.7,
            sell: 9200.4,
            net: -299.7
        },
        date: new Date().toISOString().split('T')[0]
    };
}

// ============================================
// 9. COMBINED MARKET DATA FETCH
// ============================================

export async function fetchAllMarketData() {
    console.log('[MarketService] 🚀 Fetching all market data...');

    const [indices, mutualFunds, ipoData, movers, sectorals, commodities, currencies, fiidii] = await Promise.allSettled([
        fetchIndices(),
        fetchMutualFunds(),
        fetchIPOData(),
        fetchTopMovers(),
        fetchSectoralIndices(),
        fetchCommodities(),
        fetchCurrencyRates(),
        fetchFIIDII()
    ]);

    const result = {
        indices: indices.status === 'fulfilled' ? indices.value : [],
        mutualFunds: mutualFunds.status === 'fulfilled' ? mutualFunds.value : [],
        ipo: ipoData.status === 'fulfilled' ? ipoData.value : { upcoming: [], live: [], recent: [] },
        movers: movers.status === 'fulfilled' ? movers.value : { gainers: [], losers: [] },
        sectorals: sectorals.status === 'fulfilled' ? sectorals.value : [],
        commodities: commodities.status === 'fulfilled' ? commodities.value : [],
        currencies: currencies.status === 'fulfilled' ? currencies.value : [],
        fiidii: fiidii.status === 'fulfilled' ? fiidii.value : { fii: {}, dii: {}, date: '' },
        fetchedAt: Date.now(),
        errors: {
            indices: indices.status === 'rejected' ? indices.reason?.message : null,
            mutualFunds: mutualFunds.status === 'rejected' ? mutualFunds.reason?.message : null,
            ipo: ipoData.status === 'rejected' ? ipoData.reason?.message : null,
            movers: movers.status === 'rejected' ? movers.reason?.message : null,
            sectorals: sectorals.status === 'rejected' ? sectorals.reason?.message : null,
            commodities: commodities.status === 'rejected' ? commodities.reason?.message : null,
            currencies: currencies.status === 'rejected' ? currencies.reason?.message : null,
            fiidii: fiidii.status === 'rejected' ? fiidii.reason?.message : null
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
    fetchSectoralIndices,
    fetchCommodities,
    fetchCurrencyRates,
    fetchFIIDII,
    fetchAllMarketData
};
