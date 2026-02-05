
import { calculateTemporalWeight } from './temporalScorer.js';
import { calculateGeoRelevance } from './geoScorer.js';
import { analyzeNoise } from './noiseFilter.js';
import { KNOWN_LOCATIONS } from './geoProfiles.js';

function runTests() {
    let passed = 0;
    let failed = 0;

    function assert(condition, message) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    console.log('--- Starting Tests: Ranking Modules ---');

    // --- TEMPORAL SCORER ---
    console.log('\n[Temporal Scorer]');

    // Test 1: Weekend Boost for Entertainment
    const thursday = new Date('2023-11-02T18:00:00'); // Thursday 6PM
    const monday = new Date('2023-11-06T10:00:00');   // Monday 10AM

    const entItem = { section: 'entertainment', publishedAt: thursday.getTime() };
    const w1 = calculateTemporalWeight(entItem, thursday);
    const w2 = calculateTemporalWeight(entItem, monday);

    assert(w1 > w2, `Entertainment higher on Thursday (${w1.toFixed(2)}) than Monday (${w2.toFixed(2)})`);

    // Test 2: Shopping Payday Boost
    const firstOfMonth = new Date('2023-11-01T10:00:00');
    const midMonth = new Date('2023-11-15T10:00:00');

    const shopItem = { section: 'shopping', title: 'Sale', publishedAt: firstOfMonth.getTime() };
    const s1 = calculateTemporalWeight(shopItem, firstOfMonth);
    const s2 = calculateTemporalWeight(shopItem, midMonth);

    assert(s1 > s2, `Shopping higher on 1st (${s1.toFixed(2)}) than 15th (${s2.toFixed(2)})`);

    // --- GEO SCORER ---
    console.log('\n[Geo Scorer]');

    const chennaiProfile = KNOWN_LOCATIONS.chennai;

    // Test 3: City Match
    const chennaiItem = { title: 'Heavy rains in Chennai', description: 'Floods expected', source: 'The Hindu' };
    const g1 = calculateGeoRelevance(chennaiItem, chennaiProfile);
    assert(g1 > 1.0, `Chennai item boosted for Chennai profile (${g1.toFixed(2)})`);

    // Test 4: Travel Away Penalty
    const travelItem = { title: 'Chennai residents travel to Bangalore for weekend', description: '' };
    const g2 = calculateGeoRelevance(travelItem, chennaiProfile);
    assert(g2 < 1.0, `Travel Away penalized (${g2.toFixed(2)})`);

    // --- NOISE FILTER ---
    console.log('\n[Noise Filter]');

    // Test 5: Clickbait
    const cbItem = { title: 'Doctors hate this one weird trick!' };
    const n1 = analyzeNoise(cbItem);
    assert(n1.isNoise === true, 'Clickbait detected');
    assert(n1.score < 1.0, 'Clickbait penalized');

    // Test 6: Normal
    const normItem = { title: 'Stock market updates for today' };
    const n2 = analyzeNoise(normItem);
    assert(n2.isNoise === false, 'Normal title not flagged');

    console.log(`\nTests Completed: ${passed} Passed, ${failed} Failed`);
}

runTests();
