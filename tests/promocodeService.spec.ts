import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { PromocodeService } from "../src/services/promocodeService.js";
import type { PrismaClient } from "@prisma/client";
import type { Promocode, PromocodeValidationArgs } from "../src/types/promocode.js";

// Create a mock Prisma client
const mockPrisma = {
    promocode: {
        create: jest.fn() as jest.MockedFunction<any>,
        findFirst: jest.fn() as jest.MockedFunction<any>,
        delete: jest.fn() as jest.MockedFunction<any>,
        findMany: jest.fn() as jest.MockedFunction<any>,
    },
} as unknown as jest.Mocked<PrismaClient>;

describe("PromocodeService", () => {
    let promocodeService: PromocodeService;

    beforeEach(() => {
        jest.clearAllMocks();
        promocodeService = new PromocodeService(mockPrisma);
    });

    describe("validatePromocode", () => {
        it("should accept a promocode if all conditions are met", async () => {
            const currentYear = new Date().getFullYear();
            const mockPromocodeData: Promocode = {
                name: "TESTCODE",
                advantage: { discount: 10 },
                restrictions: [
                    { age: { gte: 18 } },
                    { date: { after: `${currentYear - 1}-01-01` } },
                ],
                convertedRule: {
                    conditions: { all: [] },
                    event: { type: "promocode_accepted", params: { advantage: { discount: 10 } } },
                    name: "TESTCODE",
                },
            };
            (mockPrisma.promocode.findFirst as any).mockResolvedValue(mockPromocodeData);

            const args: PromocodeValidationArgs = { age: 20 };
            const result = await promocodeService.validatePromocode("TESTCODE", args);

            expect(result.status).toBe("accepted");
            expect(result.advantage).toEqual({ discount: 10 });
            expect(mockPrisma.promocode.findFirst).toHaveBeenCalledWith({
                where: {
                    name: {
                        equals: "TESTCODE",
                        mode: "insensitive",
                    },
                },
            });
        });

        it("should deny a promocode if a condition is not met and provide reasons", async () => {
            const mockPromocodeData: Promocode = {
                name: "AGECHECK",
                advantage: { discount: 5 },
                restrictions: [{ age: { eq: 25 } }],
                convertedRule: {},
            };
            (mockPrisma.promocode.findFirst as any).mockResolvedValue(mockPromocodeData);

            const args: PromocodeValidationArgs = { age: 30 }; // Age does not match
            const result = await promocodeService.validatePromocode("AGECHECK", args);

            expect(result.status).toBe("denied");
            expect(result.reasons).toBeDefined();
            expect(result.reasons).toContain(
                "Condition for 'age' was not met: expected 30 to be equal 25",
            );
        });

        it("should throw NotFoundError if promocode not found", async () => {
            (mockPrisma.promocode.findFirst as any).mockResolvedValue(null);
            const args: PromocodeValidationArgs = { age: 20 };

            await expect(promocodeService.validatePromocode("NONEXISTENT", args)).rejects.toThrow(
                "Promocode not found",
            );
        });



        // Test for OR condition
        it("should accept if one of OR conditions is met", async () => {
            const mockPromocodeData: Promocode = {
                name: "OR_CODE",
                advantage: { percent: 10 },
                restrictions: [{ or: [{ age: { eq: 20 } }, { age: { eq: 30 } }] }],
                convertedRule: {},
            };
            (mockPrisma.promocode.findFirst as any).mockResolvedValue(mockPromocodeData);
            const result = await promocodeService.validatePromocode("OR_CODE", {
                age: 30,
            });
            expect(result.status).toBe("accepted");
        });

        // Test for AND condition
        it("should deny if one of AND conditions is not met", async () => {
            const currentYear = new Date().getFullYear();
            const beforeDate = `${currentYear - 2}-01-01`; // 2 years ago to ensure it fails
            const mockPromocodeData: Promocode = {
                name: "AND_CODE_FAIL",
                advantage: { fixed: 5 },
                restrictions: [{ and: [{ age: { gt: 18 } }, { date: { before: beforeDate } }] }],
                convertedRule: {},
            };
            (mockPrisma.promocode.findFirst as any).mockResolvedValue(mockPromocodeData);
            const result = await promocodeService.validatePromocode("AND_CODE_FAIL", {
                age: 20,
            }); // Date is current, so before the past date will fail
            expect(result.status).toBe("denied");
            expect(result.reasons).toContain(
                "Condition for 'currentDate' was not met: expected \"" +
                    new Date().toISOString().split("T")[0] +
                    `" to be lessThanInclusive "${beforeDate}"`,
            );
        });
    });

    describe("createPromocode", () => {
        it("should create a promocode successfully", async () => {
            const mockPromocode = {
                id: "1",
                name: "TEST20",
                advantage: { percent: 20 },
                restrictions: [],
                convertedRule: {
                    conditions: { all: [] },
                    event: { type: "promocode_accepted", params: { advantage: { percent: 20 } } },
                    name: "TEST20",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.promocode.findFirst.mockResolvedValue(null);
            mockPrisma.promocode.create.mockResolvedValue(mockPromocode);

            const result = await promocodeService.createPromocode({
                name: "TEST20",
                advantage: { percent: 20 },
                restrictions: [],
            });

            expect(result).toEqual(mockPromocode);
            expect(mockPrisma.promocode.create).toHaveBeenCalledWith({
                data: {
                    name: "TEST20",
                    advantage: { percent: 20 },
                    restrictions: [],
                    convertedRule: expect.any(Object),
                },
            });
        });

        it("should throw ConflictError when promocode with same name exists", async () => {
            const existingPromocode = {
                id: "1",
                name: "EXISTING",
                advantage: { percent: 10 },
                restrictions: [],
                convertedRule: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.promocode.findFirst.mockResolvedValue(existingPromocode);

            await expect(
                promocodeService.createPromocode({
                    name: "EXISTING",
                    advantage: { percent: 20 },
                    restrictions: [],
                }),
            ).rejects.toThrow("Promocode with name 'EXISTING' already exists");
        });

        it("should handle case-insensitive duplicate names", async () => {
            const existingPromocode = {
                id: "1",
                name: "test20",
                advantage: { percent: 10 },
                restrictions: [],
                convertedRule: {},
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.promocode.findFirst.mockResolvedValue(existingPromocode);

            await expect(
                promocodeService.createPromocode({
                    name: "TEST20", // Different case
                    advantage: { percent: 20 },
                    restrictions: [],
                }),
            ).rejects.toThrow("Promocode with name 'TEST20' already exists");
        });

        it("should store converted rules when creating promocode", async () => {
            const inputData = {
                name: "COMPLEX_RULE",
                advantage: { percent: 15 },
                restrictions: [
                    { age: { gte: 18 } },
                    { or: [{ age: { eq: 25 } }, { age: { eq: 30 } }] },
                ],
            };

            const mockPromocode = {
                id: "1",
                name: inputData.name,
                advantage: inputData.advantage,
                restrictions: inputData.restrictions,
                convertedRule: {
                    conditions: { all: [] },
                    event: { type: "promocode_accepted", params: { advantage: { percent: 15 } } },
                    name: "COMPLEX_RULE",
                },
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            mockPrisma.promocode.findFirst.mockResolvedValue(null);
            mockPrisma.promocode.create.mockResolvedValue(mockPromocode);

            await promocodeService.createPromocode(inputData);

            // Verify that the convertedRule was included in the create call
            expect(mockPrisma.promocode.create).toHaveBeenCalledWith({
                data: {
                    name: "COMPLEX_RULE",
                    advantage: { percent: 15 },
                    restrictions: inputData.restrictions,
                    convertedRule: expect.objectContaining({
                        conditions: expect.any(Object),
                        event: expect.any(Object),
                        name: "COMPLEX_RULE",
                    }),
                },
            });
        });

        it("should use stored convertedRule for validation when available", async () => {
            const storedConvertedRule = {
                conditions: {
                    all: [{ fact: "age", operator: "greaterThanInclusive", value: 18 }],
                },
                event: {
                    type: "promocode_accepted",
                    params: { advantage: { percent: 25 } },
                },
                name: "STORED_RULE",
            };

            const mockPromocodeData: Promocode = {
                name: "STORED_RULE",
                advantage: { percent: 25 },
                restrictions: [{ age: { gte: 18 } }],
                convertedRule: storedConvertedRule,
            };

            (mockPrisma.promocode.findFirst as any).mockResolvedValue(mockPromocodeData);

            const result = await promocodeService.validatePromocode("STORED_RULE", { age: 25 });

            expect(result.status).toBe("accepted");
            expect(result.advantage).toEqual({ percent: 25 });
        });
    });
});
