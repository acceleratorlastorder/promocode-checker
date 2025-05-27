import * as yaml from "yaml";
import * as fs from "fs";
import * as path from "path";
import { FILE_PATHS, VALIDATION_CONSTANTS } from "../constants.js";

interface OpenAPISpec {
    components: {
        schemas: Record<string, unknown>;
    };
}

export class ValidationService {
    private readonly openApiSpec: OpenAPISpec;

    constructor() {
        // Load OpenAPI spec
        this.openApiSpec = this.loadOpenApiSpec();
    }

    private loadOpenApiSpec(): OpenAPISpec {
        // Declare openApiPath outside the try block for broader scope
        let openApiPath = "";
        try {
            openApiPath = path.join(process.cwd(), FILE_PATHS.STATIC_DIR, FILE_PATHS.OPENAPI_FILE);
            const yamlContent = fs.readFileSync(openApiPath, "utf8");
            return yaml.parse(yamlContent) as OpenAPISpec;
        } catch (error) {
            console.error("Failed to load OpenAPI spec from path:", openApiPath, "Error:", error);
            throw new Error(
                "Could not load OpenAPI specification. Please check the file path and format.",
            );
        }
    }

    /**
     * Get the OpenAPI schema for promocode creation
     */
    getPromocodeCreationSchema(): object {
        return {
            description: "Create a new promocode",
            tags: ["Promocodes"],
            body: this.resolveSchema("Promocode"),
            response: {
                201: this.resolveSchema("Promocode"),
                400: this.resolveSchema("ErrorResponse"),
                401: this.resolveSchema("ErrorResponse"),
                409: this.resolveSchema("ErrorResponse"),
                500: this.resolveSchema("ErrorResponse"),
            },
        };
    }

    /**
     * Get the OpenAPI schema for promocode validation
     */
    getPromocodeValidationSchema(): object {
        return {
            description: "Validate a promocode against user arguments",
            tags: ["Promocodes"],
            body: this.resolveSchema("ValidationRequest"),
            response: {
                200: this.resolveSchema("ValidationResponse"),
                400: this.resolveSchema("ErrorResponse"),
                500: this.resolveSchema("ErrorResponse"),
            },
        };
    }

    /**
     * Resolve schema references to avoid $ref issues with Fastify
     */
    private resolveSchema(schemaName: string): unknown {
        const schema = this.openApiSpec.components.schemas[schemaName];
        if (!schema) {
            throw new Error(`Schema ${schemaName} not found`);
        }

        // For now, return a simplified version without $ref
        // This is a basic implementation - in production you might want a more sophisticated resolver
        return this.resolveReferences(schema);
    }

    /**
     * Recursively resolve $ref references in a schema
     */
    private resolveReferences(obj: unknown, visited: Set<string> = new Set()): unknown {
        if (typeof obj !== "object" || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map((item) => this.resolveReferences(item, visited));
        }

        const objRecord = obj as Record<string, unknown>;
        if (objRecord.$ref) {
            const refPath = (objRecord.$ref as string).replace("#/components/schemas/", "");

            // Prevent circular references
            if (visited.has(refPath)) {
                // Return a simplified reference to break the cycle
                return { type: "object", description: `Reference to ${refPath}` };
            }

            const referencedSchema = this.openApiSpec.components.schemas[refPath];
            if (referencedSchema) {
                visited.add(refPath);
                const resolved = this.resolveReferences(referencedSchema, visited);
                visited.delete(refPath);
                return resolved;
            }
            return obj; // Return as-is if reference can't be resolved
        }

        const resolved: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(objRecord)) {
            resolved[key] = this.resolveReferences(value, visited);
        }
        return resolved;
    }

    /**
     * Validate that a promocode name is unique (to be used with database check)
     */
    validatePromocodeName(name: unknown): { valid: boolean; error?: string } {
        if (typeof name !== "string") {
            return { valid: false, error: VALIDATION_CONSTANTS.ERRORS.NAME_REQUIRED };
        }

        if (name.trim().length === 0) {
            return {
                valid: false,
                error: VALIDATION_CONSTANTS.ERRORS.NAME_EMPTY,
            };
        }

        if (name.length > VALIDATION_CONSTANTS.PROMOCODE_NAME.MAX_LENGTH) {
            return {
                valid: false,
                error: VALIDATION_CONSTANTS.ERRORS.NAME_TOO_LONG,
            };
        }

        // Check for valid characters (alphanumeric, hyphens, underscores)
        if (!new RegExp(VALIDATION_CONSTANTS.PROMOCODE_NAME.PATTERN).test(name)) {
            return {
                valid: false,
                error: VALIDATION_CONSTANTS.ERRORS.NAME_INVALID_CHARS,
            };
        }

        return { valid: true };
    }

    /**
     * Get the OpenAPI schema for a specific component
     */
    getSchema(schemaName: string): unknown {
        return this.openApiSpec.components.schemas[schemaName];
    }

    /**
     * Get all available schema names
     */
    getAvailableSchemas(): string[] {
        return Object.keys(this.openApiSpec.components.schemas);
    }
}

// Export a singleton instance
export const validationService = new ValidationService();
