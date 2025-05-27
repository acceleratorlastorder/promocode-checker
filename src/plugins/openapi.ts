import type { FastifyPluginAsync } from "fastify";
import fastifySwagger from "@fastify/swagger";
import fastifySwaggerUi from "@fastify/swagger-ui";
import fp from "fastify-plugin";

const openApiPlugin: FastifyPluginAsync = async (fastify) => {
    try {
        await fastify.register(fastifySwagger, {
            mode: "static",
            specification: {
                path: "./static/openapi.yaml",
                baseDir: process.cwd(),
            },
        });

        await fastify.register(fastifySwaggerUi, {
            routePrefix: "/documentation",
            uiConfig: {
                docExpansion: "list",
                deepLinking: false,
            },
        });

        fastify.log.info("OpenAPI documentation available at /documentation");
    } catch (error) {
        fastify.log.warn("Failed to setup OpenAPI documentation:", error);
    }
};

export default fp(openApiPlugin, { name: "openapi" });
