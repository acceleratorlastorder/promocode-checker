import type { Prisma } from "@prisma/client";
import { PrismaClient } from "@prisma/client";
import type { RuleResult, RuleProperties, EngineResult } from "json-rules-engine";
import { Engine } from "json-rules-engine";
import type {
    Promocode,
    PromocodeValidationArgs,
    PromocodeValidationResult,
} from "../types/promocode.js";
import { getWeather } from "./weather/weatherService.js";
import { NotFoundError, ExternalServiceError, ConflictError } from "../utils/errors.js";
import { RuleTransformationService } from "./ruleTransformationService.js";

export class PromocodeService {
    private readonly prisma: PrismaClient;
    private readonly ruleTransformationService: RuleTransformationService;

    constructor(prismaInstance?: PrismaClient) {
        this.prisma = prismaInstance ?? new PrismaClient();
        this.ruleTransformationService = new RuleTransformationService();
    }

    async createPromocode(data: Promocode): Promise<Promocode> {
        try {
            // Normalize the name to prevent case-sensitivity issues
            const normalizedName = data.name.trim();

            // Double-check for existing promocode (case-insensitive)
            const existingPromocode = await this.prisma.promocode.findFirst({
                where: {
                    name: {
                        equals: normalizedName,
                        mode: "insensitive",
                    },
                },
            });

            if (existingPromocode) {
                throw new ConflictError(
                    `Promocode with name '${normalizedName}' already exists. Please choose a different name or delete the existing one.`,
                );
            }

            // Transform restrictions to json-rules-engine format and store
            const transformedRestrictions = this.ruleTransformationService.transformRestrictions(
                data.restrictions as Record<string, unknown>[],
            );

            const convertedRule = {
                conditions: {
                    all: transformedRestrictions,
                },
                event: {
                    type: "promocode_accepted",
                    params: {
                        advantage: data.advantage,
                    },
                },
                name: normalizedName,
            };

            return (await this.prisma.promocode.create({
                data: {
                    name: normalizedName,
                    advantage: data.advantage as Prisma.InputJsonValue,
                    restrictions: data.restrictions as Prisma.InputJsonValue,
                    convertedRule: convertedRule as Prisma.InputJsonValue,
                },
            })) as unknown as Promocode;
        } catch (error) {
            // Handle Prisma unique constraint violation
            if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
                throw new ConflictError(
                    `Promocode with name '${data.name}' already exists. Please choose a different name or delete the existing one.`,
                );
            }
            // Re-throw other errors (including our ConflictError)
            throw error;
        }
    }

    async getPromocode(name: string): Promise<Promocode | null> {
        return (await this.prisma.promocode.findFirst({
            where: {
                name: {
                    equals: name.trim(),
                    mode: "insensitive",
                },
            },
        })) as unknown as Promocode | null;
    }

    async getAllPromocodes(): Promise<Promocode[]> {
        return (await this.prisma.promocode.findMany({
            orderBy: { name: "asc" },
        })) as unknown as Promocode[];
    }

    async deletePromocode(name: string): Promise<boolean> {
        try {
            // First find the promocode with case-insensitive search
            const promocode = await this.prisma.promocode.findFirst({
                where: {
                    name: {
                        equals: name.trim(),
                        mode: "insensitive",
                    },
                },
            });

            if (!promocode) {
                return false; // Promocode not found
            }

            // Delete using the exact ID to avoid any case issues
            await this.prisma.promocode.delete({
                where: { id: promocode.id },
            });
            return true;
        } catch (error: unknown) {
            // Check if it's a Prisma "record not found" error
            if (error && typeof error === "object" && "code" in error && error.code === "P2025") {
                return false; // Record not found
            }
            // Re-throw other errors as they might be more serious
            throw error;
        }
    }

    async validatePromocode(
        name: string,
        args: PromocodeValidationArgs,
    ): Promise<PromocodeValidationResult> {
        const promocode = await this.getPromocode(name);

        if (!promocode) {
            throw new NotFoundError("Promocode");
        }

        const facts = await this.prepareFacts(args);
        const rule = this.prepareRule(promocode);

        return this.executeValidation(name, facts, rule, promocode);
    }

    private async prepareFacts(args: PromocodeValidationArgs): Promise<Record<string, unknown>> {
        const facts: Record<string, unknown> = { ...args };
        facts.currentDate = new Date().toISOString().split("T")[0];

        if (args.town) {
            facts.weather = await this.getWeatherFacts(args.town);
        } else {
            facts.weather = { is: undefined, temp: undefined };
        }

        return facts;
    }

    private async getWeatherFacts(town: string): Promise<{ is: string; temp: number }> {
        try {
            const weatherData = await getWeather(town);
            return {
                is: weatherData.condition,
                temp: weatherData.temperature,
            };
        } catch (error: unknown) {
            if (error instanceof ExternalServiceError) {
                throw error;
            }
            const errorMessage = error instanceof Error ? error.message : String(error);
            throw new ExternalServiceError(
                "Weather",
                `Failed to retrieve weather information for validation: ${errorMessage}`,
            );
        }
    }

    private prepareRule(promocode: Promocode): RuleProperties {
        const storedRuleData = promocode.convertedRule as Record<string, unknown> | undefined;

        const hasValidStoredRule =
            storedRuleData &&
            typeof storedRuleData === "object" &&
            "conditions" in storedRuleData &&
            "event" in storedRuleData;

        return hasValidStoredRule
            ? (storedRuleData as unknown as RuleProperties)
            : this.createRuleFromRestrictions(promocode);
    }

    private createRuleFromRestrictions(promocode: Promocode): RuleProperties {
        return {
            conditions: {
                all: this.ruleTransformationService.transformRestrictions(
                    promocode.restrictions as Record<string, unknown>[],
                ),
            },
            event: {
                type: "promocode_accepted",
                params: {
                    advantage: promocode.advantage,
                },
            },
            name: promocode.name,
        };
    }

    private async executeValidation(
        name: string,
        facts: Record<string, unknown>,
        rule: RuleProperties,
        promocode: Promocode,
    ): Promise<PromocodeValidationResult> {
        const engine = new Engine([], { allowUndefinedFacts: true });
        engine.addRule(rule);

        try {
            const engineResults: EngineResult = await engine.run(facts);

            if (engineResults.events.length > 0) {
                return this.createAcceptedResult(name, engineResults);
            }

            return this.createDeniedResult(name, engineResults, promocode);
        } catch (error: unknown) {
            return this.createErrorResult(name, error);
        }
    }

    private createAcceptedResult(
        name: string,
        engineResults: EngineResult,
    ): PromocodeValidationResult {
        return {
            promocode_name: name,
            status: "accepted",
            advantage: engineResults.events[0].params?.advantage as Record<string, unknown>,
        };
    }

    private createDeniedResult(
        name: string,
        engineResults: EngineResult,
        promocode: Promocode,
    ): PromocodeValidationResult {
        const findPromocode = (ruleResults: RuleResult[]): RuleResult | undefined =>
            ruleResults.find((r) => r.name === promocode.name);

        const ruleResult =
            findPromocode(engineResults.results) ?? findPromocode(engineResults.failureResults);

        let reasons: string[] = [];
        if (ruleResult && ruleResult.result === false) {
            reasons = this.ruleTransformationService.extractFailureReasonsFromConditions(
                ruleResult.conditions,
            );
        }

        return {
            promocode_name: name,
            status: "denied",
            reasons:
                reasons.length > 0
                    ? reasons
                    : ["Promocode conditions not met. No specific reasons available."],
        };
    }

    private createErrorResult(name: string, error: unknown): PromocodeValidationResult {
        const errorMessage =
            error instanceof Error && error.message
                ? error.message
                : "Internal server error during validation";

        return {
            promocode_name: name,
            status: "denied",
            reasons: [errorMessage],
        };
    }
}
