import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { fetchWeather } from '../services/weatherService';
import { getSettings } from '../utils/storage';
import { MOCK_WEATHER } from '../data/mockData';

const WeatherContext = createContext();

export function WeatherProvider({ children }) {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastFetch, setLastFetch] = useState(0);

    const loadWeather = useCallback(async (force = false) => {
        // Cache TTL: 15 minutes
        if (!force && weatherData && (Date.now() - lastFetch < 15 * 60 * 1000)) {
            return;
        }

        setLoading(true);
        const settings = getSettings();

        if (settings?.sections?.weather === false) {
            setLoading(false);
            return;
        }

        try {
            const cities = ['chennai', 'trichy', 'muscat'];
            const results = await Promise.allSettled(
                cities.map(city => fetchWeather(city))
            );

            const data = {
                chennai: results[0].status === 'fulfilled' ? results[0].value : MOCK_WEATHER.chennai,
                trichy: results[1].status === 'fulfilled' ? results[1].value : MOCK_WEATHER.trichy,
                muscat: results[2].status === 'fulfilled' ? results[2].value : MOCK_WEATHER.muscat,
            };

            setWeatherData(data);
            setLastFetch(Date.now());
            setError(null);
        } catch (err) {
            console.error("Weather Context Error:", err);
            setError(err);
            setWeatherData(MOCK_WEATHER);
        } finally {
            setLoading(false);
        }
    }, [weatherData, lastFetch]);

    useEffect(() => {
        loadWeather();
    }, [loadWeather]);

    return (
        <WeatherContext.Provider value={{ weatherData, loading, error, refreshWeather: loadWeather }}>
            {children}
        </WeatherContext.Provider>
    );
}

export function useWeather() {
    return useContext(WeatherContext);
}
