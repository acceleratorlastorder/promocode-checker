import type { components } from "./generated/api-types.js";

// Use the schemas directly instead of extracting from complex paths
export type CreatePromocodeRequest = components["schemas"]["Promocode"];
export type CreatePromocodeResponse = components["schemas"]["Promocode"];

export type ValidatePromocodeRequest = components["schemas"]["ValidationRequest"];
export type ValidatePromocodeResponse = components["schemas"]["ValidationResponse"];

export type HealthCheckResponse = components["schemas"]["HealthResponse"];

// Common error response type
export type ApiErrorResponse = components["schemas"]["ErrorResponse"];

// Component schemas for direct access
export type Schemas = components["schemas"];

// Additional useful schema exports
export type Promocode = components["schemas"]["Promocode"];
export type PromocodeAdvantage = components["schemas"]["PromocodeAdvantage"];
export type RestrictionRule = components["schemas"]["RestrictionRule"];

// Helper type to extract all possible error responses for an endpoint
export type ErrorResponses<T> = T extends { responses: infer R }
    ? {
          [K in keyof R]: R[K] extends { content: { "application/json": infer C } } ? C : never;
      }[Exclude<keyof R, "200" | "201">]
    : never;
