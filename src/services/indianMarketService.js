// import { getSettings } from '../utils/storage';

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

// ============================================
// CACHING LAYER
// ============================================

const CACHE_KEYS = {
    indices: 'market_cache_indices',
    movers: 'market_cache_movers',
    commodities: 'market_cache_commodities',
    ipo: 'market_cache_ipo',
    sectorals: 'market_cache_sectorals',
    currencies: 'market_cache_currencies',
    mutualFunds: 'market_cache_mf'
};

const CACHE_TTL = {
    indices: 15 * 60 * 1000,       // 15 minutes
    movers: 15 * 60 * 1000,        // 15 minutes
    commodities: 60 * 60 * 1000,   // 1 hour
    ipo: 4 * 60 * 60 * 1000,       // 4 hours
    sectorals: 15 * 60 * 1000,     // 15 minutes
    currencies: 30 * 60 * 1000,    // 30 minutes
    mutualFunds: 60 * 60 * 1000    // 1 hour
};

function getCachedData(key) {
    try {
        const raw = localStorage.getItem(CACHE_KEYS[key]);
        if (!raw) return null;
        const { data, timestamp } = JSON.parse(raw);
        const age = Date.now() - timestamp;
        if (age > CACHE_TTL[key]) {
            console.log(`[MarketCache] ${key} cache expired (${Math.round(age/60000)}min old)`);
            return null; // Expired
        }
        console.log(`[MarketCache] ${key} cache hit (${Math.round(age/60000)}min old)`);
        return data;
    } catch (e) {
        return null;
    }
}

function setCachedData(key, data) {
    try {
        localStorage.setItem(CACHE_KEYS[key], JSON.stringify({
            data,
            timestamp: Date.now()
        }));
    } catch (e) {
        console.warn(`[MarketCache] Failed to cache ${key}:`, e.message);
    }
}

// Stale cache: return data even if expired (better than nothing)
function getStaleCachedData(key) {
    try {
        const raw = localStorage.getItem(CACHE_KEYS[key]);
        if (!raw) return null;
        const { data } = JSON.parse(raw);
        console.log(`[MarketCache] ${key} using stale cache as fallback`);
        return data;
    } catch (e) {
        return null;
    }
}

// ============================================
// RETRY UTILITY
// ============================================

async function fetchWithRetry(fn, maxRetries = 2, baseDelay = 1500) {
    let lastError;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (e) {
            lastError = e;
            if (attempt < maxRetries) {
                const delay = baseDelay * Math.pow(2, attempt);
                console.warn(`[MarketService] Attempt ${attempt + 1} failed, retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
            }
        }
    }
    throw lastError;
}

// Proxy Rotation Strategy
const PROXIES = [
    // Strategy 1: AllOrigins (Verified working for Yahoo)
    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
    // Strategy 2: CodeTabs (Verified working general proxy)
    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
    // Strategy 3: CorsProxy.io (Global CDN, reliable)
    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`
];

// Helper to fetch with CORS proxy rotation
async function fetchYahooData(symbol) {
    const targetUrl = `${YAHOO_BASE}${encodeURIComponent(symbol)}?interval=1d&range=1d`;

    const fetchWithTimeout = async (url, options = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            clearTimeout(id);
            return response;
        } catch (e) {
            clearTimeout(id);
            throw e;
        }
    };

    // Try Proxies sequentially
    for (const proxyGen of PROXIES) {
        try {
            const proxyUrl = proxyGen(targetUrl);
            const response = await fetchWithTimeout(proxyUrl);
            if (response.ok) {
                return await response.json();
            }
        } catch (e) {
            console.warn(`[MarketService] Proxy failed: ${e.message}`);
            // Continue to next proxy
        }
    }

    throw new Error(`Failed to fetch market data for ${symbol}`);
}

// Helper to extract price data from Yahoo response
function extractYahooPrice(data) {
    // Yahoo often wraps in chart.result[0]
    const result = data.chart?.result?.[0] || data.finance?.result?.[0];
    if (!result || !result.meta) return null;

    const quote = result.meta;
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
    const cached = getCachedData('indices');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
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
                            name === 'niftyIT' ? 'NIFTY IT' :
                            name === 'niftyPharma' ? 'NIFTY PHARMA' :
                            name === 'niftyAuto' ? 'NIFTY AUTO' : 'MIDCAP 150',
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
            const validData = results.filter(item => item !== null);

            if (validData.length === 0) throw new Error("No index data fetched");
            return validData;
        });

        setCachedData('indices', result);
        return result;
    } catch (err) {
        console.error('[MarketService] All index fetch attempts failed:', err.message);
        return getStaleCachedData('indices') || [];
    }
}

