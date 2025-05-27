import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import rateLimit from "@fastify/rate-limit";
import { RATE_LIMIT_CONFIG, LOG_CONSTANTS } from "../constants.js";

const rateLimitPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
    await fastify.register(rateLimit, {
        max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
        timeWindow: RATE_LIMIT_CONFIG.TIME_WINDOW,
        cache: RATE_LIMIT_CONFIG.CACHE_SIZE,
        allowList: [RATE_LIMIT_CONFIG.LOCALHOST_IP],
        redis: undefined, // Use in-memory store for now
        skipOnError: true, // Don't fail if rate limiter fails
        keyGenerator: (request) =>
            // Use IP address as key
            request.ip,
        errorResponseBuilder: () => ({
            error: "Rate limit exceeded",
            message: RATE_LIMIT_CONFIG.ERROR_MESSAGE,
            statusCode: RATE_LIMIT_CONFIG.STATUS_CODE,
        }),
        onExceeding: (request) => {
            fastify.log.warn(LOG_CONSTANTS.MESSAGES.RATE_LIMIT_EXCEEDED, request.ip);
        },
        onExceeded: (request) => {
            fastify.log.error(LOG_CONSTANTS.MESSAGES.RATE_LIMIT_EXCEEDED, request.ip);
        },
    });
};

export default fp(rateLimitPlugin, { name: "rateLimit" });
