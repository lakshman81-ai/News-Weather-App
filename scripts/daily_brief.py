import os
import json
import time
import requests
import feedparser
import google.generativeai as genai
from bs4 import BeautifulSoup
from datetime import datetime

# Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
OUTPUT_FILE = "public/data/epaper_data.json"

# Configure Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    model = genai.GenerativeModel('gemini-1.5-flash')
else:
    print("WARNING: GEMINI_API_KEY not found. Summarization will be skipped.")
    model = None

def clean_text(text):
    if not text:
        return ""
    return text.strip().replace('\n', ' ').replace('  ', ' ')

def summarize_section(source_name, section_name, articles):
    """
    Summarizes a list of articles using Gemini.
    """
    if not model or not articles:
        return None

    # Prepare the prompt
    article_list = "\n".join([f"- {a['title']}" for a in articles[:15]])

    prompt = f"""
    You are a professional news editor. Summarize the following news headlines from {source_name} - {section_name} into a concise, insightful daily briefing.

    Requirements:
    - Language: English (Crucial: Translate non-English content to English).
    - Format: 3-4 bullet points highlighting the most important stories.
    - Style: Professional, objective, and journalistic.
    - No introductory text.

    Headlines:
    {article_list}
    """

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"Error summarizing {source_name} - {section_name}: {e}")
        return None

# ---------------------------------------------------------------------------
# Scrapers
# ---------------------------------------------------------------------------

def fetch_the_hindu():
    print("Fetching The Hindu (Scraping)...")
    url = "https://www.thehindu.com/todays-paper/"
    sections = []

    try:
        headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'}
        response = requests.get(url, headers=headers, timeout=30)
        soup = BeautifulSoup(response.content, 'html.parser')

        current_section = {"page": "Front Page", "articles": []}
        sections.append(current_section)

        # Hindu structure analysis
        elements = soup.select('.element, .story-card, .article, .story-card-news')
        last_page = ""

        for el in elements:
            title_el = el.select_one('h3.title a, .story-card-news a, .headline a')
            page_el = el.select_one('.page-num, .page-no')

            if title_el:
                title = clean_text(title_el.get_text())
                link = title_el['href']
                if not link.startswith('http'):
                    link = "https://www.thehindu.com" + link

                if page_el:
                    page_num = clean_text(page_el.get_text())
                    if page_num and page_num != last_page:
                        if current_section["articles"]:
                            current_section = {"page": f"Page {page_num}", "articles": []}
                            sections.append(current_section)
                        last_page = page_num

                if title and link and not any(a['link'] == link for a in current_section['articles']):
                    current_section['articles'].append({"title": title, "link": link})

        # Fallback to RSS if scraping yielded nothing
        if len(sections) == 1 and not sections[0]["articles"]:
            print("The Hindu scraping empty, falling back to RSS...")
            return fetch_rss_fallback("https://www.thehindu.com/news/national/feeder/default.rss", "National")

    except Exception as e:
        print(f"Failed to fetch The Hindu: {e}")
        return fetch_rss_fallback("https://www.thehindu.com/news/national/feeder/default.rss", "National")

    return [s for s in sections if s['articles']]

def fetch_indian_express():
    print("Fetching Indian Express (RSS)...")
    # Using Section Feeds to simulate Pages
    feeds = [
        {"page": "Front Page", "url": "https://indianexpress.com/feed/"},
        {"page": "India", "url": "https://indianexpress.com/section/india/feed/"},
        {"page": "World", "url": "https://indianexpress.com/section/world/feed/"},
        {"page": "Editorial", "url": "https://indianexpress.com/section/opinion/editorials/feed/"}
    ]
    return fetch_from_feeds(feeds)

def fetch_dinamani():
    print("Fetching Dinamani (Google News RSS)...")
    # Using Google News site search to bypass scraping blocks
    feeds = [
        {"page": "Latest News", "url": "https://news.google.com/rss/search?q=site:dinamani.com+when:1d&hl=ta&gl=IN&ceid=IN:ta"},
        {"page": "Tamil Nadu", "url": "https://news.google.com/rss/search?q=site:dinamani.com+Tamil+Nadu+when:1d&hl=ta&gl=IN&ceid=IN:ta"}
    ]
    return fetch_from_feeds(feeds)

def fetch_daily_thanthi():
    print("Fetching Daily Thanthi (Google News RSS)...")
    feeds = [
        {"page": "Latest News", "url": "https://news.google.com/rss/search?q=site:dailythanthi.com+when:1d&hl=ta&gl=IN&ceid=IN:ta"},
        {"page": "Cinema", "url": "https://news.google.com/rss/search?q=site:dailythanthi.com+cinema+when:1d&hl=ta&gl=IN&ceid=IN:ta"}
    ]
    return fetch_from_feeds(feeds)

# Helper for generic RSS fetching
def fetch_from_feeds(feed_list):
    sections = []
    for f in feed_list:
        try:
            d = feedparser.parse(f['url'])
            articles = []
            for entry in d.entries[:15]:
                articles.append({
                    "title": entry.title,
                    "link": entry.link
                })
            if articles:
                sections.append({"page": f['page'], "articles": articles})
        except Exception as e:
            print(f"Error fetching feed {f['url']}: {e}")
    return sections

def fetch_rss_fallback(url, page_name):
    d = feedparser.parse(url)
    articles = [{"title": e.title, "link": e.link} for e in d.entries[:20]]
    if articles:
        return [{"page": page_name, "articles": articles}]
    return []

# ---------------------------------------------------------------------------
# Main Workflow
# ---------------------------------------------------------------------------

def main():
    print("Starting Daily Brief Aggregation...")

    data = {
        "lastUpdated": datetime.now().isoformat(),
        "sources": {}
    }

    sources = {
        "THE_HINDU": fetch_the_hindu,
        "INDIAN_EXPRESS": fetch_indian_express,
        "DINAMANI": fetch_dinamani,
        "DAILY_THANTHI": fetch_daily_thanthi
    }

    for key, fetch_func in sources.items():
        try:
            sections = fetch_func()
            if not sections:
                print(f"Warning: No sections found for {key}")

            print(f"Summarizing {key}...")
            for section in sections:
                # Add delay to respect rate limits if any
                time.sleep(1)
                summary = summarize_section(key, section['page'], section['articles'])
                section['summary'] = summary

            data["sources"][key] = sections

        except Exception as e:
            print(f"Critical error processing {key}: {e}")
            data["sources"][key] = []

    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    print(f"Done! Data saved to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
