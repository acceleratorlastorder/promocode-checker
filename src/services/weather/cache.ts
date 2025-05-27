import { WEATHER_CONSTANTS } from "../../constants.js";
import type { WeatherData } from "../../types/weather.js";
import { weatherCache, performanceStats } from "./_internals.js";

export function getRecentCachedWeather(city: string): WeatherData | null {
    const entry = weatherCache.get(city);
    if (entry && Date.now() - entry.timestamp < WEATHER_CONSTANTS.RECENT_CACHE_TTL_MS) {
        performanceStats.recentCacheHits++;
        return entry.data;
    }
    return null;
}

export function getCachedWeather(city: string): WeatherData | null {
    const entry = weatherCache.get(city);
    if (entry && Date.now() - entry.timestamp < WEATHER_CONSTANTS.CACHE_TTL_MS) {
        performanceStats.regularCacheHits++;
        return entry.data;
    }
    if (entry) weatherCache.delete(city);
    return null;
}

export function setCachedWeather(city: string, data: WeatherData): void {
    weatherCache.set(city, { data, timestamp: Date.now() });
}

export function clearCache(): void {
    weatherCache.clear();
}
