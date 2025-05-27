// src/services/weather/rateLimiter.ts
import { WEATHER_CONSTANTS } from "../../constants.js";
import { rateLimitData, performanceStats } from "./_internals.js";

export function checkRateLimit(apiKey: string): void {
    const now = Date.now();
    let entry = rateLimitData.get(apiKey);

    if (!entry || now >= entry.resetTime) {
        entry = { count: 0, resetTime: now + WEATHER_CONSTANTS.RATE_LIMIT_WINDOW_MS };
        rateLimitData.set(apiKey, entry);
    }

    if (entry.count >= WEATHER_CONSTANTS.MAX_REQUESTS_PER_MINUTE) {
        performanceStats.rateLimitBlocks++;
        throw new Error(
            `Rate limit exceeded (${entry.count} reqs). Try again in ${Math.ceil((entry.resetTime - now) / 1000)}s`,
        );
    }

    entry.count++;
}

export function clearRateLimits(): void {
    rateLimitData.clear();
}
