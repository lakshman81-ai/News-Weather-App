/**
 * Multi-Model Weather Service
 * Fetches data from 4 weather models via Open-Meteo API:
 * - ECMWF IFS (European, highest accuracy)
 * - GFS (NOAA, strong precipitation)
 * - ICON (DWD Germany, excellent global coverage)
 * - Best Match (Open-Meteo's auto-selection)
 * 
 * NO MOCK DATA - Returns null/error on failure
 */

import {
    calculateRainfallConsensus,
    averageTemperature,
    averageApparentTemperature,
    getMostCommonWeatherCode,
    maxPrecipitation,
    getSuccessfulModels,
    formatModelNames
} from '../utils/multiModelUtils';
import { getSettings } from '../utils/storage';

// Model-specific API endpoints
const MODELS = {
    ecmwf: 'https://api.open-meteo.com/v1/ecmwf',
    gfs: 'https://api.open-meteo.com/v1/gfs',
    icon: 'https://api.open-meteo.com/v1/dwd-icon',
    best_match: 'https://api.open-meteo.com/v1/forecast'
};

// Coordinates for key cities
const LOCATIONS = {
    chennai: { lat: 13.0827, lon: 80.2707 },
    trichy: { lat: 10.7905, lon: 78.7047 },
    muscat: { lat: 23.5859, lon: 58.4059 }
};

/**
 * Fetch weather from a single model
 * @param {string} modelName - 'ecmwf', 'gfs', 'icon', or 'best_match'
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} Raw weather data from model with metadata
 */
async function fetchSingleModel(modelName, lat, lon) {
    const baseUrl = MODELS[modelName];

    if (!baseUrl) {
        throw new Error(`Unknown model: ${modelName}`);
    }

    const params = new URLSearchParams({
        latitude: lat,
        longitude: lon,
        current: 'temperature_2m,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m',
        hourly: 'temperature_2m,precipitation_probability,precipitation,weather_code,apparent_temperature,relative_humidity_2m,wind_speed_10m,wind_direction_10m,uv_index,cloud_cover,visibility,dew_point_2m',
        daily: 'precipitation_probability_max,precipitation_sum,uv_index_max',
        timezone: 'auto'
    });

    const url = `${baseUrl}?${params}`;

    console.log(`[WeatherService] Fetching ${modelName.toUpperCase()}...`);

    const response = await fetch(url);

    if (!response.ok) {
        throw new Error(`${modelName.toUpperCase()} API request failed: ${response.status}`);
    }

    const data = await response.json();

    // Attach metadata for weighted averaging
    data.modelKey = modelName;
    data.fetchedAt = Date.now();

    console.log(`[WeatherService] ✅ ${modelName.toUpperCase()}: Success`);

    return data;
}

/**
 * Fetch weather from all enabled models for a specific location
 * @param {string} locationKey - 'chennai', 'trichy', 'muscat'
 * @returns {Promise<Object>} Multi-model weather data object
 */
export async function fetchWeather(locationKey) {
    if (!LOCATIONS[locationKey]) {
        throw new Error(`Unknown location: ${locationKey}`);
    }

    const { lat, lon } = LOCATIONS[locationKey];

    // Get enabled models from settings
    const settings = getSettings();
    const modelSettings = settings.weather?.models || { ecmwf: true, gfs: true, icon: true, best_match: true };

    // Filter to only enabled models
    const enabledModelNames = Object.keys(MODELS).filter(m => modelSettings[m] !== false);

    if (enabledModelNames.length === 0) {
        console.warn('[WeatherService] No models enabled, using all models');
        enabledModelNames.push('ecmwf', 'gfs', 'icon', 'best_match');
    }

    console.log(`[WeatherService] Fetching from models: ${enabledModelNames.join(', ')}`);

    try {
        // Fetch from enabled models in parallel
        const results = await Promise.allSettled(
            enabledModelNames.map(model => fetchSingleModel(model, lat, lon))
        );

        // Extract successful results dynamically
        const modelData = {};
        enabledModelNames.forEach((modelName, index) => {
            modelData[modelName] = results[index].status === 'fulfilled' ? results[index].value : null;
            if (results[index].status === 'rejected') {
                console.warn(`[WeatherService] ⚠️ ${modelName.toUpperCase()} failed:`, results[index].reason?.message);
            }
        });

        // Check if at least one model succeeded
        const successfulModels = getSuccessfulModels(modelData);

        if (successfulModels.length === 0) {
            throw new Error('All weather models failed to fetch data');
        }

        console.log(`[WeatherService] ✅ ${successfulModels.length}/${enabledModelNames.length} models succeeded: ${formatModelNames(successfulModels)}`);

        // Process and combine data
        return processMultiModelData(modelData, locationKey);

    } catch (error) {
        console.error(`[WeatherService] ❌ Error fetching weather for ${locationKey}:`, error);
        throw error;
    }
}

