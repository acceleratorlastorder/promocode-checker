import { buildApp } from "../src/app.js";
import type { FastifyInstance } from "fastify";

describe("Authentication", () => {
    let app: FastifyInstance;

    beforeAll(async () => {
        // Set test environment variables
        process.env.NODE_ENV = "test";
        process.env.API_KEY = "test-admin-api-key-1234567890"; // Meet minimum length requirement

        app = await buildApp({ logger: false });
        await app.ready();
    });

    afterAll(async () => {
        await app.close();
    });

    describe("POST /api/promocodes", () => {
        it("should return 401 when no API key is provided", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/promocodes",
                payload: {
                    name: "TEST_PROMO",
                    advantage: { percent: 10 },
                    restrictions: [{ age: { gte: 18 } }],
                },
                headers: {
                    "content-type": "application/json",
                },
            });

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: "API key required. Provide it via Authorization header (Bearer token) or X-API-Key header.",
            });
        });

        it("should return 401 when invalid API key is provided", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/promocodes",
                payload: {
                    name: "TEST_PROMO",
                    advantage: { percent: 10 },
                    restrictions: [{ age: { gte: 18 } }],
                },
                headers: {
                    "content-type": "application/json",
                    authorization: "Bearer invalid-key",
                },
            });

            expect(response.statusCode).toBe(401);
            expect(JSON.parse(response.body)).toEqual({
                error: "Invalid API key.",
            });
        });

        it("should accept valid API key via X-API-Key header", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/promocodes",
                headers: {
                    "x-api-key": "test-admin-api-key-1234567890",
                },
                payload: {
                    name: "TEST_CODE",
                    advantage: { percent: 10 },
                    restrictions: [],
                },
            });

            // Should not be 401 (might be 500 due to database issues, but that's OK for auth test)
            expect(response.statusCode).not.toBe(401);
        });

        it("should accept valid API key via Authorization Bearer header", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/promocodes",
                headers: {
                    authorization: "Bearer test-admin-api-key-1234567890",
                },
                payload: {
                    name: "TEST_CODE",
                    advantage: { percent: 10 },
                    restrictions: [],
                },
            });

            // Should not be 401 (might be 500 due to database issues, but that's OK for auth test)
            expect(response.statusCode).not.toBe(401);
        });
    });

    describe("POST /api/promocodes/validate", () => {
        it("should not require authentication", async () => {
            const response = await app.inject({
                method: "POST",
                url: "/api/promocodes/validate",
                payload: {
                    promocode_name: "TEST_CODE",
                    arguments: { age: 25 },
                },
            });

            // Should not be 401 (might be 500 due to database/promocode not found, but that's OK)
            expect(response.statusCode).not.toBe(401);
        });
    });
});
