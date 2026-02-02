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

    // Expanded Selector list for modern Hindu layout
    // Includes .story-card-33 etc which are used for lead stories
    const elements = doc.querySelectorAll('.element, .story-card, .story-card-33, .story-card-75, .lead-story, .article, .story');
    let currentSectionTitle = 'Front Page';
    let currentArticles = [];
    let lastPageNum = '';

    elements.forEach(el => {
        // Expanded Title Selectors to catch different layouts
        const titleEl = el.querySelector('h3.title a, .story-card-news a, .story-title a, .headline a, h3 a');
        const blurbEl = el.querySelector('.sub-text a, .story-card-news h3, .story-card-33 h3, .deck');
        const pageNumEl = el.querySelector('.page-num, .page-no, .page-number');

        if (titleEl) {
            const pageNum = pageNumEl ? cleanText(pageNumEl.textContent) : '';

            // Switch Section Logic
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

            // Deduplication
            if (title && link && !currentArticles.find(a => a.link === link)) {
                currentArticles.push({ title, link, blurb });
            }
        }
    });

    if (currentArticles.length > 0) {
        sections.push({ title: currentSectionTitle, articles: currentArticles });
    }

    // Strategy 2: If empty, try the new "Section" based layout (Archive/New Layout)
    if (sections.length === 0) {
        const sectionContainers = doc.querySelectorAll('.section-container, .tpaper-section, .archive-list');
        sectionContainers.forEach(container => {
             const titleNode = container.querySelector('h2, .section-heading, .section-header');
             const articlesNodes = container.querySelectorAll('a.story-card-news, .element a, .archive-list a');

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
    const html = await fetchWithProxy('https://indianexpress.com/todays-paper/');
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const sections = [];
    const sectionDivs = doc.querySelectorAll('.jobs_section, .section-container, .t-paper-sec, .section, .ie-rest-stories');

    if (sectionDivs.length > 0) {
         sectionDivs.forEach(div => {
             const h2 = div.querySelector('h2, .section-title, .heading, .title');
             if (h2) {
                 const title = cleanText(h2.textContent);
                 const articles = [];
                 const items = div.querySelectorAll('li, .article-list-item, .story, .ev-story');

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

    // FALLBACK 1: Latest News
    if (sections.length === 0) {
        console.warn('Indian Express Todays Paper empty, falling back to Latest News...');
        const fallbackHtml = await fetchWithProxy('https://indianexpress.com/latest-news/');
        const fallbackDoc = parser.parseFromString(fallbackHtml, 'text/html');

        const latestArticles = [];
        // Expanded selectors for latest news
        const articleNodes = fallbackDoc.querySelectorAll('.nation .articles, .articles .title a, .story h3 a, .ue-card-title a, .m-article-landing__title a');

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

    // FALLBACK 2: India Section (If Latest News also fails or returns 0)
    if (sections.length === 0) {
        console.warn('Fallback 1 failed, trying India Section...');
        const indiaHtml = await fetchWithProxy('https://indianexpress.com/section/india/');
        const indiaDoc = parser.parseFromString(indiaHtml, 'text/html');

        const indiaArticles = [];
        const nodes = indiaDoc.querySelectorAll('.articles .title a, .story h3 a, .m-article-landing__title a');

        nodes.forEach(a => {
            if (a.textContent && a.href) {
                indiaArticles.push({
                    title: cleanText(a.textContent),
                    link: a.href,
                    blurb: ''
                });
            }
        });

        if (indiaArticles.length > 0) {
             sections.push({ title: 'India News (Fallback)', articles: indiaArticles.slice(0, 20) });
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