// ============================================
// 2. MUTUAL FUNDS (mfapi.in - FREE, no key)
// ============================================

const MF_API = 'https://api.mfapi.in/mf/';

// Popular scheme codes
const POPULAR_MF_SCHEMES = [
    { code: '119551', name: 'SBI Bluechip Fund' },
    { code: '120503', name: 'HDFC Mid-Cap Opportunities' },
    { code: '118834', name: 'ICICI Prudential Value Discovery' },
    { code: '122639', name: 'Axis Long Term Equity Fund' },
    { code: '125354', name: 'Mirae Asset Large Cap Fund' },
    { code: '118989', name: 'Kotak Emerging Equity Fund' }
];

export async function fetchMutualFunds() {
    const cached = getCachedData('mutualFunds');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
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

            if (successful.length === 0) throw new Error("No MF data fetched");
            return successful;
        });

        setCachedData('mutualFunds', result);
        return result;
    } catch (err) {
        console.error('[MarketService] Mutual Funds fetch failed:', err.message);
        return getStaleCachedData('mutualFunds') || [];
    }
}

// ============================================
// 3. IPO DATA (Scraping ipowatch.in)
// ============================================

export async function fetchIPOData() {
    const cached = getCachedData('ipo');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
            console.log('[MarketService] Fetching IPO data from IPOWatch...');
            const targetUrl = 'https://ipowatch.in/upcoming-ipo-calendar-ipo-list/';

            let html = null;
            let lastError;

            // Try proxies sequentially
            for (const proxyGen of PROXIES) {
                try {
                    const proxyUrl = proxyGen(targetUrl);
                    const response = await fetch(proxyUrl);
                    if (!response.ok) throw new Error(`Status ${response.status}`);

                    const text = await response.text();
                    if (text && text.length > 500) {
                        html = text;
                        break;
                    }
                } catch (e) {
                    lastError = e;
                    console.warn(`[IPO] Proxy attempt failed: ${e.message}`);
                }
            }

            if (!html) throw lastError || new Error("All proxies failed for IPO");

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Find the main table (Updated logic for 2026 format)
            // Table often contains "IPO" and "Price" in header
            const tables = doc.querySelectorAll('table');
            let table = null;

            for (const t of tables) {
                const text = t.textContent.toLowerCase();
                if ((text.includes('ipo') && text.includes('price')) || text.includes('ipo name')) {
                    table = t;
                    break;
                }
            }

            if (!table) throw new Error('No IPO table found');

            const rows = Array.from(table.querySelectorAll('tr'));
            const ipos = [];

            // Parse rows (Skip header)
            for (let i = 1; i < rows.length; i++) {
                const cols = rows[i].querySelectorAll('td');
                // Expecting at least 4 cols: Name, Status, Date, Price
                if (cols.length < 3) continue;

                const name = cols[0]?.textContent?.trim() || 'Unknown';
                // Column 1 is usually Status in new layout ("Upcoming", "Closed")
                // But sometimes it might be old layout. Let's heuristic.

                let statusRaw = 'Upcoming';
                let dateRaw = 'TBA';
                let priceRaw = '-';

                // Check if Col 1 is a date or status
                const col1Text = cols[1]?.textContent?.trim();
                const col2Text = cols[2]?.textContent?.trim();

                // Simple heuristic: Status is usually single word or short phrase
                if (col1Text) statusRaw = col1Text;
                if (col2Text) dateRaw = col2Text;

                // Determine standardized status
                let status = 'upcoming';
                const lowerStatus = statusRaw.toLowerCase();
                if (lowerStatus.includes('live') || lowerStatus.includes('open')) {
                    status = 'live';
                } else if (lowerStatus.includes('close')) {
                    status = 'recent';
                } else if (lowerStatus.includes('upcoming')) {
                    status = 'upcoming';
                }

                // Simple check if name contains SME
                const isSME = name.includes('SME') || table.textContent.includes('SME');

                ipos.push({
                    name,
                    openDate: dateRaw, // Display raw date range string
                    closeDate: '',     // No separate close date column in simple table
                    status,
                    isSME,
                    issueSize: '-'
                });
            }

            // Categorize
            const upcoming = ipos.filter(i => i.status === 'upcoming').slice(0, 5);
            const live = ipos.filter(i => i.status === 'live');
            const recent = ipos.filter(i => i.status === 'recent').slice(0, 5);

            return {
                upcoming: upcoming.length ? upcoming : ipos.slice(0, 3),
                live: live,
                recent: recent.length ? recent : ipos.slice(3, 6),
                fetchedAt: Date.now()
            };
        });

        setCachedData('ipo', result);
        return result;

    } catch (err) {
        console.error('[MarketService] IPO Fetch Failed:', err);
        const stale = getStaleCachedData('ipo');
        if (stale) return stale;

        return {
            upcoming: [],
            live: [],
            recent: [],
            fetchedAt: Date.now(),
            error: err.message
        };
    }
}

