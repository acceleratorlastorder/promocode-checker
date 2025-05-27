import type { WeatherData, WeatherServiceStatus, RateLimitStatus } from "../../types/weather.js";
import { ExternalServiceError } from "../../utils/errors.js";
import { performanceStats, clearAllData } from "./_internals.js";
import { getRecentCachedWeather, getCachedWeather, setCachedWeather } from "./cache.js";
import { checkRateLimit } from "./rateLimiter.js";
import { fetchWeatherFromApi } from "./apiClient.js";
import { fetchWeatherFromMock } from "./mockClient.js";
import { getWeatherServiceStatus, createRateLimitStatus } from "./status.js";

// Re-export types for backward compatibility
export type { WeatherData, WeatherServiceStatus, RateLimitStatus };

/**
 * Main weather service function - fetches weather data from API or mock files
 */
export async function getWeather(town: string): Promise<WeatherData> {
    const normalizedTown = town.toLowerCase();
    performanceStats.totalRequests++;

    // Tier 1: Check for very recent data (< 1 minute) - return immediately
    const recentData = getRecentCachedWeather(normalizedTown);
    if (recentData) {
        return recentData;
    }

    // Tier 2: Check for cached data (< 1 hour)
    const cachedData = getCachedWeather(normalizedTown);
    if (cachedData) {
        return cachedData;
    }

    // Determine if we should use mock data or real API
    const isTestMode = process.env.NODE_ENV === "test" || process.env.USE_MOCK_WEATHER === "true";

    try {
        let weatherData: WeatherData;

        if (isTestMode) {
            weatherData = await fetchWeatherFromMock(town);
        } else {
            const apiKey = process.env.OPENWEATHERMAP_API_KEY;
            if (!apiKey) {
                throw new Error(
                    "OPENWEATHERMAP_API_KEY environment variable is required for production weather data",
                );
            }

            // Check rate limit before making request
            checkRateLimit(apiKey);
            performanceStats.apiCalls++;
            weatherData = await fetchWeatherFromApi(town, apiKey);
        }

        // Cache the result
        setCachedWeather(normalizedTown, weatherData);
        return weatherData;
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        throw new ExternalServiceError(
            "Weather",
            `Unable to fetch weather data for ${town}: ${errorMessage}`,
        );
    }
}

/**
 * Get comprehensive weather service status
 */
export function getWeatherStatus(apiKey?: string): WeatherServiceStatus {
    return getWeatherServiceStatus(apiKey);
}

/**
 * Get current rate limit status (legacy function for backward compatibility)
 */
export function getRateLimitStatus(apiKey?: string): RateLimitStatus | null {
    const normalizedApiKey = apiKey ?? process.env.OPENWEATHERMAP_API_KEY ?? "";
    return createRateLimitStatus(normalizedApiKey);
}

/**
 * Clear all weather cache and performance data (useful for testing)
 */
export function clearWeatherCache(): void {
    clearAllData();
}
