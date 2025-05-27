import type { FastifyPluginAsync, FastifyRequest, FastifyReply, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { safeCompare } from "../utils/crypto.js";
import { AUTH_CONSTANTS, API_CONSTANTS, LOG_CONSTANTS } from "../constants.js";
import { UnauthorizedError } from "../utils/errors.js";

// Extend Fastify instance to include authenticate method
declare module "fastify" {
    interface FastifyInstance {
        authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    }
}

const authPlugin: FastifyPluginAsync = (fastify: FastifyInstance): Promise<void> => {
    const { apiKey } = fastify.serverConfig;

    fastify.log.info(`Authentication enabled with API key: ${apiKey.substring(0, 8)}...`);

    fastify.decorate("authenticate", function (request: FastifyRequest): Promise<void> {
        const authHeader = request.headers.authorization;
        const apiKeyHeader = request.headers[AUTH_CONSTANTS.API_KEY_HEADER] as string;

        let providedKey: string | undefined;

        if (authHeader?.startsWith(AUTH_CONSTANTS.BEARER_PREFIX)) {
            providedKey = authHeader.substring(AUTH_CONSTANTS.BEARER_PREFIX.length);
        } else if (apiKeyHeader) {
            providedKey = apiKeyHeader;
        }

        if (!providedKey) {
            request.log.error(LOG_CONSTANTS.MESSAGES.NO_API_KEY, request.ip);
            throw new UnauthorizedError(API_CONSTANTS.UNAUTHORIZED_MESSAGE);
        }

        if (!safeCompare(providedKey, apiKey)) {
            request.log.error(LOG_CONSTANTS.MESSAGES.AUTH_FAILURE, request.ip);
            throw new UnauthorizedError(API_CONSTANTS.INVALID_API_KEY_MESSAGE);
        }

        request.log.info(LOG_CONSTANTS.MESSAGES.AUTH_SUCCESS, request.ip);
        return Promise.resolve();
    });

    return Promise.resolve();
};

export default fp(authPlugin, { name: "auth" });
