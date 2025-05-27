import type { FastifyPluginAsync } from "fastify";
import fp from "fastify-plugin";
import { PrismaClient } from "@prisma/client";

// Declare fastify type extensions
declare module "fastify" {
    interface FastifyInstance {
        prisma: PrismaClient;
    }
}

const prismaPlugin: FastifyPluginAsync = async (fastify): Promise<void> => {
    try {
        // Create a Prisma client
        const prisma = new PrismaClient();

        // Connect to the database
        await prisma.$connect();

        // Make Prisma available through the fastify instance
        fastify.decorate("prisma", prisma);

        fastify.addHook("onClose", async (instance): Promise<void> => {
            await instance.prisma.$disconnect();
        });
    } catch (err) {
        fastify.log.error("Failed to initialize Prisma:", err);
        throw err;
    }
};

export default fp(prismaPlugin, { name: "prisma" });