// ============================================
// 4. MARKET MOVERS (Gainers/Losers)
// ============================================

// Fallback: Use the static list if screener fails (Original Logic)
const TOP_STOCKS = [
    'RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'ICICIBANK.NS',
    'HINDUNILVR.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'ITC.NS', 'KOTAKBANK.NS',
    'LT.NS', 'AXISBANK.NS', 'ASIANPAINT.NS', 'MARUTI.NS', 'BAJFINANCE.NS'
];

export async function fetchTopMovers() {
    const cached = getCachedData('movers');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
            console.log('[MarketService] Fetching top movers...');
            const promises = TOP_STOCKS.slice(0, 10).map(async (symbol) => {
                try {
                    const data = await fetchYahooData(symbol);
                    const priceData = extractYahooPrice(data);
                    if (!priceData) return null;
                    return {
                        symbol: symbol.replace('.NS', ''),
                        price: priceData.price.toFixed(2),
                        change: priceData.change.toFixed(2),
                        changePercent: parseFloat(priceData.changePercent),
                        direction: priceData.change >= 0 ? 'up' : 'down'
                    };
                } catch (err) { return null; }
            });

            const results = await Promise.all(promises);
            const valid = results.filter(r => r !== null);

            if (valid.length === 0) throw new Error("No top movers data fetched");

            const sorted = valid.sort((a, b) => b.changePercent - a.changePercent);

            return {
                gainers: sorted.filter(s => s.changePercent > 0).slice(0, 5),
                losers: sorted.filter(s => s.changePercent < 0).slice(-5).reverse()
            };
        });

        setCachedData('movers', result);
        return result;
    } catch (err) {
        console.error('[MarketService] Top Movers fetch failed:', err.message);
        return getStaleCachedData('movers') || { gainers: [], losers: [] };
    }
}

// ============================================
// 5. SECTORAL INDICES (Phase 2)
// ============================================

export async function fetchSectoralIndices() {
    const cached = getCachedData('sectorals');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
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

            const successful = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value);

            if (successful.length === 0) throw new Error("No sectoral data fetched");
            return successful;
        });

        setCachedData('sectorals', result);
        return result;

    } catch (err) {
        console.error('[MarketService] Sectoral Indices fetch failed:', err.message);
        return getStaleCachedData('sectorals') || [];
    }
}

// ============================================
// 6. COMMODITIES (Gold, Silver, Crude in INR)
// ============================================

export async function fetchCommodities() {
    const cached = getCachedData('commodities');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
            console.log('[MarketService] Fetching commodities...');

            // 1. Fetch USD rate first (crucial)
            let usdRate = 84.0;
            try {
                const usdInrData = await fetchYahooData('INR=X');
                const usdPriceData = extractYahooPrice(usdInrData);
                if (usdPriceData) usdRate = usdPriceData.price;
            } catch (e) { console.warn("[MarketService] Failed to fetch USD rate, using default 84.0"); }

            const commoditiesList = [
                { name: 'Gold', symbol: 'GC=F', type: 'gold' },
                { name: 'Silver', symbol: 'SI=F', type: 'silver' },
                { name: 'Crude Oil', symbol: 'CL=F', type: 'crude' }
            ];

            const results = await Promise.allSettled(
                commoditiesList.map(async (commodity) => {
                    let priceData = null;
                    try {
                        const data = await fetchYahooData(commodity.symbol);
                        priceData = extractYahooPrice(data);
                    } catch (e) {
                        console.warn(`[MarketService] Failed to fetch ${commodity.name} (${commodity.symbol})`);
                    }

                    if (!priceData) throw new Error('No data');

                    let value, change, unit;

                    if (commodity.type === 'gold') {
                        value = (priceData.price * usdRate) / 31.1035;
                        change = (priceData.change * usdRate) / 31.1035;
                        unit = '₹/g';
                    } else if (commodity.type === 'silver') {
                        value = ((priceData.price * usdRate) / 31.1035) * 1000;
                        change = ((priceData.change * usdRate) / 31.1035) * 1000;
                        unit = '₹/kg';
                    } else {
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
                })
            );

            const successful = results
                .filter(r => r.status === 'fulfilled')
                .map(r => r.value);

            if (successful.length === 0) throw new Error("No commodities data fetched");
            return successful;
        });

        setCachedData('commodities', result);
        return result;

    } catch (err) {
        console.error('[MarketService] Commodities fetch failed:', err.message);
        return getStaleCachedData('commodities') || [];
    }
}

