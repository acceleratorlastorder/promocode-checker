import fastifyEnv from "@fastify/env";
import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { SERVER_DEFAULTS, DATABASE_DEFAULTS, API_CONSTANTS } from "../constants.js";

const schema = {
    type: "object",
    required: ["API_KEY"],
    properties: {
        NODE_ENV: {
            type: "string",
            default: SERVER_DEFAULTS.NODE_ENV,
        },
        PORT: {
            type: "number",
            default: SERVER_DEFAULTS.PORT,
        },
        HOST: {
            type: "string",
            default: SERVER_DEFAULTS.HOST,
        },
        LOG_LEVEL: {
            type: "string",
            default: SERVER_DEFAULTS.LOG_LEVEL,
        },
        // Authentication
        API_KEY: {
            type: "string",
            minLength: 16, // Minimum length for security
            // No default - must be provided via environment variable
        },
        // Weather API configuration
        OPENWEATHERMAP_API_KEY: {
            type: "string",
        },
        OPENWEATHERMAP_API_URL: {
            type: "string",
            default: API_CONSTANTS.OPENWEATHERMAP_BASE_URL,
        },
        // Database configuration - either URL or individual components
        DATABASE_URL: {
            type: "string",
        },
        DATABASE_HOST: {
            type: "string",
            default: DATABASE_DEFAULTS.HOST,
        },
        DATABASE_PORT: {
            type: "number",
            default: DATABASE_DEFAULTS.PORT,
        },
        DATABASE_USER: {
            type: "string",
            default: DATABASE_DEFAULTS.USER,
        },
        DATABASE_PASSWORD: {
            type: "string",
            default: DATABASE_DEFAULTS.PASSWORD,
        },
        DATABASE_NAME: {
            type: "string",
            default: DATABASE_DEFAULTS.NAME,
        },
    },
};

const configPlugin: FastifyPluginAsync = async (fastify) => {
    await fastify.register(fastifyEnv, {
        schema,
        dotenv: true,
    });

    // Additional validation for production environment
    if (fastify.config.NODE_ENV === "production") {
        const requiredProductionVars = ["API_KEY", "DATABASE_URL"];

        for (const varName of requiredProductionVars) {
            if (!fastify.config[varName as keyof typeof fastify.config]) {
                throw new Error(`${varName} is required in production environment`);
            }
        }

        // Validate API key strength in production
        const apiKey = fastify.config.API_KEY;
        if (apiKey.length < 32) {
            fastify.log.warn("API key should be at least 32 characters in production");
        }
    }

    // Construct DATABASE_URL from individual components if not provided
    let databaseUrl = fastify.config.DATABASE_URL;
    if (!databaseUrl && fastify.config.DATABASE_HOST) {
        const { DATABASE_HOST, DATABASE_PORT, DATABASE_USER, DATABASE_PASSWORD, DATABASE_NAME } =
            fastify.config;
        databaseUrl = `postgresql://${DATABASE_USER}:${DATABASE_PASSWORD}@${DATABASE_HOST}:${DATABASE_PORT}/${DATABASE_NAME}`;

        // Set the constructed URL in the environment for Prisma
        process.env.DATABASE_URL = databaseUrl;

        fastify.log.info(`Constructed DATABASE_URL from individual components`);
    }

    // Add computed configuration properties
    fastify.decorate("serverConfig", {
        // Server settings
        port: fastify.config.PORT,
        host: fastify.config.HOST,
        logLevel: fastify.config.LOG_LEVEL,
        environment: fastify.config.NODE_ENV,

        // Authentication
        apiKey: fastify.config.API_KEY,

        // Weather API settings
        openWeatherMapApiKey: fastify.config.OPENWEATHERMAP_API_KEY,
        openWeatherMapApiUrl: fastify.config.OPENWEATHERMAP_API_URL,

        // Database settings
        databaseUrl,

        // Helper methods
        isDevelopment: () => fastify.config.NODE_ENV === "development",
        isProduction: () => fastify.config.NODE_ENV === "production",
    });

    // Log config at startup
    fastify.log.info(`Environment: ${fastify.config.NODE_ENV}`);
    fastify.log.info(`Server will start on ${fastify.config.HOST}:${fastify.config.PORT}`);
    fastify.log.info(`Database: ${databaseUrl ? "Connected" : "Not configured"}`);
};

export default fp(configPlugin, { name: "config" });
