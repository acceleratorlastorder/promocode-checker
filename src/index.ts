import dotenv from "dotenv";
import { buildApp } from "./app.js";
import { LOG_CONSTANTS } from "./constants.js";

// Load environment variables
dotenv.config();

// Start server
const start = async (): Promise<void> => {
    try {
        const server = await buildApp();

        // Add graceful shutdown handlers
        const gracefulShutdown = async (signal: string): Promise<void> => {
            server.log.info(`Received ${signal}, ${LOG_CONSTANTS.MESSAGES.GRACEFUL_SHUTDOWN}`);
            try {
                await server.close();
                server.log.info(LOG_CONSTANTS.MESSAGES.SERVER_SHUTDOWN);
                process.exit(0);
            } catch (error) {
                server.log.error("Error during shutdown:", error);
                process.exit(1);
            }
        };

        process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.on("SIGINT", () => gracefulShutdown("SIGINT"));

        await server.listen({
            port: server.serverConfig.port,
            host: server.serverConfig.host,
        });

        const address = server.server.address();
        const addressPort = typeof address === "string" ? address : address?.port;

        server.log.info(`${LOG_CONSTANTS.MESSAGES.SERVER_START} ${addressPort}`);
        server.log.info(`Environment: ${server.serverConfig.environment}`);
    } catch (err) {
        console.error("Failed to start server:", err);
        process.exit(1);
    }
};

void start();
