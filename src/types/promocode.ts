// Import types from auto-generated OpenAPI types
import type { components } from "./generated/api-types.js";

// Export the types with convenient aliases
export type Promocode = components["schemas"]["Promocode"];
export type PromocodeValidationArgs = components["schemas"]["ValidationRequest"]["arguments"];
export type PromocodeValidationResult = components["schemas"]["ValidationResponse"];
export type RestrictionRule = components["schemas"]["RestrictionRule"];
export type ErrorResponse = components["schemas"]["ErrorResponse"];
export type HealthResponse = components["schemas"]["HealthResponse"];

// Export the validation request type for convenience
export type ValidationRequest = components["schemas"]["ValidationRequest"];
