import type { FastifyPluginAsync, FastifyError, FastifyInstance } from "fastify";
import fp from "fastify-plugin";
import { PromocodeError } from "../utils/errors.js";
import { HTTP_STATUS } from "../constants.js";

const errorHandlerPlugin: FastifyPluginAsync = (fastify: FastifyInstance): Promise<void> => {
    fastify.setErrorHandler(async (error: FastifyError, request, reply) => {
        if (error instanceof PromocodeError) {
            fastify.log.warn({
                error: error.message,
                code: error.code,
                statusCode: error.statusCode,
                url: request.url,
                method: request.method,
                userAgent: request.headers["user-agent"],
                ip: request.ip,
                timestamp: new Date().toISOString(),
                stack: error.stack,
            });

            return reply.code(error.statusCode).send({
                error: error.message,
                code: error.code,
                statusCode: error.statusCode,
            });
        }

        if (error.validation) {
            fastify.log.warn({
                error: "Validation failed",
                validation: error.validation,
                url: request.url,
                method: request.method,
            });

            return reply.code(HTTP_STATUS.BAD_REQUEST).send({
                error: "Validation failed",
                code: "VALIDATION_ERROR",
                statusCode: HTTP_STATUS.BAD_REQUEST,
                details: error.validation,
            });
        }

        fastify.log.error({
            error: error.message,
            stack: error.stack,
            url: request.url,
            method: request.method,
            userAgent: request.headers["user-agent"],
            ip: request.ip,
            timestamp: new Date().toISOString(),
            body: request.body,
            query: request.query,
            params: request.params,
        });

        return reply.code(HTTP_STATUS.INTERNAL_SERVER_ERROR).send({
            error: "Internal server error",
            code: "INTERNAL_ERROR",
            statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        });
    });

    return Promise.resolve(); // ✅ satisfy FastifyPluginAsync return type
};

export default fp(errorHandlerPlugin, { name: "errorHandler" });
