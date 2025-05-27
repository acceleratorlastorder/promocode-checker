/**
 * Health Check Type Definitions
 *
 * This file contains all TypeScript interfaces and types related to health checks,
 * service status monitoring, and API health endpoints.
 */

import type { RateLimitStatus, WeatherServiceStatus } from "./weather.js";

// Service status enum-like type
export interface ServiceStatus {
    database: "ok" | "error" | "unknown";
    weather: "ok" | "error" | "unknown";
}

// Main health check response
export interface HealthCheckResponse {
    status: "ok";
    timestamp: string;
    services: ServiceStatus;
    uptime: number;
    memory: NodeJS.MemoryUsage;
}

// Rate limit endpoint response
export interface RateLimitResponse {
    rateLimitStatus: RateLimitStatus | null;
    timestamp: string;
}

// Weather service detailed status endpoint response
export interface WeatherServiceResponse {
    weatherService: WeatherServiceStatus;
    timestamp: string;
    explanation: {
        cache: {
            recentEntries: string;
            oldEntries: string;
            totalEntries: string;
        };
        rateLimit: {
            strategy: string;
        };
    };
}

// Simple ping response
export interface PingResponse {
    status: "ok";
    timestamp: string;
}
