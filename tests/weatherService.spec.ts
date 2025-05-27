/**
 * @jest-environment node
 */
import { describe, it, expect, beforeEach, afterEach, jest } from "@jest/globals";
import { ExternalServiceError } from "../src/utils/errors.js";

// Mock the fetch API to prevent any real API calls during tests
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// Import weather service (no file system mocking - use real static files)
import { getWeather, clearWeatherCache } from "../src/services/weather/weatherService.js";

describe("WeatherService", () => {
    const originalEnv = process.env;

    beforeEach(async () => {
        // Reset environment variables and ensure we use static files only
        process.env = { ...originalEnv };
        process.env.NODE_ENV = "test";
        process.env.USE_MOCK_WEATHER = "true";
        delete process.env.OPENWEATHERMAP_API_KEY; // Ensure no API key
        clearWeatherCache();
        jest.clearAllMocks();
        // Small delay to ensure cleanup is complete
        await new Promise((resolve) => setTimeout(resolve, 10));
    });

    afterEach(() => {
        process.env = originalEnv;
        clearWeatherCache();
    });

    describe("Static File Weather Data (Test Mode)", () => {
        it("should fetch weather from Paris static file", async () => {
            // Paris static file contains: Rain, temp: 283.15K
            const result = await getWeather("Paris");

            expect(result).toEqual({
                condition: "rain", // Rain -> rain
                temperature: 10, // 283.15 - 273.15 = 10
            });
        });

        it("should fetch weather from London static file", async () => {
            // London static file contains: Clouds, temp: 286.15K
            const result = await getWeather("London");

            expect(result).toEqual({
                condition: "cloudy", // Clouds -> cloudy
                temperature: 13, // 286.15 - 273.15 = 13
            });
        });

        it("should fetch weather from Berlin static file", async () => {
            const result = await getWeather("Berlin");

            // Verify we get valid weather data (specific values depend on static file content)
            expect(result).toHaveProperty("condition");
            expect(result).toHaveProperty("temperature");
            expect(typeof result.condition).toBe("string");
            expect(typeof result.temperature).toBe("number");
        });

        it("should handle missing static files gracefully", async () => {
            // Test the error without Jest's rejects.toThrow matcher
            try {
                await getWeather("NonExistentCity");
                fail("Expected error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(ExternalServiceError);
                // The error message should contain information about the file not being found
                expect((error as Error).message).toContain("NonExistentCity");
                // Should contain mock file missing message (new format)
                expect((error as Error).message).toContain("Mock file missing");
            }
        });

        it("should handle case-insensitive city names", async () => {
            // Test case-insensitive access to Paris data
            const resultLower = await getWeather("paris");
            const resultUpper = await getWeather("PARIS");
            const resultMixed = await getWeather("Paris");

            expect(resultLower).toEqual(resultUpper);
            expect(resultLower).toEqual(resultMixed);

            // All should be the same as Paris static file data
            expect(resultLower).toEqual({
                condition: "rain",
                temperature: 10,
            });
        });

        it("should never call the real API in test mode", async () => {
            await getWeather("Paris");
            await getWeather("London");

            // Verify fetch was never called (no real API calls)
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });

    describe("Caching", () => {
        it("should cache weather data and return cached result", async () => {
            // First call
            const result1 = await getWeather("Paris");
            // Second call should use cache
            const result2 = await getWeather("Paris");

            expect(result1).toEqual(result2);
            // Verify no API calls were made
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should cache data for different cities separately", async () => {
            const parisResult = await getWeather("Paris");
            const londonResult = await getWeather("London");

            expect(parisResult.condition).toBe("rain");
            expect(londonResult.condition).toBe("cloudy");
            expect(parisResult).not.toEqual(londonResult);
        });

        it("should clear cache properly", () => {
            // This is mainly to test the clearWeatherCache function exists and works
            expect(() => clearWeatherCache()).not.toThrow();
        });
    });

    describe("Error Handling", () => {
        it("should throw ExternalServiceError for invalid cities", async () => {
            try {
                await getWeather("InvalidCity123");
                fail("Expected error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(ExternalServiceError);
            }
        });

        it("should include city name in error message", async () => {
            try {
                await getWeather("InvalidCity123");
                fail("Expected error to be thrown");
            } catch (error) {
                expect(error).toBeInstanceOf(ExternalServiceError);
                expect((error as Error).message).toContain("InvalidCity123");
                expect((error as Error).message).toContain("Mock file missing");
            }
        });
    });

    describe("Weather Condition Mapping", () => {
        it("should correctly map Rain to rain", async () => {
            // Explicitly ensure test environment with full isolation
            process.env.NODE_ENV = "test";
            process.env.USE_MOCK_WEATHER = "true";
            delete process.env.OPENWEATHERMAP_API_KEY;
            clearWeatherCache();

            // Small delay to ensure environment changes take effect
            await new Promise((resolve) => setTimeout(resolve, 10));

            const result = await getWeather("Paris"); // Paris has Rain in static file
            expect(result.condition).toBe("rain");
        });

        it("should correctly map Clouds to cloudy", async () => {
            const result = await getWeather("London"); // London has Clouds in static file
            expect(result.condition).toBe("cloudy");
        });
    });

    describe("Temperature Conversion", () => {
        it("should convert Kelvin to Celsius correctly", async () => {
            const result = await getWeather("Paris");

            // Paris static file has 283.15K which should convert to 10°C
            expect(result.temperature).toBe(10);
        });

        it("should return integer temperatures", async () => {
            const result = await getWeather("London");

            expect(Number.isInteger(result.temperature)).toBe(true);
        });
    });

    describe("Production API Prevention", () => {
        it("should never call real API even when NODE_ENV is production but USE_MOCK_WEATHER is true", async () => {
            process.env.NODE_ENV = "production";
            process.env.USE_MOCK_WEATHER = "true";
            process.env.OPENWEATHERMAP_API_KEY = "test-key";

            // Small delay to ensure environment is set
            await new Promise((resolve) => setTimeout(resolve, 10));

            const result = await getWeather("Paris");

            expect(result).toEqual({
                condition: "rain",
                temperature: 10,
            });

            // Verify no real API calls were made
            expect(mockFetch).not.toHaveBeenCalled();
        });

        it("should throw error if trying to use real API without proper setup", async () => {
            process.env.NODE_ENV = "production";
            process.env.USE_MOCK_WEATHER = "false";
            delete process.env.OPENWEATHERMAP_API_KEY;

            // Small delay to ensure environment is set
            await new Promise((resolve) => setTimeout(resolve, 10));

            let errorThrown = false;
            try {
                await getWeather("Paris");
            } catch (error) {
                errorThrown = true;
                expect(error).toBeInstanceOf(ExternalServiceError);
                expect((error as Error).message).toContain(
                    "OPENWEATHERMAP_API_KEY environment variable is required",
                );
            }

            expect(errorThrown).toBe(true);

            // Verify no API calls were attempted
            expect(mockFetch).not.toHaveBeenCalled();
        });
    });
});
