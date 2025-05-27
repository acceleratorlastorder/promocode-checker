import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { getRateLimitStatus, getWeatherStatus } from "../services/weather/weatherService.js";
import type {
    HealthCheckResponse,
    RateLimitResponse,
    WeatherServiceResponse,
    PingResponse,
} from "../types/health.js";

const healthPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
    // Add health check method to fastify instance
    fastify.decorate("healthCheck", async (): Promise<HealthCheckResponse> => {
        const health: HealthCheckResponse = {
            status: "ok",
            timestamp: new Date().toISOString(),
            services: {
                database: "unknown",
                weather: "ok",
            },
            uptime: process.uptime(),
            memory: process.memoryUsage(),
        };

        // Check database connectivity
        try {
            await fastify.prisma.$queryRaw`SELECT 1`;
            health.services.database = "ok";
        } catch (error) {
            health.services.database = "error";
            fastify.log.error("Database health check failed:", error);
        }

        // Check weather service rate limit status
        try {
            const rateLimitStatus = getRateLimitStatus();
            if (rateLimitStatus && rateLimitStatus.remainingRequests > 0) {
                health.services.weather = "ok";
            } else {
                health.services.weather = "error";
            }
        } catch (error) {
            health.services.weather = "error";
            fastify.log.warn("Weather service rate limit check failed:", error);
        }

        return health;
    });

    // Enhanced health endpoint
    await fastify.register(function healthRoutes(fastify) {
        fastify.get("/health", async (_request, reply) => {
            const health = await fastify.healthCheck();

            // Return 503 if any critical service is down
            if (health.services.database === "error") {
                reply.code(503);
            }

            return health;
        });

        // Simple ping endpoint (kept for backward compatibility)
        fastify.get(
            "/ping",
            (): PingResponse => ({
                status: "ok",
                timestamp: new Date().toISOString(),
            }),
        );

        // Rate limit status endpoint for monitoring (legacy)
        fastify.get("/health/weather-rate-limit", (): RateLimitResponse => {
            const rateLimitStatus = getRateLimitStatus();
            return {
                rateLimitStatus,
                timestamp: new Date().toISOString(),
            };
        });

        // Comprehensive weather service status with cache analytics
        fastify.get("/health/weather-service", (): WeatherServiceResponse => {
            const weatherStatus = getWeatherStatus();
            return {
                weatherService: weatherStatus,
                timestamp: new Date().toISOString(),
                explanation: {
                    cache: {
                        recentEntries: "Cities with data < 1 minute old (returned immediately)",
                        oldEntries: "Cities with data 1min-1hour old (rate limit checked)",
                        totalEntries: "All cached cities",
                    },
                    rateLimit: {
                        strategy:
                            "Two-tier caching: < 1min bypasses rate limit, 1min-1hour checks limit",
                    },
                },
            };
        });
    });
};

// Extend FastifyInstance type
declare module "fastify" {
    interface FastifyInstance {
        healthCheck(): Promise<HealthCheckResponse>;
    }
}

export default fp(healthPlugin, { name: "health" });
