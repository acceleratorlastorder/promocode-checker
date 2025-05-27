import { API_CONSTANTS, WEATHER_CONSTANTS } from "../../constants.js";
import type { OpenWeatherMapResponse, WeatherData } from "../../types/weather.js";
import { ExternalServiceError } from "../../utils/errors.js";

function buildUrl(city: string, apiKey: string): string {
    const base = process.env.OPENWEATHERMAP_API_URL ?? API_CONSTANTS.OPENWEATHERMAP_BASE_URL;
    return `${base}/weather?q=${encodeURIComponent(city)}&appid=${apiKey}`;
}

export async function fetchWeatherFromApi(city: string, apiKey: string): Promise<WeatherData> {
    const url = buildUrl(city, apiKey);
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
        try {
            const res = await fetch(url, { signal: AbortSignal.timeout(10_000) });
            if (!res.ok) throw new ExternalServiceError("Weather", `HTTP ${res.status}`);
            const json = (await res.json()) as OpenWeatherMapResponse;
            // parse
            const main = json.weather[0]?.main ?? "Clear";
            const condition =
                WEATHER_CONSTANTS.CONDITION_MAP[
                    main as keyof typeof WEATHER_CONSTANTS.CONDITION_MAP
                ] ?? WEATHER_CONSTANTS.DEFAULT_CONDITION;
            const tempC = Math.round(json.main.temp - WEATHER_CONSTANTS.KELVIN_TO_CELSIUS_OFFSET);
            return { condition, temperature: tempC };
        } catch (error: unknown) {
            lastError = error instanceof Error ? error : new Error(String(error));
            // bail on 4xx
            if (RegExp(/^HTTP 4/).exec(lastError.message)) break;
            // backoff before retry
            await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt - 1)));
        }
    }

    if (lastError) {
        throw lastError;
    }
    throw new Error("Failed to fetch weather data after retries");
}
