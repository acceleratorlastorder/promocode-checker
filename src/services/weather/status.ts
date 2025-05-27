// src/services/weather/status.ts
import { WEATHER_CONSTANTS } from "../../constants.js";
import type {
    WeatherServiceStatus,
    RateLimitStatus,
    CacheStatus,
    PerformanceStats,
    PerformanceMetrics,
} from "../../types/weather.js";
import { performanceStats, weatherCache, rateLimitData } from "./_internals.js";

const { MAX_REQUESTS_PER_MINUTE, RATE_LIMIT_WINDOW_MS, RECENT_CACHE_TTL_MS, CACHE_TTL_MS } =
    WEATHER_CONSTANTS;

export function createRateLimitStatus(apiKey: string): RateLimitStatus {
    const rateLimitEntry = rateLimitData.get(apiKey);

    if (rateLimitEntry) {
        const now = Date.now();
        return {
            count: rateLimitEntry.count,
            limit: MAX_REQUESTS_PER_MINUTE,
            resetTime: rateLimitEntry.resetTime,
            remainingRequests: Math.max(0, MAX_REQUESTS_PER_MINUTE - rateLimitEntry.count),
            secondsUntilReset: Math.max(0, Math.ceil((rateLimitEntry.resetTime - now) / 1000)),
        };
    }

    return {
        count: 0,
        limit: MAX_REQUESTS_PER_MINUTE,
        resetTime: Date.now() + RATE_LIMIT_WINDOW_MS,
        remainingRequests: MAX_REQUESTS_PER_MINUTE,
        secondsUntilReset: 60,
    };
}

export function analyzeCacheStatus(): CacheStatus {
    const now = Date.now();
    let totalEntries = 0;
    let recentEntries = 0;
    let oldEntries = 0;

    for (const cached of weatherCache.values()) {
        totalEntries++;
        const age = now - cached.timestamp;
        if (age < RECENT_CACHE_TTL_MS) {
            recentEntries++;
        } else if (age < CACHE_TTL_MS) {
            oldEntries++;
        }
    }

    return { totalEntries, recentEntries, oldEntries };
}

export function calculatePerformanceStats(): PerformanceStats {
    const { totalRequests, recentCacheHits, regularCacheHits, apiCalls, rateLimitBlocks } =
        performanceStats;

    return {
        totalRequests,
        recentCacheHits,
        regularCacheHits,
        apiCalls,
        rateLimitBlocks,
        recentCacheHitPercentage:
            totalRequests > 0 ? Math.round((recentCacheHits / totalRequests) * 100) : 0,
        totalCacheHitPercentage:
            totalRequests > 0
                ? Math.round(((recentCacheHits + regularCacheHits) / totalRequests) * 100)
                : 0,
        apiCallReductionPercentage:
            totalRequests > 0 ? Math.round((1 - apiCalls / totalRequests) * 100) : 0,
    };
}

export function createPerformanceMetrics(cache: CacheStatus): PerformanceMetrics {
    const { totalEntries, recentEntries } = cache;

    return {
        recentCacheHitRate:
            recentEntries > 0 ? `${Math.round((recentEntries / totalEntries) * 100)}%` : "0%",
        totalCacheEfficiency: totalEntries > 0 ? `${totalEntries} cities cached` : "No cached data",
        stats: calculatePerformanceStats(),
    };
}

export function getWeatherServiceStatus(apiKey?: string): WeatherServiceStatus {
    const key = apiKey ?? process.env.OPENWEATHERMAP_API_KEY ?? "";
    const cache = analyzeCacheStatus();
    const rateLimit = createRateLimitStatus(key);
    const metrics = createPerformanceMetrics(cache);
    return { cache, rateLimit, performance: metrics };
}