// ============================================
// 7. CURRENCY RATES
// ============================================

export async function fetchCurrencyRates() {
    const cached = getCachedData('currencies');
    if (cached) return cached;

    try {
        const result = await fetchWithRetry(async () => {
            console.log('[MarketService] Fetching currency rates...');

            const currencies = [
                { name: 'USD/INR', symbol: 'INR=X' },
                { name: 'OMR/INR', symbol: 'OMRINR=X' }
            ];

            // Attempt 1: Yahoo Finance
            const yahooPromises = currencies.map(async (currency) => {
                try {
                    const data = await fetchYahooData(currency.symbol);
                    const priceData = extractYahooPrice(data);
                    if (!priceData) throw new Error('No data');
                    return {
                        name: currency.name,
                        value: priceData.price.toFixed(2),
                        change: priceData.change.toFixed(2),
                        changePercent: priceData.changePercent,
                        timestamp: priceData.timestamp,
                        source: 'yahoo'
                    };
                } catch (e) {
                    return null;
                }
            });

            const yahooResults = await Promise.all(yahooPromises);

            // Check if we have valid results for all
            const validYahoo = yahooResults.filter(r => r !== null);
            if (validYahoo.length === currencies.length) {
                return validYahoo;
            }

            // Attempt 2: Fallback API (Open Exchange Rates)
            console.log('[MarketService] ⚠️ Yahoo Currency failed, using fallback...');
            try {
                const response = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await response.json();

                if (!data || !data.rates) throw new Error('Fallback API failed');

                const inr = data.rates.INR;
                const omr = data.rates.OMR;

                const fallbackResults = [];

                // USD/INR
                fallbackResults.push({
                    name: 'USD/INR',
                    value: inr.toFixed(2),
                    change: '0.00', // API doesn't provide change
                    changePercent: '0.00',
                    timestamp: Date.now(),
                    source: 'fallback'
                });

                // OMR/INR = (USD/INR) / (USD/OMR)
                if (omr) {
                    const omrInr = inr / omr;
                    fallbackResults.push({
                        name: 'OMR/INR',
                        value: omrInr.toFixed(2),
                        change: '0.00',
                        changePercent: '0.00',
                        timestamp: Date.now(),
                        source: 'fallback'
                    });
                }

                return fallbackResults;

            } catch (e) {
                console.error('[MarketService] ❌ All currency sources failed:', e);
                // Return whatever valid Yahoo results we had, if any, if fallback fails
                // But we are inside retry loop. If fallback fails, throw error so we retry everything?
                // Or if we have PARTIAL yahoo results, return them?

                if (validYahoo.length > 0) return validYahoo;
                throw e;
            }
        });

        setCachedData('currencies', result);
        return result;

    } catch (err) {
        console.error('[MarketService] Currency fetch failed:', err.message);
        return getStaleCachedData('currencies') || [];
    }
}

// ============================================
// 8. FII/DII ACTIVITY (Mock)
// ============================================

export async function fetchFIIDII() {
    // Mock data as real API needs auth
    return {
        fii: { buy: 12500.5, sell: 11800.3, net: 700.2 },
        dii: { buy: 8900.7, sell: 9200.4, net: -299.7 },
        date: new Date().toISOString().split('T')[0]
    };
}

// ============================================
// 9. COMBINED FETCH
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
            // Include errors for debugging
            indices: indices.status === 'rejected' ? indices.reason?.message : null
        }
    };

    return result;
}

export default {
    fetchAllMarketData,
    fetchIndices,
    fetchMutualFunds,
    fetchIPOData,
    fetchTopMovers,
    fetchSectoralIndices,
    fetchCommodities,
    fetchCurrencyRates,
    fetchFIIDII
};
