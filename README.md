# News & Weather App

A React-based dashboard that aggregates real-time news, weather, and market updates. It features a "Smart Mix" news engine that prioritizes high-impact stories and provides a focused, segment-based daily overview.

## Features

*   **Smart News Aggregation:** Fetches and ranks news from multiple high-quality RSS feeds (NDTV, The Hindu, BBC, etc.).
*   **Time-Segmented Experience:** UI adapts based on the time of day (Morning, Afternoon, Evening, Night).
*   **Weather Updates:** Real-time weather for configured cities (Chennai, Trichy, Muscat).
*   **Market Data:** Live updates for BSE/NSE (configurable).
*   **Deep Customization:** Settings page to toggle sources, cities, and sections.
*   **Responsive Design:** Optimized for both desktop and mobile viewing.

## Setup & Usage

### Prerequisites
*   Node.js (v18+ recommended)
*   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/yourusername/news-weather-app.git
    cd news-weather-app
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Configure Environment Variables:
    *   Copy `.env.example` to `.env`.
    *   Fill in your API keys (optional for basic RSS functionality, required for some direct APIs).
    ```bash
    cp .env.example .env
    ```

4.  Start the Development Server:
    ```bash
    npm run dev
    ```

### Building for Production

```bash
npm run build
```

## API Configuration

The app uses a hybrid approach:
1.  **RSS Feeds (Primary):** Proxied via `rss2json` to avoid CORS. No key required for basic usage.
2.  **Weather:** Uses Open-Meteo (Free, no key) or other configured providers.
3.  **NewsData.io (Optional):** Can be used as a premium fallback if configured.

## Project Structure

*   `src/components`: Reusable UI components (WeatherCard, NewsSection, etc.).
*   `src/services`: API logic and data fetching (rssAggregator, weatherService).
*   `src/pages`: Main application views.
*   `src/context`: React Context for global state management.
*   `src/utils`: Helper functions.

## Contributing

1.  Fork the repo.
2.  Create a feature branch (`git checkout -b feature/amazing-feature`).
3.  Commit your changes.
4.  Push to the branch.
5.  Open a Pull Request.

## License

MIT
