/**
 * Verify Feed Script
 * Runs in Node to verify if RSS proxies are returning data.
 */
// Node 18+ has global fetch


async function checkFeeds() {
    console.log("------------------------------------------");
    console.log("   VERIFYING NEWS FEEDS (NODE.JS)         ");
    console.log("------------------------------------------");

    const sections = ['World', 'India']; // Key sections to check

    for (const query of sections) {
        console.log(`\n🔍 Checking '${query}' via Google News RSS + rss2json...`);
        try {
            const rssUrl = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-IN&gl=IN&ceid=IN:en`;
            const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

            const start = Date.now();
            const response = await fetch(proxyUrl);
            const data = await response.json();
            const duration = Date.now() - start;

            if (data.status === 'ok' && data.items.length > 0) {
                console.log(`✅ SUCCESS (${duration}ms)`);
                console.log(`   Top Headline: ${data.items[0].title}`);
                console.log(`   Time: ${data.items[0].pubDate}`);
            } else {
                console.log(`❌ FAILED or EMPTY`);
                console.log(`   Status: ${data.status}`);
            }
        } catch (e) {
            console.log(`❌ ERROR: ${e.message}`);
        }
    }
}

// Check Bing/DDG Fallback
async function checkBing() {
    console.log(`\n🔍 Checking 'Technology' via Bing RSS (DDG Mode)...`);
    try {
        const rssUrl = `https://www.bing.com/news/search?q=Technology&format=rss`;
        const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`;

        const response = await fetch(proxyUrl);
        const data = await response.json();

        if (data.status === 'ok') {
            console.log(`✅ SUCCESS`);
            console.log(`   Top Headline: ${data.items?.[0]?.title || 'N/A'}`);
        } else {
            console.log(`❌ FAILED: ${JSON.stringify(data)}`);
        }
    } catch (e) {
        console.log(`❌ ERROR: ${e.message}`);
    }
}

checkFeeds().then(checkBing);
