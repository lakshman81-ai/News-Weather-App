// Mock Data for demonstration
// This data will be used when APIs are not configured

export const MOCK_WEATHER = {
    chennai: {
        name: 'Chennai',
        icon: '🏛️',
        morning: {
            temp: 26,
            feelsLike: 28,
            icon: '☁️',
            condition: 'Partly Cloudy',
            rainProb: { avg: 35, range: '25-45%', sources: { accuWeather: 25, ecmwf: 40, imd: 40 } },
            rainMm: '0-2mm'
        },
        noon: {
            temp: 32,
            feelsLike: 36,
            icon: '🌤️',
            condition: 'Warm & Humid',
            rainProb: { avg: 45, range: '35-55%', sources: { accuWeather: 35, ecmwf: 50, imd: 50 } },
            rainMm: '1-4mm'
        },
        evening: {
            temp: 29,
            feelsLike: 32,
            icon: '🌧️',
            condition: 'Light Showers',
            rainProb: { avg: 65, range: '55-75%', sources: { accuWeather: 55, ecmwf: 70, imd: 70 } },
            rainMm: '3-8mm'
        },
        summary: 'Day starts partly cloudy, becoming humid by noon. Expect light showers in the evening. Carry an umbrella if heading out after 5 PM.'
    },
    trichy: {
        name: 'Trichy',
        icon: '🏛️',
        morning: {
            temp: 24,
            feelsLike: 25,
            icon: '☀️',
            condition: 'Clear',
            rainProb: { avg: 10, range: '5-15%', sources: { accuWeather: 5, ecmwf: 10, imd: 15 } },
            rainMm: '0mm'
        },
        noon: {
            temp: 34,
            feelsLike: 38,
            icon: '☀️',
            condition: 'Hot',
            rainProb: { avg: 20, range: '15-30%', sources: { accuWeather: 15, ecmwf: 20, imd: 25 } },
            rainMm: '0-1mm'
        },
        evening: {
            temp: 30,
            feelsLike: 33,
            icon: '⛅',
            condition: 'Partly Cloudy',
            rainProb: { avg: 30, range: '20-40%', sources: { accuWeather: 20, ecmwf: 35, imd: 35 } },
            rainMm: '0-2mm'
        },
        summary: 'Clear morning transitioning to hot afternoon. Slight chance of scattered clouds in the evening. Stay hydrated during peak hours.'
    },
    muscat: {
        name: 'Muscat',
        icon: '📍',
        timezone: 'GST (UTC+4)',
        localTime: '18:42',
        morning: {
            temp: 22,
            feelsLike: 22,
            icon: '☀️',
            condition: 'Sunny',
            rainProb: { avg: 2, range: '0-5%', sources: { accuWeather: 0, ecmwf: 3, imd: 3 } },
            rainMm: '0mm'
        },
        noon: {
            temp: 28,
            feelsLike: 29,
            icon: '☀️',
            condition: 'Hot & Dry',
            rainProb: { avg: 0, range: '0%', sources: { accuWeather: 0, ecmwf: 0, imd: 0 } },
            rainMm: '0mm'
        },
        evening: {
            temp: 25,
            feelsLike: 25,
            icon: '☀️',
            condition: 'Clear',
            rainProb: { avg: 0, range: '0%', sources: { accuWeather: 0, ecmwf: 0, imd: 0 } },
            rainMm: '0mm'
        },
        summary: 'Typical dry and sunny conditions throughout the day. Pleasant evening temperatures perfect for outdoor activities.'
    }
};

export const MOCK_NEWS = {}; // Usage Deprecated - Real Data Only

