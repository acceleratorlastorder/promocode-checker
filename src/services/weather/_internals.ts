// Shared internal state for weather service modules
import type { CacheEntry, RateLimitEntry, InternalPerformanceStats } from "../../types/weather.js";

// Shared cache for weather data
export const weatherCache = new Map<string, CacheEntry>();

// Rate limiting data keyed by API key
export const rateLimitData = new Map<string, RateLimitEntry>();

// Performance tracking stats
export const performanceStats: InternalPerformanceStats = {
    totalRequests: 0,
    recentCacheHits: 0,
    regularCacheHits: 0,
    apiCalls: 0,
    rateLimitBlocks: 0,
};

// Reset performance statistics
export function resetPerformanceStats(): void {
    performanceStats.totalRequests = 0;
    performanceStats.recentCacheHits = 0;
    performanceStats.regularCacheHits = 0;
    performanceStats.apiCalls = 0;
    performanceStats.rateLimitBlocks = 0;
}

// Clear all weather service data (useful for testing)
export function clearAllData(): void {
    weatherCache.clear();
    rateLimitData.clear();
    resetPerformanceStats();
}
