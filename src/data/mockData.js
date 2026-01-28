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

export const MOCK_NEWS = {
    world: [
        {
            id: 'w1',
            headline: 'Global Climate Summit Reaches Historic Agreement on Carbon Emissions',
            summary: 'World leaders commit to 50% reduction in carbon emissions by 2035 in landmark deal. The agreement includes binding targets for major economies and a new climate finance mechanism for developing nations.',
            source: 'BBC',
            url: 'https://bbc.com/news/climate-summit',
            time: '2h ago',
            confidence: 'HIGH',
            sourceCount: 5
        },
        {
            id: 'w2',
            headline: 'Tech Giants Report Strong Q4 Earnings Amid AI Investment Surge',
            summary: 'Major technology companies exceed expectations as AI-related revenues grow. Apple, Microsoft, and Google all report double-digit growth in cloud and AI services, signaling continued enterprise adoption.',
            source: 'Reuters',
            url: 'https://reuters.com/tech/earnings',
            time: '3h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'w3',
            headline: 'UN Security Council Convenes Emergency Session on Middle East',
            summary: 'International community seeks diplomatic resolution to ongoing tensions. Emergency session called after escalation of regional conflicts, with major powers presenting peace proposals.',
            source: 'BBC',
            url: 'https://bbc.com/news/middle-east',
            time: '4h ago',
            confidence: 'MEDIUM',
            sourceCount: 3
        },
        {
            id: 'w4',
            headline: 'European Central Bank Signals Potential Rate Cut in Spring',
            summary: 'ECB officials indicate easing cycle may begin sooner than expected. Markets react positively to hints of monetary policy pivot as inflation continues to moderate across eurozone economies.',
            source: 'Reuters',
            url: 'https://reuters.com/markets/ecb',
            time: '5h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'w5',
            headline: 'Major Breakthrough in Quantum Computing Announced',
            summary: 'Researchers achieve record-breaking qubit stability in laboratory conditions. The breakthrough could accelerate development of practical quantum computers by several years.',
            source: 'BBC',
            url: 'https://bbc.com/science/quantum',
            time: '6h ago',
            confidence: 'MEDIUM',
            sourceCount: 2
        },
        {
            id: 'w6',
            headline: 'Global Shipping Routes Adapt to Red Sea Disruptions',
            summary: 'Container prices surge as vessels reroute around Cape of Good Hope. Shipping companies warn of extended delays and higher costs affecting global supply chains through Q2.',
            source: 'Reuters',
            url: 'https://reuters.com/business/shipping',
            time: '7h ago',
            confidence: 'HIGH',
            sourceCount: 5
        },
        {
            id: 'w7',
            headline: 'WHO Issues Guidelines on New Respiratory Illness Strain',
            summary: 'Health organization provides updated protocols for healthcare workers. New guidelines focus on early detection and containment measures to prevent widespread transmission.',
            source: 'BBC',
            url: 'https://bbc.com/health/who',
            time: '8h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'w8',
            headline: 'Space Agency Successfully Launches Mars Sample Return Mission',
            summary: 'Historic mission aims to bring Martian soil samples back to Earth by 2030. The mission represents the most complex robotic space operation ever attempted.',
            source: 'Reuters',
            url: 'https://reuters.com/science/mars',
            time: '10h ago',
            confidence: 'HIGH',
            sourceCount: 6
        },
        {
            id: 'w9',
            headline: 'Global Food Prices Show Signs of Stabilization',
            summary: 'FAO index indicates easing of commodity pressures after two-year high. Agricultural experts cautiously optimistic about improved supply conditions.',
            source: 'BBC',
            url: 'https://bbc.com/business/food',
            time: '12h ago',
            confidence: 'MEDIUM',
            sourceCount: 3
        },
        {
            id: 'w10',
            headline: 'International Film Festival Announces Record Attendance',
            summary: 'Cultural event draws visitors from 120 countries in post-pandemic recovery. Festival organizers report 15% increase in international submissions.',
            source: 'Reuters',
            url: 'https://reuters.com/entertainment',
            time: '14h ago',
            confidence: 'LOW',
            sourceCount: 2
        }
    ],
    india: [
        {
            id: 'i1',
            headline: 'Union Budget 2026: Key Focus on Infrastructure and Digital Economy',
            summary: 'Finance Minister outlines ambitious spending plans for next fiscal year. Budget allocates record ₹12 lakh crore for infrastructure, with major push for digital infrastructure and green energy projects.',
            source: 'NDTV',
            url: 'https://ndtv.com/business/budget',
            time: '1h ago',
            confidence: 'HIGH',
            sourceCount: 6,
            criticsView: 'Opposition says middle-class relief inadequate; economists praise fiscal discipline.'
        },
        {
            id: 'i2',
            headline: 'RBI Maintains Repo Rate, Signals Vigilance on Inflation',
            summary: 'Central bank keeps key rates unchanged in bi-monthly policy review. MPC votes 5-1 to hold rates, citing need to balance growth with inflation management.',
            source: 'The Hindu',
            url: 'https://thehindu.com/business/rbi',
            time: '2h ago',
            confidence: 'HIGH',
            sourceCount: 5,
            criticsView: 'Industry bodies call for rate cuts; RBI prioritizes price stability.'
        },
        {
            id: 'i3',
            headline: 'India-UAE Trade Corridor Posts 40% Growth in First Year',
            summary: 'Bilateral trade benefits from new economic partnership agreement. CEPA enables smoother movement of goods as both nations target $100 billion trade by 2030.',
            source: 'Financial Express',
            url: 'https://financialexpress.com/trade',
            time: '3h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'i4',
            headline: 'Supreme Court Hearing on Electoral Bonds Case Continues',
            summary: 'Constitutional bench examines transparency in political funding. Petitioners argue scheme violates citizens\' right to know about political donations.',
            source: 'The Hindu',
            url: 'https://thehindu.com/news/supreme-court',
            time: '4h ago',
            confidence: 'HIGH',
            sourceCount: 5,
            criticsView: 'Civil society demands full disclosure; government defends privacy provisions.'
        },
        {
            id: 'i5',
            headline: 'ISRO Announces Timeline for Gaganyaan Human Spaceflight',
            summary: 'India\'s first crewed space mission scheduled for late 2026. All four astronauts complete training in Russia; indigenous life support systems tested successfully.',
            source: 'NDTV',
            url: 'https://ndtv.com/science/isro',
            time: '5h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'i6',
            headline: 'Semiconductor Fab Construction Begins in Gujarat',
            summary: 'Multi-billion dollar facility marks major step in electronics manufacturing. Tata-PSMC joint venture to produce 28nm chips, reducing import dependency.',
            source: 'Financial Express',
            url: 'https://financialexpress.com/tech/semiconductor',
            time: '6h ago',
            confidence: 'MEDIUM',
            sourceCount: 3
        },
        {
            id: 'i7',
            headline: 'New Education Policy Implementation Shows Positive Results',
            summary: 'Early assessments indicate improved learning outcomes in pilot states. Mother tongue instruction in early grades linked to better comprehension scores.',
            source: 'The Hindu',
            url: 'https://thehindu.com/education',
            time: '7h ago',
            confidence: 'MEDIUM',
            sourceCount: 3
        },
        {
            id: 'i8',
            headline: 'Indian Railways Launches New High-Speed Corridor Project',
            summary: 'Mumbai-Ahmedabad bullet train project receives additional funding. First phase testing to begin in 2027 with full operations expected by 2028.',
            source: 'NDTV',
            url: 'https://ndtv.com/india/railways',
            time: '8h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'i9',
            headline: 'Monsoon Forecast: IMD Predicts Normal Rainfall for 2026',
            summary: 'Agricultural sector to benefit from favorable weather conditions. La Niña conditions expected to support above-average precipitation in peninsular India.',
            source: 'The Hindu',
            url: 'https://thehindu.com/weather/monsoon',
            time: '10h ago',
            confidence: 'HIGH',
            sourceCount: 3
        },
        {
            id: 'i10',
            headline: 'UPI Transactions Cross 15 Billion Monthly Milestone',
            summary: 'Digital payments continue rapid adoption across urban and rural areas. NPCI reports 45% year-on-year growth with new international corridors opening.',
            source: 'Financial Express',
            url: 'https://financialexpress.com/fintech/upi',
            time: '12h ago',
            confidence: 'HIGH',
            sourceCount: 5
        }
    ],
    chennai: [
        {
            id: 'c1',
            headline: 'Chennai Metro Phase 2 Extension Opens for Public',
            summary: 'New corridor connects airport to central business district. The 45 km extension includes 50 stations and is expected to serve 8 lakh daily commuters, easing traffic congestion significantly.',
            source: 'The Hindu',
            url: 'https://thehindu.com/chennai/metro',
            time: '1h ago',
            confidence: 'HIGH',
            sourceCount: 4,
            criticsView: 'Commuters praise connectivity; some cite last-mile connectivity gaps.'
        },
        {
            id: 'c2',
            headline: 'IT Corridor Sees 20% Increase in Office Space Demand',
            summary: 'Tech companies expand operations in OMR and Siruseri. Chennai emerging as preferred destination for AI and semiconductor companies with competitive real estate costs.',
            source: 'TOI',
            url: 'https://timesofindia.com/chennai/business',
            time: '3h ago',
            confidence: 'MEDIUM',
            sourceCount: 2
        },
        {
            id: 'c3',
            headline: 'Heritage Conservation Project Launched in Mylapore',
            summary: 'City corporation partners with UNESCO for temple district restoration. ₹500 crore project to restore 200-year-old structures while maintaining spiritual significance.',
            source: 'The Hindu',
            url: 'https://thehindu.com/chennai/heritage',
            time: '5h ago',
            confidence: 'HIGH',
            sourceCount: 3
        }
    ],
    trichy: [
        {
            id: 't1',
            headline: 'Trichy Airport Expansion Project Receives Environmental Clearance',
            summary: 'New terminal to double passenger handling capacity. The ₹1,500 crore project includes extended runway for wide-body aircraft and enhanced cargo facilities for exports.',
            source: 'The Hindu',
            url: 'https://thehindu.com/trichy/airport',
            time: '2h ago',
            confidence: 'HIGH',
            sourceCount: 3
        },
        {
            id: 't2',
            headline: 'Smart City Projects Progress in Central Trichy',
            summary: 'Road infrastructure and drainage improvements nearing completion. Phase 1 covering Thillai Nagar and Cantonment areas shows 85% completion with underground cabling.',
            source: 'DT Next',
            url: 'https://dtnext.in/trichy/smart-city',
            time: '4h ago',
            confidence: 'MEDIUM',
            sourceCount: 2
        }
    ],
    local: [
        {
            id: 'l1',
            headline: 'Muscat Festival 2026 Draws Record Crowds',
            summary: 'Annual cultural celebration sees unprecedented attendance. Over 1.5 million visitors enjoy traditional Omani experiences, international performances, and heritage exhibitions.',
            source: 'Oman Observer',
            url: 'https://omanobserver.om/muscat-festival',
            time: '1h ago',
            confidence: 'HIGH',
            sourceCount: 2
        },
        {
            id: 'l2',
            headline: 'New Expressway Project Approved for Muscat-Sohar Corridor',
            summary: 'Infrastructure development to boost regional connectivity. The OMR 850 million project will cut travel time to 90 minutes and support logistics hub development.',
            source: 'Oman Observer',
            url: 'https://omanobserver.om/infrastructure',
            time: '3h ago',
            confidence: 'HIGH',
            sourceCount: 2
        },
        {
            id: 'l3',
            headline: 'Oman Tourism Sector Reports Strong Recovery',
            summary: 'Visitor numbers approach pre-pandemic levels in Q1 2026. New visa-on-arrival policy for 103 countries drives 35% growth in international arrivals.',
            source: 'Times of Oman',
            url: 'https://timesofoman.com/tourism',
            time: '5h ago',
            confidence: 'MEDIUM',
            sourceCount: 2
        }
    ],
    social: [
        {
            id: 's1',
            headline: '#RepublicDay2026 Trends as Nation Celebrates 77th Republic Day',
            summary: 'Citizens share patriotic messages and parade highlights on social media. Top trends also include tributes to freedom fighters and cultural performances.',
            source: 'Twitter/X',
            url: 'https://twitter.com/search?q=RepublicDay2026',
            time: '30m ago',
            confidence: 'HIGH',
            sourceCount: 1
        },
        {
            id: 's2',
            headline: 'Viral Video: Street Performer\'s Incredible Talent Goes Global',
            summary: 'Chennai musician\'s video crosses 10 million views overnight. The classical-meets-modern fusion performance attracts attention from international music labels.',
            source: 'Instagram',
            url: 'https://instagram.com/viral',
            time: '1h ago',
            confidence: 'MEDIUM',
            sourceCount: 1
        },
        {
            id: 's3',
            headline: '#BudgetReactions Dominates Twitter After Union Budget Announcement',
            summary: 'Mixed reactions from citizens and experts on key budget proposals. Memes and analyses flood social media within hours of FM\'s speech.',
            source: 'Twitter/X',
            url: 'https://twitter.com/search?q=Budget2026',
            time: '2h ago',
            confidence: 'HIGH',
            sourceCount: 1,
            criticsView: 'Divided opinions: corporate tax changes praised, income tax relief questioned.'
        }
    ],
    entertainment: [
        {
            id: 'e1',
            headline: 'Oppenheimer 2: Nolan Announces Sequel Exploring Cold War Era',
            summary: 'Christopher Nolan confirms follow-up to Oscar-winning biopic. The film will explore the aftermath of the Manhattan Project and nuclear proliferation fears. Cillian Murphy set to return.',
            source: 'Variety',
            url: 'https://variety.com/movies/nolan',
            time: '1h ago',
            confidence: 'HIGH',
            sourceCount: 4,
            criticsView: 'Industry excited about sequel; some question if lightning can strike twice.'
        },
        {
            id: 'e2',
            headline: 'Shah Rukh Khan\'s "King" Breaks Box Office Records on Opening Weekend',
            summary: 'Siddharth Anand directorial earns ₹175 crore in first three days. SRK maintains box office dominance with third consecutive blockbuster, drawing audiences across demographics worldwide.',
            source: 'Bollywood Hungama',
            url: 'https://bollywoodhungama.com/king',
            time: '2h ago',
            confidence: 'HIGH',
            sourceCount: 5,
            criticsView: 'Critics praise action sequences; story receives mixed reviews but audiences love it.'
        },
        {
            id: 'e3',
            headline: 'Thalapathy Vijay\'s Final Film "Jana Gana Mana" First Look Released',
            summary: 'Political drama marks Vijay\'s last acting venture before full-time politics. Director Vetrimaaran project generates massive buzz with social media trending worldwide.',
            source: 'The Hindu',
            url: 'https://thehindu.com/entertainment/vijay',
            time: '3h ago',
            confidence: 'HIGH',
            sourceCount: 4,
            criticsView: 'Fans emotional about final film; political circles watch messaging closely.'
        },
        {
            id: 'e4',
            headline: 'Marvel Announces Phase 7 Slate with Avengers: Secret Wars',
            summary: 'Disney reveals ambitious five-year plan for MCU. Robert Downey Jr. rumored to return in multiverse capacity; fan theories explode across social media platforms.',
            source: 'Hollywood Reporter',
            url: 'https://hollywoodreporter.com/marvel',
            time: '4h ago',
            confidence: 'MEDIUM',
            sourceCount: 3,
            criticsView: 'Superhero fatigue concerns persist; studios bet on nostalgia factor.'
        },
        {
            id: 'e5',
            headline: 'Rajinikanth\'s "Coolie" Gets Standing Ovation at Cannes Premiere',
            summary: 'Lokesh Kanagaraj film showcased out of competition. International critics praise reinvented Rajini persona and Tamil cinema\'s global narrative ambitions.',
            source: 'Film Companion',
            url: 'https://filmcompanion.in/coolie',
            time: '5h ago',
            confidence: 'HIGH',
            sourceCount: 3,
            criticsView: 'Western critics impressed; some call it "best Tamil film of the decade".'
        },
        {
            id: 'e6',
            headline: 'Alia Bhatt Signs First Hollywood Lead Role in Russo Brothers Project',
            summary: 'Indian star joins elite club with major studio vehicle. Action thriller to shoot in multiple countries with estimated $150 million budget.',
            source: 'NDTV',
            url: 'https://ndtv.com/entertainment/alia',
            time: '6h ago',
            confidence: 'HIGH',
            sourceCount: 4
        },
        {
            id: 'e7',
            headline: 'AR Rahman Wins Grammy for "Ponniyin Selvan" Background Score',
            summary: 'Maestro adds another Grammy to legendary career. Emotional acceptance speech thanks Mani Ratnam and speaks about Chola empire\'s musical heritage.',
            source: 'India Today',
            url: 'https://indiatoday.in/entertainment/rahman',
            time: '8h ago',
            confidence: 'HIGH',
            sourceCount: 5,
            criticsView: 'Universal acclaim; some note background score category less competitive.'
        },
        {
            id: 'e8',
            headline: 'Barbenheimer Effect 2.0: "Wicked" and "Gladiator 2" Clash at Box Office',
            summary: 'Thanksgiving releases compete for audience attention. Musical and epic sequel both cross $100M opening as exhibitors celebrate return of theatrical moviegoing.',
            source: 'Variety',
            url: 'https://variety.com/box-office',
            time: '10h ago',
            confidence: 'HIGH',
            sourceCount: 4,
            criticsView: 'Both films reviewed positively; audiences rewarding theatrical spectacle.'
        }
    ]
};

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
