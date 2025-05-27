import type { FastifyPluginAsync } from "fastify";
import fastifyCors from "@fastify/cors";
import fp from "fastify-plugin";
import { CORS_DEFAULTS } from "../constants.js";

const corsPlugin: FastifyPluginAsync = async (fastify) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") ?? [
        ...CORS_DEFAULTS.ALLOWED_ORIGINS_DEV,
    ];

    await fastify.register(fastifyCors, {
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"), false);
            }
        },
        methods: [...CORS_DEFAULTS.ALLOWED_METHODS],
        allowedHeaders: [...CORS_DEFAULTS.ALLOWED_HEADERS],
        exposedHeaders: [...CORS_DEFAULTS.EXPOSED_HEADERS],
        credentials: true,
        preflightContinue: false,
        optionsSuccessStatus: CORS_DEFAULTS.OPTIONS_SUCCESS_STATUS,
    });
};

export default fp(corsPlugin, { name: "cors" });