export const MOCK_MARKET = {
    indices: {
        sensex: { name: 'BSE SENSEX', value: 72840, change: 456, changePercent: 0.63, direction: 'up' },
        nifty: { name: 'NSE NIFTY', value: 22150, change: 178, changePercent: 0.81, direction: 'up' }
    },
    gainers: {
        bse: [
            { symbol: 'RELIANCE', name: 'Reliance Industries', price: 2840, change: 89, changePercent: 3.24, direction: 'up' },
            { symbol: 'TCS', name: 'Tata Consultancy', price: 3950, change: 108, changePercent: 2.81, direction: 'up' },
            { symbol: 'HDFC', name: 'HDFC Bank', price: 1620, change: 33, changePercent: 2.08, direction: 'up' }
        ],
        nse: [
            { symbol: 'INFY', name: 'Infosys', price: 1580, change: 52, changePercent: 3.40, direction: 'up' },
            { symbol: 'BAJAJ-AUTO', name: 'Bajaj Auto', price: 8920, change: 245, changePercent: 2.82, direction: 'up' },
            { symbol: 'MARUTI', name: 'Maruti Suzuki', price: 10450, change: 198, changePercent: 1.93, direction: 'up' }
        ]
    },
    losers: {
        bse: [
            { symbol: 'TATASTEEL', name: 'Tata Steel', price: 142, change: -3.05, changePercent: -2.10, direction: 'down' },
            { symbol: 'ADANIENT', name: 'Adani Enterprises', price: 2340, change: -43, changePercent: -1.80, direction: 'down' },
            { symbol: 'WIPRO', name: 'Wipro', price: 425, change: -5.2, changePercent: -1.21, direction: 'down' }
        ],
        nse: [
            { symbol: 'COALINDIA', name: 'Coal India', price: 412, change: -9.8, changePercent: -2.32, direction: 'down' },
            { symbol: 'ONGC', name: 'ONGC', price: 268, change: -4.5, changePercent: -1.65, direction: 'down' },
            { symbol: 'BPCL', name: 'BPCL', price: 545, change: -6.2, changePercent: -1.12, direction: 'down' }
        ]
    },
    movers: [
        { symbol: 'RELIANCE', name: 'Reliance', volume: '12.5M', action: 'Heavy Buying' },
        { symbol: 'TATAMOTORS', name: 'Tata Motors', volume: '8.2M', action: 'Breakout' },
        { symbol: 'SBIN', name: 'SBI', volume: '15.1M', action: 'High Volume' }
    ],
    sentiment: 'Bullish - Markets trading higher on positive global cues and strong FII inflows.'
};

export const MOCK_DT_NEXT = [
    {
        headline: 'Republic Day 2026: India Showcases Military Might and Cultural Diversity',
        summary: 'Grand parade at Kartavya Path features new indigenous defense systems and state tableaux.',
        source: 'DT Next',
        time: '7:00 AM',
        sourceCount: 1,
        confidence: 'HIGH'
    },
    {
        headline: 'Tamil Nadu Announces New Industrial Policy 2026',
        summary: 'State government unveils incentives for semiconductor and EV manufacturing sectors.',
        source: 'DT Next',
        time: '7:00 AM',
        sourceCount: 1,
        confidence: 'HIGH'
    },
    {
        headline: 'Chennai Corporation to Roll Out 500 Electric Buses',
        summary: 'Green initiative part of city\'s commitment to carbon neutrality by 2050.',
        source: 'DT Next',
        time: '7:00 AM',
        sourceCount: 1,
        confidence: 'HIGH'
    },
    {
        headline: 'CBSE Date Sheet Released for Class 10 and 12 Exams',
        summary: 'Board examinations to commence from March 1, 2026 across the country.',
        source: 'DT Next',
        time: '7:00 AM',
        sourceCount: 1,
        confidence: 'HIGH'
    },
    {
        headline: 'Cauvery Water Dispute: Interstate Meeting Scheduled Next Week',
        summary: 'Karnataka and Tamil Nadu officials to discuss water sharing arrangements.',
        source: 'DT Next',
        time: '7:00 AM',
        sourceCount: 1,
        confidence: 'MEDIUM'
    }
];

// Severe weather mock for demonstration
export const MOCK_SEVERE_WEATHER = {
    chennai: {
        ...MOCK_WEATHER.chennai,
        isSevere: true,
        alert: {
            type: 'HEAVY RAIN WARNING',
            icon: '⛈️',
            message: 'IMD issues Orange Alert - Heavy rainfall expected. Avoid low-lying areas.',
            level: 'orange'
        },
        evening: {
            temp: 27,
            feelsLike: 30,
            icon: '⛈️',
            condition: 'Heavy Rain',
            rainProb: { avg: 92, range: '85-98%', sources: { accuWeather: 85, ecmwf: 95, imd: 96 } },
            rainMm: '50-80mm'
        },
        summary: '⚠️ ALERT: Heavy to very heavy rainfall expected this evening. Waterlogging likely in low-lying areas. Avoid unnecessary travel after 4 PM.'
    }
};

/**
 * Get topline summary based on current segment
 */
export function getTopline(segment) {
    const toplines = {
        morning_weather: 'Starting the day with weather updates for Chennai, Trichy, and Muscat.',
        morning_news: 'Republic Day celebrations underway as India showcases its cultural heritage and military strength.',
        market_brief: 'Markets open positive amid strong global cues; IT and Banking sectors lead gains.',
        midday_brief: 'Midday update: Key developments from India and around the world.',
        market_movers: 'Afternoon trading sees momentum in auto and pharma sectors; FII buying continues.',
        evening_news: 'Evening briefing: Day\'s top stories and social trends.',
        local_events: 'Local updates from Chennai, Trichy, and Muscat.',
        night_wrap_up: 'Day in review: Markets close higher, political developments, and tomorrow\'s outlook.',
        urgent_only: 'Only urgent alerts are shown during this time. Regular updates resume at 6:55 AM.'
    };

    return toplines[segment?.id] || 'Your personalized daily briefing.';
}
