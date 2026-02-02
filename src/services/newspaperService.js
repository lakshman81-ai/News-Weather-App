const PROXY_URL = 'https://api.allorigins.win/raw?url=';
const FALLBACK_PROXY_URL = 'https://corsproxy.io/?';

export const NEWSPAPER_SOURCES = {
  THE_HINDU: 'The Hindu (TN)',
  INDIAN_EXPRESS: 'Indian Express (National)'
};

const cleanText = (text) => {
  return text ? text.replace(/\s+/g, ' ').trim() : '';
};

const fetchWithProxy = async (url) => {
    try {
        const response = await fetch(`${PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.text();
    } catch (error) {
        console.warn('Primary proxy failed, trying fallback...', error);
        const response = await fetch(`${FALLBACK_PROXY_URL}${encodeURIComponent(url)}`);
        if (!response.ok) throw new Error('Fallback network response was not ok');
        return await response.text();
    }
};

export const fetchTheHinduPaper = async () => {
  try {
    const html = await fetchWithProxy('https://www.thehindu.com/todays-paper/');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections = [];

    // Strategy 1: Look for .element (Classic layout)
    const elements = doc.querySelectorAll('.element, .story-card');
    let currentSectionTitle = 'Front Page';
    let currentArticles = [];
    let lastPageNum = '';

    elements.forEach(el => {
        const titleEl = el.querySelector('h3.title a, .story-card-news a');
        const blurbEl = el.querySelector('.sub-text a, .story-card-news h3');
        const pageNumEl = el.querySelector('.page-num, .page-no');

        if (titleEl) {
            const pageNum = pageNumEl ? cleanText(pageNumEl.textContent) : '';

            // Check if this article belongs to Page 1 or 2 (Front Pages)
            // Or if it's a new section
            if (pageNum && pageNum !== lastPageNum) {
                if (currentArticles.length > 0) {
                    sections.push({ title: currentSectionTitle, articles: currentArticles });
                    currentArticles = [];
                }
                currentSectionTitle = `Page ${pageNum}`;
                lastPageNum = pageNum;
            }

            const title = cleanText(titleEl.textContent);
            const link = titleEl.href;
            const blurb = blurbEl ? cleanText(blurbEl.textContent) : '';

            if (title && link) {
                currentArticles.push({ title, link, blurb });
            }
        }
    });

    if (currentArticles.length > 0) {
        sections.push({ title: currentSectionTitle, articles: currentArticles });
    }

    // Strategy 2: If empty, try the new "Section" based layout
    if (sections.length === 0) {
        const sectionContainers = doc.querySelectorAll('.section-container, .tpaper-section');
        sectionContainers.forEach(container => {
             const titleNode = container.querySelector('h2, .section-heading');
             const articlesNodes = container.querySelectorAll('a.story-card-news, .element a');

             if (titleNode && articlesNodes.length > 0) {
                 const title = cleanText(titleNode.textContent);
                 const articles = Array.from(articlesNodes).map(a => ({
                     title: cleanText(a.textContent),
                     link: a.href,
                     blurb: ''
                 })).filter(a => a.title);

                 if (articles.length > 0) {
                     sections.push({ title, articles });
                 }
             }
        });
    }

    return sections;
  } catch (error) {
    console.error('Error fetching The Hindu:', error);
    return [];
  }
};

export const fetchIndianExpressPaper = async () => {
  try {
    // Strategy: Fetch "Latest News" or "Nation" as Todays Paper might be behind paywall/structure change
    // But let's try the print-order page first if it exists
    const html = await fetchWithProxy('https://indianexpress.com/todays-paper/');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections = [];
    const sectionDivs = doc.querySelectorAll('.jobs_section, .section-container, .t-paper-sec, .section');

    if (sectionDivs.length > 0) {
         sectionDivs.forEach(div => {
             const h2 = div.querySelector('h2, .section-title, .heading');
             if (h2) {
                 const title = cleanText(h2.textContent);
                 const articles = [];
                 const items = div.querySelectorAll('li, .article-list-item, .story');

                 items.forEach(li => {
                     const a = li.querySelector('h3 a') || li.querySelector('a');
                     if (a && cleanText(a.textContent)) {
                        articles.push({
                            title: cleanText(a.textContent),
                            link: a.getAttribute('href'),
                            blurb: ''
                        });
                     }
                 });
                 if (articles.length > 0) sections.push({ title, articles });
             }
         });
    }

    // FALLBACK: If "Today's Paper" scraping failed (likely due to layout change),
    // fetch the "Latest News" page which mimics the front page feed.
    if (sections.length === 0) {
        console.warn('Indian Express Todays Paper empty, falling back to Latest News...');
        const fallbackHtml = await fetchWithProxy('https://indianexpress.com/latest-news/');
        const fallbackDoc = parser.parseFromString(fallbackHtml, 'text/html');

        const latestArticles = [];
        const articleNodes = fallbackDoc.querySelectorAll('.nation .articles, .articles .title a, .story h3 a');

        articleNodes.forEach(a => {
            if (a.textContent && a.href) {
                latestArticles.push({
                    title: cleanText(a.textContent),
                    link: a.href,
                    blurb: ''
                });
            }
        });

        if (latestArticles.length > 0) {
            sections.push({ title: 'Latest Stories (Fallback)', articles: latestArticles.slice(0, 20) });
        }
    }

    return sections;
  } catch (error) {
    console.error('Error fetching Indian Express:', error);
    return [];
  }
};

export const openPerplexitySummary = (text) => {
    // Open Perplexity with a query to summarize.
    // Truncate text to avoid URL length issues (approx 2000 chars safe limit)
    const truncatedText = text.substring(0, 1500);
    const query = `Summarize these news headlines and blurbs:\n${truncatedText}`;
    window.open(`https://www.perplexity.ai/?q=${encodeURIComponent(query)}`, '_blank');
};

// Deprecated
export const openDDGSummary = (text) => {
    openPerplexitySummary(text);
};
