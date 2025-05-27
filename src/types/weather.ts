/**
 * Weather Service Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to the weather service,
 * including rate limiting, caching, performance metrics, and API responses.
 */

// Core weather data interface
export interface WeatherData {
    condition: string;
    temperature: number;
}

// Rate limiting interfaces
export interface RateLimitStatus {
    count: number;
    limit: number;
    resetTime: number;
    remainingRequests: number;
    secondsUntilReset: number;
}

// Cache status interfaces
export interface CacheStatus {
    totalEntries: number;
    recentEntries: number;
    oldEntries: number;
}

// Performance tracking interfaces
export interface PerformanceStats {
    totalRequests: number;
    recentCacheHits: number;
    regularCacheHits: number;
    apiCalls: number;
    rateLimitBlocks: number;
    recentCacheHitPercentage: number;
    totalCacheHitPercentage: number;
    apiCallReductionPercentage: number;
}

export interface PerformanceMetrics {
    recentCacheHitRate: string;
    totalCacheEfficiency: string;
    stats: PerformanceStats;
}

// Comprehensive weather service status
export interface WeatherServiceStatus {
    rateLimit: RateLimitStatus;
    cache: CacheStatus;
    performance: PerformanceMetrics;
}

// Internal interfaces (used within weather service implementation)
export interface CacheEntry {
    data: WeatherData;
    timestamp: number;
}

export interface RateLimitEntry {
    count: number;
    resetTime: number;
}

export interface PendingRequest {
    promise: Promise<WeatherData>;
    resolve: (data: WeatherData) => void;
    reject: (error: Error) => void;
}

// Internal performance tracking interface
export interface InternalPerformanceStats {
    totalRequests: number;
    recentCacheHits: number;
    regularCacheHits: number;
    apiCalls: number;
    rateLimitBlocks: number;
}

// OpenWeatherMap API response interface
export interface OpenWeatherMapResponse {
    weather: Array<{
        id: number;
        main: string;
        description: string;
        icon: string;
    }>;
    main: {
        temp: number;
        feels_like: number;
        temp_min: number;
        temp_max: number;
        pressure: number;
        humidity: number;
    };
    name: string;
}
