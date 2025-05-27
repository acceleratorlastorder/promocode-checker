import fastify from "fastify";
import type { FastifyInstance } from "fastify";
import multipartPlugin from "@fastify/multipart";
import { SERVER_DEFAULTS, API_CONSTANTS } from "./constants.js";

// Import plugins
import corsPlugin from "./plugins/cors.js";
import configPlugin from "./plugins/config.js";
import authPlugin from "./plugins/auth.js";
import prismaPlugin from "./plugins/prisma.js";
import openApiPlugin from "./plugins/openapi.js";
import rateLimitPlugin from "./plugins/rateLimit.js";
import errorHandlerPlugin from "./plugins/errorHandler.js";
import securityPlugin from "./plugins/security.js";
import healthPlugin from "./plugins/health.js";

// Import routes
import promocodeRoutes from "./routes/promocodeRoutes.js";

export interface AppOptions {
    logger?: boolean | object;
    database?: {
        url: string;
    };
}

export async function buildApp(options: AppOptions = {}): Promise<FastifyInstance> {
    // Determine logger configuration based on environment
    const getLoggerConfig = (): boolean | object => {
        if (options.logger !== undefined) {
            return options.logger;
        }

        const nodeEnv = process.env.NODE_ENV ?? "development";

        if (nodeEnv === "production") {
            // Production: simple JSON logging
            return {
                level: process.env.LOG_LEVEL ?? SERVER_DEFAULTS.PRODUCTION_LOG_LEVEL,
            };
        }
        // Development: try pretty printing, fallback to JSON if not available
        let hasPinoPretty = false;
        try {
            require.resolve("pino-pretty");
            hasPinoPretty = true;
        } catch {
            // pino-pretty not available
        }

        if (hasPinoPretty) {
            return {
                level: process.env.LOG_LEVEL ?? SERVER_DEFAULTS.LOG_LEVEL,
                transport: {
                    target: "pino-pretty",
                    options: {
                        translateTime: "HH:MM:ss Z",
                        ignore: "pid,hostname",
                    },
                },
            };
        }
        // Fallback to simple logging if pino-pretty is not available
        return {
            level: process.env.LOG_LEVEL ?? SERVER_DEFAULTS.LOG_LEVEL,
        };
    };

    const server = fastify({
        logger: getLoggerConfig(),
    });

    try {
        // Register plugins
        await server.register(configPlugin);

        // Update logger level after config is loaded if not explicitly set
        if (options.logger === undefined) {
            server.log.level = server.serverConfig.logLevel;
        }

        await server.register(errorHandlerPlugin);
        await server.register(securityPlugin);
        await server.register(corsPlugin);
        await server.register(rateLimitPlugin);
        await server.register(multipartPlugin);
        await server.register(authPlugin);
        await server.register(prismaPlugin);
        await server.register(healthPlugin);

        // Only register OpenAPI in non-test environments
        if (options.logger !== false) {
            await server.register(openApiPlugin);
        }

        // Register routes
        await server.register(promocodeRoutes, { prefix: API_CONSTANTS.PREFIX });

        return server;
    } catch (err) {
        server.log.error("Failed to build app:", err);
        throw err;
    }
}