/**
 * Process raw multi-model data into app format
 */
function processMultiModelData(modelData, locationName) {
    const settings = getSettings();
    const weights = settings.weather?.weights;
    const freshnessLimit = settings.weather?.freshnessLimit;

    // Identify available models
    const availableModelKeys = Object.keys(modelData).filter(key => modelData[key] != null);

    // Get current data from all models with metadata
    const currentData = availableModelKeys.map(key => {
        const d = modelData[key].current;
        if (!d) return null;
        return {
            ...d,
            modelKey: key,
            fetchedAt: modelData[key].fetchedAt
        };
    }).filter(Boolean);

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

    // Helper to get segment metrics from multiple models
    const getSegmentMetrics = (startHour, endHour) => {
        const indices = [];
        for (let i = startHour; i <= endHour; i++) indices.push(i);

        // Collect hourly data wrappers from all available models
        const allModelHourlyData = availableModelKeys.map(key => ({
            data: modelData[key].hourly,
            modelKey: key,
            fetchedAt: modelData[key].fetchedAt
        })).filter(item => item.data);

        // Average temperatures across models for this time segment
        const segmentTemps = [];
        const segmentApparent = [];
        const segmentPrecip = [];
        const segmentPrecipProb = [];
        const segmentWeatherCodes = [];
        const segmentHumidity = [];
        const segmentWindSpeed = [];
        const segmentUV = [];
        const segmentCloud = [];

        let segmentMaxRainWarning = false;

        indices.forEach(hourIdx => {
            const hourData = allModelHourlyData.map(item => ({
                temperature_2m: item.data.temperature_2m?.[hourIdx],
                apparent_temperature: item.data.apparent_temperature?.[hourIdx],
                precipitation: item.data.precipitation?.[hourIdx],
                precipitation_probability: item.data.precipitation_probability?.[hourIdx],
                weather_code: item.data.weather_code?.[hourIdx],
                relative_humidity_2m: item.data.relative_humidity_2m?.[hourIdx],
                wind_speed_10m: item.data.wind_speed_10m?.[hourIdx],
                uv_index: item.data.uv_index?.[hourIdx],
                cloud_cover: item.data.cloud_cover?.[hourIdx],
                modelKey: item.modelKey,
                fetchedAt: item.fetchedAt
            }));

            const avgTemp = averageTemperature(hourData, weights, freshnessLimit);
            const avgApparent = averageApparentTemperature(hourData, weights, freshnessLimit);

            // Use max precipitation logic
            const precipMetric = maxPrecipitation(
                hourData.map(m => ({ value: m.precipitation, modelKey: m.modelKey }))
            );

            const weatherCode = getMostCommonWeatherCode(hourData);

            if (avgTemp !== null) segmentTemps.push(avgTemp);
            if (avgApparent !== null) segmentApparent.push(avgApparent);

            if (precipMetric.value !== null) {
                segmentPrecip.push(precipMetric.value);
                if (precipMetric.warning) segmentMaxRainWarning = true;
            }

            if (weatherCode !== null) segmentWeatherCodes.push(weatherCode);

            // Collect precipitation probabilities for consensus
            hourData.forEach(d => {
                if (d.precipitation_probability != null) {
                    segmentPrecipProb.push({ precipitation_probability: d.precipitation_probability });
                }
                if (d.relative_humidity_2m != null) segmentHumidity.push(d.relative_humidity_2m);
                if (d.wind_speed_10m != null) segmentWindSpeed.push(d.wind_speed_10m);
                if (d.uv_index != null) segmentUV.push(d.uv_index);
                if (d.cloud_cover != null) segmentCloud.push(d.cloud_cover);
            });
        });

        const avgTemp = segmentTemps.length > 0
            ? Math.round(segmentTemps.reduce((a, b) => a + b, 0) / segmentTemps.length)
            : null;

        const feelsLike = segmentApparent.length > 0
            ? Math.round(segmentApparent.reduce((a, b) => a + b, 0) / segmentApparent.length)
            : avgTemp;

        // Sum of max precipitations per hour
        const totalRainVal = segmentPrecip.reduce((a, b) => a + b, 0);

        // Calculate rainfall consensus
        const rainfallConsensus = calculateRainfallConsensus(segmentPrecipProb);

        let rainDisplay = totalRainVal.toFixed(1) + 'mm';

        // Display '-' if rainfall is negligible (< 1mm)
        if (totalRainVal < 1.0) {
            rainDisplay = '-';
        } else if (segmentMaxRainWarning) {
            rainDisplay += ' ⚠️';
        }

        // Get representative weather code (most common)
        const midCode = segmentWeatherCodes.length > 0
            ? segmentWeatherCodes[Math.floor(segmentWeatherCodes.length / 2)]
            : 0;

        const icon = getIcon(midCode);

        // Additional metrics
        const avgHumidity = segmentHumidity.length > 0
            ? Math.round(segmentHumidity.reduce((a, b) => a + b, 0) / segmentHumidity.length)
            : null;

        const avgWindSpeed = segmentWindSpeed.length > 0
            ? Math.round(segmentWindSpeed.reduce((a, b) => a + b, 0) / segmentWindSpeed.length)
            : null;

        const maxUV = segmentUV.length > 0 ? Math.max(...segmentUV) : null;

        const avgCloud = segmentCloud.length > 0
            ? Math.round(segmentCloud.reduce((a, b) => a + b, 0) / segmentCloud.length)
            : null;

        // Collect hourly breakdown for this segment
        const hourlyBreakdown = indices.map((hourIdx, i) => {
            // Priority: Best Match -> ECMWF -> GFS -> ICON -> any available
            const preferredOrder = ['best_match', 'ecmwf', 'gfs', 'icon'];
            let modelKey = preferredOrder.find(k => modelData[k] != null);

            if (!modelKey && availableModelKeys.length > 0) {
                modelKey = availableModelKeys[0];
            }

            const hourly = modelData[modelKey]?.hourly;

            if (!hourly) return null;

            const t = hourly.temperature_2m?.[hourIdx];
            const p = hourly.precipitation?.[hourIdx];
            const prob = hourly.precipitation_probability?.[hourIdx];
            const code = hourly.weather_code?.[hourIdx];

            return {
                time: `${hourIdx % 24}:00`,
                temp: t,
                precip: p,
                prob: prob,
                icon: getIcon(code)
            };
        }).filter(Boolean);

        return {
            temp: avgTemp,
            feelsLike: feelsLike,
            icon: icon,
            rainMm: rainDisplay,
            rainProb: rainfallConsensus || { avg: 0, min: 0, max: 0, displayString: '~0%', isWideRange: false },
            humidity: avgHumidity,
            windSpeed: avgWindSpeed,
            uvIndex: maxUV,
            cloudCover: avgCloud,
            hourly: hourlyBreakdown
        };
    };

    // Helper to extract segments for a specific day offset (0 = today, 1 = tomorrow)
    const getDaySegments = (dayOffset) => {
        const offset = dayOffset * 24;
        return {
            morning: getSegmentMetrics(6 + offset, 11 + offset),
            noon: getSegmentMetrics(12 + offset, 16 + offset),
            evening: getSegmentMetrics(17 + offset, 22 + offset)
        };
    };

    const today = getDaySegments(0);
    const tomorrow = getDaySegments(1);

    // Current weather (weighted averaged)
    const currentTemp = averageTemperature(currentData, weights, freshnessLimit);
    const currentFeelsLike = averageApparentTemperature(currentData, weights, freshnessLimit);
    const currentWeatherCode = getMostCommonWeatherCode(currentData);

    // Get additional current metrics (simple average is fine for these, or implement weighted if critical)
    const currentHumidity = currentData.length > 0 && currentData[0].relative_humidity_2m != null
        ? Math.round(currentData.reduce((sum, d) => sum + (d.relative_humidity_2m || 0), 0) / currentData.length)
        : null;

    const currentWindSpeed = currentData.length > 0 && currentData[0].wind_speed_10m != null
        ? Math.round(currentData.reduce((sum, d) => sum + (d.wind_speed_10m || 0), 0) / currentData.length)
        : null;

    const currentWindDirection = currentData.length > 0 && currentData[0].wind_direction_10m != null
        ? Math.round(currentData.reduce((sum, d) => sum + (d.wind_direction_10m || 0), 0) / currentData.length)
        : null;

    // Get daily max precipitation probability (across all available models)
    const dailyMaxPrecipProb = availableModelKeys
        .map(k => modelData[k].daily?.precipitation_probability_max?.[0])
        .filter(v => v != null);

    const maxPrecipProb = dailyMaxPrecipProb.length > 0
        ? Math.round(dailyMaxPrecipProb.reduce((a, b) => a + b, 0) / dailyMaxPrecipProb.length)
        : 0;

    // Get daily precipitation sum
    const dailyPrecipSum = availableModelKeys
        .map(k => modelData[k].daily?.precipitation_sum?.[0])
        .filter(v => v != null);

    const totalPrecip = dailyPrecipSum.length > 0
        ? (dailyPrecipSum.reduce((a, b) => a + b, 0) / dailyPrecipSum.length).toFixed(1)
        : 0;

    // Get UV index max
    const dailyUVMax = availableModelKeys
        .map(k => modelData[k].daily?.uv_index_max?.[0])
        .filter(v => v != null);

    const maxUV = dailyUVMax.length > 0
        ? Math.round(dailyUVMax.reduce((a, b) => a + b, 0) / dailyUVMax.length)
        : null;

    const successfulModels = getSuccessfulModels(modelData);

    // Dynamic Summary Construction
    let summaryText = "";
    if (parseFloat(totalPrecip) > 0) {
        summaryText += `Today's max rain probability: ${maxPrecipProb}%. Total precip: ${totalPrecip}mm. `;
    }
    summaryText += `Condition: ${getCondition(currentWeatherCode)}. UV Index: ${maxUV || 'N/A'}.`;

    return {
        name: locationName.charAt(0).toUpperCase() + locationName.slice(1),
        icon: locationName === 'muscat' ? '📍' : '🏛️',
        fetchedAt: Date.now(),
        models: {
            successful: successfulModels,
            count: successfulModels.length,
            names: formatModelNames(successfulModels)
        },
        current: {
            temp: currentTemp,
            feelsLike: currentFeelsLike,
            condition: getCondition(currentWeatherCode),
            icon: getIcon(currentWeatherCode),
            humidity: currentHumidity,
            windSpeed: currentWindSpeed,
            windDirection: currentWindDirection
        },
        morning: today.morning,
        noon: today.noon,
        evening: today.evening,
        tomorrow: tomorrow,
        summary: summaryText
    };
}
