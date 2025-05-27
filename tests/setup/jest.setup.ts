import { jest } from "@jest/globals";
import { MockPrismaClient, resetMockData } from "./mockPrisma.js";

// Mock the @prisma/client module
jest.mock("@prisma/client", () => ({
    PrismaClient: MockPrismaClient,
}));

// Reset mock data before each test
beforeEach(() => {
    resetMockData();
    jest.clearAllMocks();
});

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.USE_MOCK_WEATHER = "true";
process.env.API_KEY = "test-admin-api-key-1234567890";
process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "mock://test-database";
