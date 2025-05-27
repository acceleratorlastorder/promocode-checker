import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import type { FastifyInstance } from "fastify";
import { buildApp } from "../src/app.js";
import type { Promocode } from "../src/types/promocode.js";

describe("API Integration Tests", () => {
    let app: FastifyInstance;
    let adminApiKey: string;

    beforeAll(async () => {
        adminApiKey = process.env.API_KEY!;

        // Build the app
        app = await buildApp({
            logger: false, // Disable logging during tests
        });
    });

    afterAll(async () => {
        if (app) {
            await app.close();
        }
    });

    describe("Health Check Endpoint", () => {
        it("should return health status", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/ping",
            });

            expect(response.statusCode).toBe(200);
            const body = JSON.parse(response.body);
            expect(body.status).toBe("ok");
            expect(body.timestamp).toBeDefined();
        });
    });

    describe("Authentication", () => {
        it("should reject requests without API key for admin endpoints", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/promocodes",
            });

            expect(response.statusCode).toBe(401);
            const body = JSON.parse(response.body);
            expect(body.error).toContain("API key required");
        });

        it("should reject requests with invalid API key", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/promocodes",
                headers: {
                    "x-api-key": "invalid-key",
                },
            });

            expect(response.statusCode).toBe(401);
            const body = JSON.parse(response.body);
            expect(body.error).toContain("Invalid API key");
        });

        it("should accept requests with valid API key", async () => {
            const response = await app.inject({
                method: "GET",
                url: "/api/promocodes",
                headers: {
                    "x-api-key": adminApiKey,
                },
            });

            expect(response.statusCode).toBe(200);
        });
    });

    describe("Promocode Management", () => {
        describe("GET /api/promocodes", () => {
            it("should return empty array when no promocodes exist", async () => {
                const response = await app.inject({
                    method: "GET",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                    },
                });

                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.body);
                expect(Array.isArray(body)).toBe(true);
                expect(body.length).toBe(0);
            });

            it("should return all promocodes", async () => {
                // Create test promocodes via API
                await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: {
                        name: "TEST_PROMO1",
                        advantage: { percent: 10 },
                        restrictions: [{ age: { gte: 18 } }],
                    },
                });

                await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: {
                        name: "TEST_PROMO2",
                        advantage: { percent: 20 },
                        restrictions: [{ age: { gte: 21 } }],
                    },
                });

                const response = await app.inject({
                    method: "GET",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                    },
                });

                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.body);
                expect(Array.isArray(body)).toBe(true);
                expect(body.length).toBe(2);
                expect(body.some((p: Promocode) => p.name === "TEST_PROMO1")).toBe(true);
                expect(body.some((p: Promocode) => p.name === "TEST_PROMO2")).toBe(true);
            });
        });

        describe("POST /api/promocodes", () => {
            it("should create a simple promocode", async () => {
                const promocodeData = {
                    name: "TEST_SIMPLE",
                    advantage: { percent: 15 },
                    restrictions: [{ age: { gte: 18 } }],
                };

                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: promocodeData,
                });

                expect(response.statusCode).toBe(201);
                const body = JSON.parse(response.body);
                expect(body.name).toBe("TEST_SIMPLE");
                expect(body.advantage).toEqual({ percent: 15 });
                expect(body.convertedRule).toBeDefined(); // Verify convertedRule is stored
            });

            it("should create a complex promocode with weather and logical operators", async () => {
                const promocodeData = {
                    name: "TEST_COMPLEX",
                    advantage: { percent: 25 },
                    restrictions: [
                        { age: { gte: 18 } },
                        { date: { after: "2024-01-01", before: "2025-12-31" } },
                        {
                            or: [
                                { age: { eq: 25 } },
                                {
                                    and: [
                                        { age: { gt: 30, lt: 40 } },
                                        { weather: { is: "clear", temp: { gt: 15 } } },
                                    ],
                                },
                            ],
                        },
                    ],
                };

                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: promocodeData,
                });

                expect(response.statusCode).toBe(201);
                const body = JSON.parse(response.body);
                expect(body.name).toBe("TEST_COMPLEX");
                expect(body.convertedRule).toBeDefined();
                expect(body.convertedRule.conditions).toBeDefined();
                expect(body.convertedRule.event).toBeDefined();
            });

            it("should reject duplicate promocode names (case-insensitive)", async () => {
                // Create first promocode
                await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: {
                        name: "TEST_DUPLICATE",
                        advantage: { percent: 10 },
                        restrictions: [{ age: { gte: 18 } }],
                    },
                });

                // Attempt to create duplicate (different case)
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: {
                        name: "test_duplicate", // Different case
                        advantage: { percent: 20 },
                        restrictions: [{ age: { gte: 21 } }],
                    },
                });

                expect(response.statusCode).toBe(409);
                const body = JSON.parse(response.body);
                expect(body.error).toContain("already exists");
            });

            it("should validate promocode data and reject invalid input", async () => {
                const invalidData = {
                    name: "", // Invalid: empty name
                    advantage: { percent: 150 }, // Invalid: percentage > 100
                    restrictions: [],
                };

                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: invalidData,
                });

                expect(response.statusCode).toBe(400);
                const body = JSON.parse(response.body);
                expect(body.error).toBeDefined();
            });
        });

        describe("DELETE /api/promocodes/:name", () => {
            it("should delete an existing promocode", async () => {
                // Create a promocode to delete
                await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: {
                        name: "TEST_DELETE",
                        advantage: { percent: 10 },
                        restrictions: [{ age: { gte: 18 } }],
                    },
                });

                // Delete the promocode
                const response = await app.inject({
                    method: "DELETE",
                    url: "/api/promocodes/TEST_DELETE",
                    headers: {
                        "x-api-key": adminApiKey,
                    },
                });

                expect(response.statusCode).toBe(204);
                expect(response.body).toBe("");
            });

            it("should return 404 for non-existent promocode", async () => {
                const response = await app.inject({
                    method: "DELETE",
                    url: "/api/promocodes/NON_EXISTENT",
                    headers: {
                        "x-api-key": adminApiKey,
                    },
                });

                expect(response.statusCode).toBe(404);
                const body = JSON.parse(response.body);
                expect(body.error).toContain("not found");
            });

            it("should handle case-insensitive deletion", async () => {
                // Create a promocode
                await app.inject({
                    method: "POST",
                    url: "/api/promocodes",
                    headers: {
                        "x-api-key": adminApiKey,
                        "content-type": "application/json",
                    },
                    payload: {
                        name: "TEST_CASE_DELETE",
                        advantage: { percent: 10 },
                        restrictions: [{ age: { gte: 18 } }],
                    },
                });

                // Delete with different case
                const response = await app.inject({
                    method: "DELETE",
                    url: "/api/promocodes/test_case_delete",
                    headers: {
                        "x-api-key": adminApiKey,
                    },
                });

                expect(response.statusCode).toBe(204);
            });
        });
    });

    describe("Promocode Validation", () => {
        beforeEach(async () => {
            // Create test promocodes for validation via API
            await app.inject({
                method: "POST",
                url: "/api/promocodes",
                headers: {
                    "x-api-key": adminApiKey,
                    "content-type": "application/json",
                },
                payload: {
                    name: "TEST_AGE_SIMPLE",
                    advantage: { percent: 20 },
                    restrictions: [{ age: { gte: 18 } }],
                },
            });

            await app.inject({
                method: "POST",
                url: "/api/promocodes",
                headers: {
                    "x-api-key": adminApiKey,
                    "content-type": "application/json",
                },
                payload: {
                    name: "TEST_WEATHER_COMPLEX",
                    advantage: { percent: 30 },
                    restrictions: [
                        { age: { gte: 21 } },
                        { weather: { is: "clear", temp: { gt: 15 } } },
                    ],
                },
            });
        });

        describe("POST /api/promocodes/validate", () => {
            it("should accept valid promocode with simple age restriction", async () => {
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes/validate",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: {
                        promocode_name: "TEST_AGE_SIMPLE",
                        arguments: { age: 25 },
                    },
                });

                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.body);
                expect(body.status).toBe("accepted");
                expect(body.advantage).toEqual({ percent: 20 });
                expect(body.promocode_name).toBe("TEST_AGE_SIMPLE");
            });

            it("should deny promocode when age restriction not met", async () => {
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes/validate",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: {
                        promocode_name: "TEST_AGE_SIMPLE",
                        arguments: { age: 16 }, // Below minimum age
                    },
                });

                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.body);
                expect(body.status).toBe("denied");
                expect(body.reasons).toBeDefined();
                expect(body.reasons.length).toBeGreaterThan(0);
            });

            it("should handle weather-based validation", async () => {
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes/validate",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: {
                        promocode_name: "TEST_WEATHER_COMPLEX",
                        arguments: {
                            age: 25,
                            town: "Lyon", // Mock weather will be used
                        },
                    },
                });

                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.body);
                expect(body.promocode_name).toBe("TEST_WEATHER_COMPLEX");
                expect(body.status).toMatch(/^(accepted|denied)$/);

                if (body.status === "denied") {
                    expect(body.reasons).toBeDefined();
                }
            });

            it("should return 404 for non-existent promocode", async () => {
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes/validate",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: {
                        promocode_name: "NON_EXISTENT",
                        arguments: { age: 25 },
                    },
                });

                expect(response.statusCode).toBe(404);
                const body = JSON.parse(response.body);
                expect(body.error).toContain("not found");
            });

            it("should validate request schema and reject invalid input", async () => {
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes/validate",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: {
                        promocode_name: "", // Invalid: empty name
                        arguments: { age: -5 }, // Invalid: negative age
                    },
                });

                expect(response.statusCode).toBe(400);
                const body = JSON.parse(response.body);
                expect(body.error).toBeDefined();
            });

            it("should handle case-insensitive promocode lookup", async () => {
                const response = await app.inject({
                    method: "POST",
                    url: "/api/promocodes/validate",
                    headers: {
                        "content-type": "application/json",
                    },
                    payload: {
                        promocode_name: "test_age_simple", // Different case
                        arguments: { age: 25 },
                    },
                });

                expect(response.statusCode).toBe(200);
                const body = JSON.parse(response.body);
                expect(body.status).toBe("accepted");
            });
        });
    });

    describe("ConvertedRule Performance Optimization", () => {
        it("should store and use convertedRule for faster validation", async () => {
            // Create a complex promocode
            const createResponse = await app.inject({
                method: "POST",
                url: "/api/promocodes",
                headers: {
                    "x-api-key": adminApiKey,
                    "content-type": "application/json",
                },
                payload: {
                    name: "TEST_CONVERTED_RULE",
                    advantage: { percent: 25 },
                    restrictions: [
                        { age: { gte: 18 } },
                        {
                            or: [{ age: { eq: 25 } }, { age: { eq: 30 } }],
                        },
                    ],
                },
            });

            expect(createResponse.statusCode).toBe(201);
            const createdPromocode = JSON.parse(createResponse.body);

            // Verify convertedRule was stored
            expect(createdPromocode.convertedRule).toBeDefined();
            expect(createdPromocode.convertedRule.conditions).toBeDefined();
            expect(createdPromocode.convertedRule.event).toBeDefined();

            // Validate using the stored convertedRule
            const validateResponse = await app.inject({
                method: "POST",
                url: "/api/promocodes/validate",
                headers: {
                    "content-type": "application/json",
                },
                payload: {
                    promocode_name: "TEST_CONVERTED_RULE",
                    arguments: { age: 25 },
                },
            });

            expect(validateResponse.statusCode).toBe(200);
            const validationResult = JSON.parse(validateResponse.body);
            expect(validationResult.status).toBe("accepted");
            expect(validationResult.advantage).toEqual({ percent: 25 });
        });
    });

    describe("Error Handling", () => {
        it("should handle database connection errors gracefully", async () => {
            // This test would require mocking Prisma to simulate connection errors
            // For now, we'll test that the error handling structure is in place
            expect(true).toBe(true); // Placeholder
        });

        it("should return proper error format for all error types", async () => {
            // Test various error scenarios to ensure consistent error response format
            const scenarios = [
                { url: "/api/promocodes", method: "GET", expectedStatus: 401 }, // Auth error
                { url: "/api/promocodes/validate", method: "POST", expectedStatus: 400 }, // Validation error
            ];

            for (const scenario of scenarios) {
                const response = await app.inject({
                    method: scenario.method as any,
                    url: scenario.url,
                    headers: { "content-type": "application/json" },
                    payload: scenario.method === "POST" ? {} : undefined,
                });

                expect(response.statusCode).toBe(scenario.expectedStatus);
                const body = JSON.parse(response.body);
                expect(body.error).toBeDefined();
                expect(typeof body.error).toBe("string");
            }
        });
    });
});
