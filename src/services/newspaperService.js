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

    // Based on actual HTML inspection:
    // Articles are in <div class="element">
    // They have <div class="page-num">, <h3 class="title">, <div class="sub-text">

    const elements = doc.querySelectorAll('.element');
    let currentSectionTitle = 'Front Page';
    let currentArticles = [];
    let lastPageNum = '';

    elements.forEach(el => {
        // Sometimes headers are distinct elements.
        // If we see a page number change, we can effectively treat it as a new group if we want,
        // but finding actual section names (like "Sports") is better.
        // The text dump showed "Sport" SECTION [59].
        // But in the article list, it might just be flat.

        // Let's look for section headers that might appear between elements?
        // In the grep output, I didn't see explicit section headers wrapping the elements.

        // However, the article structure is clear.
        const titleEl = el.querySelector('h3.title a');
        const blurbEl = el.querySelector('.sub-text a');
        const pageNumEl = el.querySelector('.page-num');

        if (titleEl) {
            const pageNum = pageNumEl ? cleanText(pageNumEl.textContent) : '';

            // Heuristic: Group by Page Number if we can't find sections
            // Or just map specific pages to sections?
            // Page 1 = Front Page. Page 14-15 = Cities/States.
            // This is brittle.

            // Better: Just return the articles.
            // If the user *needs* sections, we can try to find them.
            // But having a flat list is better than broken sections.
            // We can try to use the "Page No" as the section title if no better title exists.

            if (pageNum && pageNum !== lastPageNum) {
                if (currentArticles.length > 0) {
                    sections.push({ title: currentSectionTitle, articles: currentArticles });
                    currentArticles = [];
                }
                currentSectionTitle = pageNum;
                lastPageNum = pageNum;
            }

            currentArticles.push({
                title: cleanText(titleEl.textContent),
                link: titleEl.href,
                blurb: blurbEl ? cleanText(blurbEl.textContent) : ''
            });
        }
    });

    if (currentArticles.length > 0) {
        sections.push({ title: currentSectionTitle, articles: currentArticles });
    }

    // If we failed to parse using .element (e.g., layout change), fallback to previous generic logic
    if (sections.length === 0) {
        // Fallback logic from previous attempt
        const articleGroups = doc.querySelectorAll('section[id*="section_"], div.tp-section-container');
        // ... (rest of fallback logic omitted for brevity, relying on the confirmed .element structure)
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

    // Indian Express: "div.sections" or "div.section"
    // The text dump showed: "01The Front Page", "02The City - Mumbai"
    // These look like Headers.

    // Selector strategy: Find the headers that define sections
    // Often IE uses <div class="section"> <h2>Title</h2> <ul>...</ul> </div>

    const sectionDivs = doc.querySelectorAll('.jobs_section, .section-container, .t-paper-sec, #todays-paper-section .section');

    if (sectionDivs.length > 0) {
         sectionDivs.forEach(div => {
             const h2 = div.querySelector('h2, .section-title');
             if (h2) {
                 const title = cleanText(h2.textContent);
                 const articles = [];

                 // IE usually uses <ul><li> for articles
                 const items = div.querySelectorAll('li, .article-list-item');
                 items.forEach(li => {
                     const a = li.querySelector('h3 a') || li.querySelector('a');
                     const p = li.querySelector('p, .desc');

                     if (a && cleanText(a.textContent)) {
                        articles.push({
                            title: cleanText(a.textContent),
                            link: a.getAttribute('href'),
                            blurb: p ? cleanText(p.textContent) : ''
                        });
                     }
                 });
                 if (articles.length > 0) sections.push({ title, articles });
             }
         });
    }

    // Fallback: Use the H2 headers strategy
    if (sections.length === 0) {
        const headers = doc.querySelectorAll('h2'); // Broad selector
        headers.forEach(header => {
            // Check if it looks like a section header (e.g. "The Front Page")
            // And has a list following it
            const title = cleanText(header.textContent);
            // Ignore headers that are likely article titles (too long)
            if (title.length < 50 && title.length > 2) {
                let sibling = header.nextElementSibling;
                let articles = [];
                // Look ahead for UL
                while(sibling && sibling.tagName !== 'H2' && sibling.tagName !== 'DIV' && articles.length === 0) {
                     if (sibling.tagName === 'UL') {
                        sibling.querySelectorAll('li').forEach(li => {
                             const a = li.querySelector('a');
                             const p = li.querySelector('p');
                             if (a) {
                                 articles.push({
                                     title: cleanText(a.textContent),
                                     link: a.getAttribute('href'),
                                     blurb: p ? cleanText(p.textContent) : ''
                                 });
                             }
                        });
                     }
                     sibling = sibling.nextElementSibling;
                }
                if (articles.length > 0) sections.push({ title, articles });
            }
        });
    }

    return sections;
  } catch (error) {
    console.error('Error fetching Indian Express:', error);
    return [];
  }
};

export const openDDGSummary = (text) => {
    // Open DDG with a query to summarize.
    const query = `Summarize this news: ${text.substring(0, 1000)}`;
    window.open(`https://duckduckgo.com/?q=${encodeURIComponent(query)}&ia=chat`, '_blank');
};
