
function assert(condition, message) {
    if (condition) {
        console.log(`✅ PASS: ${message}`);
    } else {
        console.error(`❌ FAIL: ${message}`);
        throw new Error(message);
    }
}

async function runTests() {
    console.log('--- Starting Tests: IndianMarketService ---');

    // MOCK GLOBALS
    const mockStorage = new Map();
    global.localStorage = {
        getItem: (key) => mockStorage.get(key) || null,
        setItem: (key, val) => mockStorage.set(key, val)
    };

    // DOMParser Mock
    global.DOMParser = class {
        parseFromString() {
            return {
                querySelectorAll: (sel) => {
                     if (sel === 'table') return [{
                        textContent: "IPO Price",
                        querySelectorAll: (sel) => {
                             if (sel === 'tr') return [
                                 {}, // Header row
                                 {
                                     querySelectorAll: (sel) => [
                                         { textContent: "Test IPO" },
                                         { textContent: "Upcoming" },
                                         { textContent: "2026-01-01" },
                                         { textContent: "100" }
                                     ]
                                 }
                             ];
                             return [];
                        }
                    }];
                    return [];
                }
            };
        }
    };

    global.fetch = async (url) => {
        if (url.includes('yahoo') && url.includes('NSEI')) {
             return {
                 ok: true,
                 json: async () => ({
                     chart: { result: [{ meta: { regularMarketPrice: 19500, regularMarketTime: 1234567890 } }] }
                 })
             };
        }
        if (url.includes('yahoo')) { // Other yahoo calls
             return {
                 ok: true,
                 json: async () => ({
                     chart: { result: [{ meta: { regularMarketPrice: 100, regularMarketTime: 1234567890 } }] }
                 })
             };
        }
        if (url.includes('ipowatch')) {
            const longString = ' '.repeat(500);
            return {
                ok: true,
                text: async () => '<html><table><tr><td>IPO Name</td><td>Upcoming</td><td>2026-01-01</td><td>100</td></tr></table></html>' + longString
            };
        }
        return { ok: false, status: 404 };
    };

    // Import service
    const service = await import('./indianMarketService.js');

    // TEST 1: fetchIndices uses cache
    console.log('Test 1: fetchIndices uses cache');
    // First call - should fetch
    const data1 = await service.fetchIndices();
    assert(data1.length > 0, 'Indices fetched');
    assert(data1.find(d => d.name === 'NIFTY 50'), 'Nifty found');
    assert(mockStorage.has('market_cache_indices'), 'Cache set');

    // Modify cache to verify second call uses it
    const cachedData = JSON.parse(mockStorage.get('market_cache_indices'));
    cachedData.data[0].value = "99,999.00";
    mockStorage.set('market_cache_indices', JSON.stringify(cachedData));

    // Second call
    const data2 = await service.fetchIndices();
    assert(data2[0].value === "99,999.00", 'Used modified cache');

    // TEST 2: IPO Data
    console.log('Test 2: IPO Data');
    const ipo = await service.fetchIPOData();
    assert(ipo.upcoming.length > 0 || ipo.recent.length > 0, 'IPO data returned');

    console.log('\nAll tests passed');
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
