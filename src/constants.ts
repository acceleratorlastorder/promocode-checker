/**
 * Application Constants
 * Centralized location for all default values, configurations, and constants
 */

// =============================================================================
// SERVER CONFIGURATION
// =============================================================================
export const SERVER_DEFAULTS = {
    NODE_ENV: "development",
    PORT: 3000,
    HOST: "0.0.0.0",
    LOG_LEVEL: "info",
    PRODUCTION_LOG_LEVEL: "warn",
} as const;

// =============================================================================
// AUTHENTICATION
// =============================================================================
export const AUTH_CONSTANTS = {
    API_KEY_MIN_LENGTH: 16,
    BEARER_PREFIX: "Bearer ",
    API_KEY_HEADER: "x-api-key",
} as const;

// =============================================================================
// RATE LIMITING
// =============================================================================
export const RATE_LIMIT_CONFIG = {
    MAX_REQUESTS: 100,
    TIME_WINDOW: "1 minute",
    CACHE_SIZE: 10000,
    LOCALHOST_IP: "127.0.0.1",
    STATUS_CODE: 429,
    ERROR_MESSAGE: "Too many requests, please try again later.",
} as const;

// =============================================================================
// CORS CONFIGURATION
// =============================================================================
export const CORS_DEFAULTS = {
    ALLOWED_ORIGINS_DEV: ["http://localhost:3000", "http://127.0.0.1:3000"],
    ALLOWED_METHODS: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    ALLOWED_HEADERS: ["Content-Type", "Authorization", "X-API-Key"],
    EXPOSED_HEADERS: ["X-RateLimit-Limit", "X-RateLimit-Remaining"],
    OPTIONS_SUCCESS_STATUS: 204,
} as const;

// =============================================================================
// DATABASE CONFIGURATION
// =============================================================================
export const DATABASE_DEFAULTS = {
    HOST: "localhost",
    PORT: 5432,
    USER: "promocode_user",
    PASSWORD: "promocode_password",
    NAME: "promocode_db",
    PRODUCTION_NAME: "promocode_production",
} as const;

// =============================================================================
// WEATHER SERVICE
// =============================================================================
export const WEATHER_CONSTANTS = {
    // Default fallback weather when service fails
    DEFAULT_CONDITION: "cloudy",
    DEFAULT_TEMPERATURE: 15,

    // File path configurations
    WEATHER_DIR: "weather",
    FILE_PREFIX: "weather-static-call-",
    FILE_EXTENSION: ".json",

    // Rate limiting (OpenWeatherMap free tier: 60 calls/minute)
    RATE_LIMIT_WINDOW_MS: 60 * 1000, // 1 minute
    MAX_REQUESTS_PER_MINUTE: 50, // Stay under the 60/min limit for safety

    // Two-tier caching strategy
    RECENT_CACHE_TTL_MS: 60 * 1000, // 1 minute - return immediately for very recent requests
    CACHE_TTL_MS: 60 * 60 * 1000, // 1 hour - full cache duration

    // OpenWeatherMap condition mappings
    CONDITION_MAP: {
        Clear: "clear",
        Clouds: "cloudy",
        Rain: "rain",
        Snow: "snow",
        Thunderstorm: "storm",
        Drizzle: "rain",
        Mist: "cloudy",
        Smoke: "cloudy",
        Haze: "cloudy",
        Dust: "cloudy",
        Fog: "cloudy",
        Sand: "cloudy",
        Ash: "cloudy",
        Squall: "storm",
        Tornado: "storm",
    },

    // Temperature conversion
    KELVIN_TO_CELSIUS_OFFSET: 273.15,
} as const;

// =============================================================================
// API CONFIGURATION
// =============================================================================
export const API_CONSTANTS = {
    PREFIX: "/api",
    HEALTH_ENDPOINT: "/ping",
    DOCUMENTATION_ENDPOINT: "/documentation",

    // External APIs
    OPENWEATHERMAP_BASE_URL: "https://api.openweathermap.org/data/2.5",

    // Response messages
    HEALTH_STATUS: "ok",
    UNAUTHORIZED_MESSAGE:
        "API key required. Provide it via Authorization header (Bearer token) or X-API-Key header.",
    INVALID_API_KEY_MESSAGE: "Invalid API key.",
} as const;

// =============================================================================
// VALIDATION CONSTANTS
// =============================================================================
export const VALIDATION_CONSTANTS = {
    PROMOCODE_NAME: {
        MIN_LENGTH: 1,
        MAX_LENGTH: 100,
        PATTERN: "^[a-zA-Z0-9_-]+$",
    },

    // Error messages
    ERRORS: {
        UNKNOWN_ERROR: "Unknown error",
        PROMOCODE_NOT_FOUND: "Promocode not found",
        PROMOCODE_EXISTS:
            "Promocode with this name already exists. Please choose a different name or delete the existing one first.",
        PROMOCODE_NAME_CONFLICT:
            "A promocode with this name already exists. Names are case-insensitive.",
        WEATHER_SERVICE_ERROR: "Failed to retrieve weather information for validation.",
        VALIDATION_FAILED: "Promocode conditions not met. No specific reasons available.",
        INTERNAL_ERROR: "Internal server error during validation",
        NAME_REQUIRED: "Promocode name must be a string",
        NAME_EMPTY: "Promocode name cannot be empty or whitespace",
        NAME_TOO_LONG: "Promocode name cannot exceed 100 characters",
        NAME_INVALID_CHARS:
            "Promocode name can only contain letters, numbers, hyphens, and underscores",
    },
} as const;

// =============================================================================
// FILE PATHS
// =============================================================================
export const FILE_PATHS = {
    STATIC_DIR: "static",
    OPENAPI_FILE: "openapi.yaml",
    TYPES_DIR: "src/types/generated",
} as const;

// =============================================================================
// HTTP STATUS CODES
// =============================================================================
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
    CONFLICT: 409,
    TOO_MANY_REQUESTS: 429,
    INTERNAL_SERVER_ERROR: 500,
    SERVICE_UNAVAILABLE: 503,
} as const;

// =============================================================================
// LOGGING
// =============================================================================
export const LOG_CONSTANTS = {
    LEVELS: {
        ERROR: "error",
        WARN: "warn",
        INFO: "info",
        DEBUG: "debug",
    },

    MESSAGES: {
        SERVER_START: "Server listening on port",
        SERVER_SHUTDOWN: "Server closed successfully",
        GRACEFUL_SHUTDOWN: "shutting down gracefully...",
        AUTH_SUCCESS: "Authentication from %s successful",
        AUTH_FAILURE: "Invalid API key from %s",
        NO_API_KEY: "No API key provided from %s",
        RATE_LIMIT_EXCEEDED: "Rate limit exceeded for IP: %s",
        WEATHER_FETCH_ERROR: "Failed to load weather data for %s:",
    },
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================
export type WeatherCondition = keyof typeof WEATHER_CONSTANTS.CONDITION_MAP;
export type LogLevel = (typeof LOG_CONSTANTS.LEVELS)[keyof typeof LOG_CONSTANTS.LEVELS];
export type HttpStatusCode = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];
