import { jest } from "@jest/globals";
import type { PrismaClient } from "@prisma/client";

// In-memory storage for test data
const mockData = {
    promocodes: [] as any[],
};

// Helper function to reset mock data
export const resetMockData = () => {
    mockData.promocodes = [];
};

// Mock Prisma client
export const mockPrismaClient = {
    $connect: jest.fn().mockImplementation(() => Promise.resolve()),
    $disconnect: jest.fn().mockImplementation(() => Promise.resolve()),

    promocode: {
        findMany: jest.fn().mockImplementation((args: any = {}) => {
            const { where } = args;
            if (!where) return Promise.resolve([...mockData.promocodes]);

            // Handle case-insensitive name search
            if (where.name && typeof where.name === "object" && where.name.mode === "insensitive") {
                const result = mockData.promocodes.filter(
                    (p) => p.name.toLowerCase() === where.name.equals.toLowerCase(),
                );
                return Promise.resolve(result);
            }

            // Handle exact name match
            if (where.name && typeof where.name === "string") {
                const result = mockData.promocodes.filter((p) => p.name === where.name);
                return Promise.resolve(result);
            }

            return Promise.resolve([...mockData.promocodes]);
        }),

        findFirst: jest.fn().mockImplementation((args: any = {}) => {
            const { where } = args;
            if (!where) return Promise.resolve(mockData.promocodes[0] || null);

            // Handle case-insensitive name search
            if (where.name && typeof where.name === "object" && where.name.mode === "insensitive") {
                const result = mockData.promocodes.find(
                    (p) => p.name.toLowerCase() === where.name.equals.toLowerCase(),
                );
                return Promise.resolve(result || null);
            }

            // Handle exact name match
            if (where.name && typeof where.name === "string") {
                const result = mockData.promocodes.find((p) => p.name === where.name);
                return Promise.resolve(result || null);
            }

            return Promise.resolve(mockData.promocodes[0] || null);
        }),

        create: jest.fn().mockImplementation((args: any) => {
            const { data } = args;
            const newPromocode = {
                id: Date.now(), // Simple ID generation
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            mockData.promocodes.push(newPromocode);
            return Promise.resolve(newPromocode);
        }),

        delete: jest.fn().mockImplementation((args: any) => {
            const { where } = args;
            let deletedIndex = -1;

            // Handle deletion by ID (which the actual service uses)
            if (where.id) {
                deletedIndex = mockData.promocodes.findIndex((p) => p.id === where.id);
            }
            // Handle case-insensitive name deletion (fallback)
            else if (
                where.name &&
                typeof where.name === "object" &&
                where.name.mode === "insensitive"
            ) {
                deletedIndex = mockData.promocodes.findIndex(
                    (p) => p.name.toLowerCase() === where.name.equals.toLowerCase(),
                );
            } else if (where.name && typeof where.name === "string") {
                deletedIndex = mockData.promocodes.findIndex((p) => p.name === where.name);
            }

            if (deletedIndex === -1) {
                const error = new Error("Record to delete does not exist.");
                (error as any).code = "P2025";
                throw error;
            }

            const deletedPromocode = mockData.promocodes[deletedIndex];
            mockData.promocodes.splice(deletedIndex, 1);
            return Promise.resolve(deletedPromocode);
        }),

        deleteMany: jest.fn().mockImplementation(() => {
            const count = mockData.promocodes.length;
            mockData.promocodes = [];
            return Promise.resolve({ count });
        }),

        update: jest.fn().mockImplementation((args: any) => {
            const { where, data } = args;
            let targetIndex = -1;

            // Handle case-insensitive name update
            if (where.name && typeof where.name === "object" && where.name.mode === "insensitive") {
                targetIndex = mockData.promocodes.findIndex(
                    (p) => p.name.toLowerCase() === where.name.equals.toLowerCase(),
                );
            } else if (where.name && typeof where.name === "string") {
                targetIndex = mockData.promocodes.findIndex((p) => p.name === where.name);
            }

            if (targetIndex === -1) {
                throw new Error("Record to update not found.");
            }

            const updatedPromocode = {
                ...mockData.promocodes[targetIndex],
                ...data,
                updatedAt: new Date(),
            };
            mockData.promocodes[targetIndex] = updatedPromocode;
            return Promise.resolve(updatedPromocode);
        }),
    },
} as unknown as PrismaClient;

// Mock the PrismaClient constructor
export const MockPrismaClient = jest.fn().mockImplementation(() => mockPrismaClient);
