// src/services/weather/mockClient.ts
import { readFile } from "fs/promises";
import path from "path";
import { FILE_PATHS, WEATHER_CONSTANTS } from "../../constants.js";
import type { OpenWeatherMapResponse, WeatherData } from "../../types/weather.js";
import { ExternalServiceError } from "../../utils/errors.js";

function mockPath(city: string): string {
    return path.join(
        process.cwd(),
        FILE_PATHS.STATIC_DIR,
        WEATHER_CONSTANTS.WEATHER_DIR,
        `${WEATHER_CONSTANTS.FILE_PREFIX}${city.toLowerCase()}${WEATHER_CONSTANTS.FILE_EXTENSION}`,
    );
}

export async function fetchWeatherFromMock(city: string): Promise<WeatherData> {
    const p = mockPath(city);
    let raw: string;
    try {
        raw = await readFile(p, "utf-8");
    } catch {
        throw new ExternalServiceError("Weather", `Mock file missing: ${p}`);
    }

    let json: OpenWeatherMapResponse;
    try {
        json = JSON.parse(raw);
    } catch {
        throw new ExternalServiceError("Weather", `Invalid mock JSON: ${p}`);
    }

    const main = json.weather[0]?.main ?? "Clear";
    const condition =
        WEATHER_CONSTANTS.CONDITION_MAP[main as keyof typeof WEATHER_CONSTANTS.CONDITION_MAP] ??
        WEATHER_CONSTANTS.DEFAULT_CONDITION;
    const tempC = Math.round(json.main.temp - WEATHER_CONSTANTS.KELVIN_TO_CELSIUS_OFFSET);
    return { condition, temperature: tempC };
}
