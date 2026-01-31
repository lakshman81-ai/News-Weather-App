const RSS_PROXY_BASE = "https://api.rss2json.com/v1/api.json?rss_url=";
const ALL_ORIGINS_BASE = "https://api.allorigins.win/get?url=";

// Testing SEARCH-based URLs instead of TOPIC-based
const FEEDS = {
    business: "https://news.google.com/rss/search?q=Business+Economy+India&hl=en-IN&gl=IN&ceid=IN:en",
    tech: "https://news.google.com/rss/search?q=Technology+Startups+India&hl=en-IN&gl=IN&ceid=IN:en"
};

async function checkFeed(name, url) {
    console.log(`\nChecking ${name}...`);
    // console.log(`Target: ${url}`);

    // Strategy 1
    const proxyUrl = `${RSS_PROXY_BASE}${encodeURIComponent(url)}`;
    try {
        const res = await fetch(proxyUrl);
        const data = await res.json();
        if (data.status === 'ok') {
            console.log(`✅ [RSS2JSON] Success: ${data.items.length} items`);
            if (data.items.length > 0) {
                console.log(`   Sample: ${data.items[0].title}`);
                console.log(`   PubDate: ${data.items[0].pubDate}`);
            }
            return;
        } else {
            console.log(`❌ [RSS2JSON] Failed: ${data.message}`);
        }
    } catch (e) {
        console.log(`❌ [RSS2JSON] Error: ${e.message}`);
    }

    // Strategy 2
    console.log(`   Trying Fallback (AllOrigins)...`);
    const fallbackUrl = `${ALL_ORIGINS_BASE}${encodeURIComponent(url)}`;
    try {
        const res = await fetch(fallbackUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data.contents) {
            console.log(`✅ [AllOrigins] Success`);
            if (data.contents.includes('<rss') || data.contents.includes('<feed')) {
                console.log(`   Content looks like XML`);
            } else {
                console.log(`   Content does NOT look like XML`);
            }
        } else {
            console.log(`❌ [AllOrigins] Failed: No content`);
        }
    } catch (e) {
        console.log(`❌ [AllOrigins] Error: ${e.message}`);
    }
}

(async () => {
    console.log(`Node: ${process.version}`);
    await checkFeed('Business (Search)', FEEDS.business);
    await checkFeed('Technology (Search)', FEEDS.tech);
})();
