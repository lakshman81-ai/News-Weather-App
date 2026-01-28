/**
 * Weather Service
 * Fetches data from Open-Meteo API
 * NO MOCK DATA - Returns null/error on failure
 */

const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const GEO_URL = 'https://geocoding-api.open-meteo.com/v1/search';

// Coordinates for key cities (fallback if geocoding fails, but still real data)
const LOCATIONS = {
    chennai: { lat: 13.0827, lon: 80.2707 },
    trichy: { lat: 10.7905, lon: 78.7047 },
    muscat: { lat: 23.5859, lon: 58.4059 }
};

/**
 * Fetch weather for a specific location
 * @param {string} locationKey - 'chennai', 'trichy', 'muscat'
 * @returns {Promise<Object>} Weather data object or throws error
 */
export async function fetchWeather(locationKey) {
    if (!LOCATIONS[locationKey]) {
        throw new Error(`Unknown location: ${locationKey}`);
    }

    const { lat, lon } = LOCATIONS[locationKey];

    try {
        // Fetch current, hourly forecast, and daily precipitation probability
        const response = await fetch(
            `${BASE_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,apparent_temperature&hourly=temperature_2m,precipitation_probability,weather_code&daily=precipitation_probability_max,precipitation_sum&timezone=auto`
        );

        if (!response.ok) {
            throw new Error('Weather API request failed');
        }

        const data = await response.json();
        return processWeatherData(data, locationKey);
    } catch (error) {
        console.error(`Error fetching weather for ${locationKey}:`, error);
        throw error; // Propagate error, do NOT return mock data
    }
}

/**
 * Process raw API data into app format
 * Includes primitive logic for "morning/noon/evening" segmentation based on hourly data
 */
function processWeatherData(data, locationName) {
    const current = data.current;

    // Get hourly indices for today
    // Simple approximation: Morning (8am), Noon (1pm), Evening (6pm)
    // In a real app, match timestamps strictly. Here we assume sequential response starts from 00:00 today (usually true for open-meteo if not specified)

    // Helper to get index by hour (approx)
    const getIndex = (hour) => hour;

    // Weather codes to icons
    const getIcon = (code) => {
        if (code <= 1) return '☀️'; // Clear
        if (code <= 3) return '⛅'; // Cloudy
        if (code <= 67) return '🌧️'; // Rain
        if (code <= 99) return '⛈️'; // Storm
        return '❓';
    };

    const conditionMap = {
        0: 'Clear', 1: 'Mainly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
        45: 'Fog', 48: 'Fog',
        51: 'Light Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
        80: 'Rain Showers', 95: 'Thunderstorm'
    };

    const getCondition = (code) => conditionMap[code] || 'Unknown';

    return {
        name: locationName.charAt(0).toUpperCase() + locationName.slice(1),
        icon: locationName === 'muscat' ? '📍' : '🏛️',
        current: {
            temp: Math.round(current.temperature_2m),
            feelsLike: Math.round(current.apparent_temperature),
            condition: getCondition(current.weather_code),
            icon: getIcon(current.weather_code)
        },
        morning: {
            temp: Math.round(data.hourly.temperature_2m[8]),
            icon: getIcon(data.hourly.weather_code[8]),
            rainProb: { avg: data.hourly.precipitation_probability[8] }
        },
        noon: {
            temp: Math.round(data.hourly.temperature_2m[13]),
            icon: getIcon(data.hourly.weather_code[13]),
            rainProb: { avg: data.hourly.precipitation_probability[13] }
        },
        evening: {
            temp: Math.round(data.hourly.temperature_2m[18]),
            icon: getIcon(data.hourly.weather_code[18]),
            rainProb: { avg: data.hourly.precipitation_probability[18] }
        },
        summary: `Today's max rain probability: ${data.daily.precipitation_probability_max[0]}%. Total precip: ${data.daily.precipitation_sum[0]}mm.`
    };
}
