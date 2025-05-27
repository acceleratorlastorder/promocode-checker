import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";

const securityPlugin: FastifyPluginAsync = (fastify): Promise<void> => {
    // Add security headers to all responses
    fastify.addHook("onSend", async (request, reply, payload) => {
        // Security headers
        reply.header("X-Content-Type-Options", "nosniff");
        reply.header("X-Frame-Options", "DENY");
        reply.header("X-XSS-Protection", "1; mode=block");
        reply.header("Referrer-Policy", "strict-origin-when-cross-origin");
        reply.header("Permissions-Policy", "camera=(), microphone=(), geolocation=()");

        // Content Security Policy
        reply.header(
            "Content-Security-Policy",
            "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'",
        );

        // HSTS for HTTPS (only in production)
        if (fastify.serverConfig.isProduction() && request.protocol === "https") {
            reply.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        }

        // Hide server information
        reply.removeHeader("X-Powered-By");
        reply.removeHeader("Server");

        return payload;
    });

    // Return a resolved Promise to satisfy FastifyPluginAsync
    return Promise.resolve();
};

export default fp(securityPlugin, { name: "security" });
