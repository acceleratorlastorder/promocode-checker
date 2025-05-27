import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { PromocodeService } from "../services/promocodeService.js";
import { validationService } from "../services/validationService.js";
import type { CreatePromocodeRequest, ValidatePromocodeRequest } from "../types/api-helpers.js";
import { ConflictError, NotFoundError, ValidationError } from "../utils/errors.js";
import { HTTP_STATUS } from "../constants.js";

export default async function promocodeRoutes(fastify: FastifyInstance): Promise<void> {
    const service = new PromocodeService();

    // Admin-only endpoint: List all promocodes
    await fastify.register(async function adminRoutes(fastify: FastifyInstance) {
        await fastify.register(function (fastify: FastifyInstance) {
            fastify.get(
                "/promocodes",
                {
                    preHandler: fastify.authenticate,
                },
                async (_request, reply) => {
                    try {
                        const promocodes = await service.getAllPromocodes();
                        reply.send(promocodes);
                    } catch (error) {
                        fastify.log.error(error);
                        throw error;
                    }
                },
            );

            // Admin-only endpoint: Create a new promocode
            fastify.post(
                "/promocodes",
                {
                    schema: validationService.getPromocodeCreationSchema(),
                    preHandler: fastify.authenticate,
                },
                async (request, reply) => {
                    try {
                        const promocodeData = request.body as CreatePromocodeRequest;

                        // Normalize and validate promocode name
                        const normalizedName = promocodeData.name.trim();
                        const nameValidation =
                            validationService.validatePromocodeName(normalizedName);
                        if (!nameValidation.valid) {
                            throw new ValidationError(
                                nameValidation.error ?? "Invalid promocode name",
                                "promocode_name",
                            );
                        }

                        // Check if promocode already exists (case-insensitive)
                        const existingPromocode = await service.getPromocode(normalizedName);
                        if (existingPromocode) {
                            throw new ConflictError(
                                `Promocode '${normalizedName}' already exists. Please choose a different name or delete the existing one first.`,
                            );
                        }

                        // Create the promocode with normalized name
                        const promocodeToCreate = {
                            ...promocodeData,
                            name: normalizedName,
                        };
                        const newPromo = await service.createPromocode(promocodeToCreate);
                        reply.code(HTTP_STATUS.CREATED).send(newPromo);
                    } catch (error) {
                        fastify.log.error(error);
                        throw error;
                    }
                },
            );

            // Admin-only endpoint: Delete promocode
            fastify.delete(
                "/promocodes/:name",
                {
                    preHandler: fastify.authenticate,
                },
                async (request, reply) => {
                    try {
                        const { name } = request.params as { name: string };

                        const deleted = await service.deletePromocode(name);
                        if (deleted) {
                            reply.code(HTTP_STATUS.NO_CONTENT).send(); // No content - successfully deleted
                        } else {
                            throw new NotFoundError("Promocode");
                        }
                    } catch (error) {
                        fastify.log.error(error);
                        throw error;
                    }
                },
            );
        });
    });

    // Public endpoint: Validate a promocode
    fastify.post(
        "/promocodes/validate",
        {
            schema: validationService.getPromocodeValidationSchema(),
        },
        async (
            request: FastifyRequest<{ Body: ValidatePromocodeRequest }>,
            reply: FastifyReply,
        ) => {
            try {
                const { promocode_name, arguments: args } = request.body;
                const result = await service.validatePromocode(promocode_name, args);
                reply.send(result);
            } catch (error) {
                fastify.log.error(error);
                throw error;
            }
        },
    );
}
