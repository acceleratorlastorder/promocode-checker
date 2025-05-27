import "fastify";

// Define the structure of your serverConfig decoration
interface ServerConfig {
    port: number;
    host: string;
    logLevel: string;
    environment: string;
    apiKey: string;
    openWeatherMapApiKey: string;
    openWeatherMapApiUrl: string;
    databaseUrl: string;
    isDevelopment: () => boolean;
    isProduction: () => boolean;
}

// Define the config structure from @fastify/env
interface FastifyConfig {
    NODE_ENV: string;
    PORT: number;
    HOST: string;
    LOG_LEVEL: string;
    API_KEY: string;
    OPENWEATHERMAP_API_KEY: string;
    OPENWEATHERMAP_API_URL: string;
    DATABASE_URL: string;
    DATABASE_HOST: string;
    DATABASE_PORT: number;
    DATABASE_USER: string;
    DATABASE_PASSWORD: string;
    DATABASE_NAME: string;
}

declare module "fastify" {
    interface FastifyInstance {
        config: FastifyConfig;
        serverConfig: ServerConfig;
    }
}
