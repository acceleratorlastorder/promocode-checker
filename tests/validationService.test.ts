import { validationService } from "../src/services/validationService.js";

describe("ValidationService", () => {
    describe("schema access methods", () => {
        it("should return available schemas", () => {
            const schemas = validationService.getAvailableSchemas();
            expect(schemas).toContain("Promocode");
            expect(schemas).toContain("ValidationRequest");
            expect(schemas).toContain("RestrictionRule");
        });

        it("should return specific schema", () => {
            const promocodeSchema = validationService.getSchema("Promocode");
            expect(promocodeSchema).toBeDefined();
            expect(typeof promocodeSchema).toBe("object");
        });

        it("should return promocode creation schema", () => {
            const schema = validationService.getPromocodeCreationSchema() as any;
            expect(schema).toBeDefined();
            expect(schema.description).toBe("Create a new promocode");
            expect(schema.tags).toContain("Promocodes");
            expect(schema.body).toBeDefined();
            expect(schema.response).toBeDefined();
        });

        it("should return promocode validation schema", () => {
            const schema = validationService.getPromocodeValidationSchema() as any;
            expect(schema).toBeDefined();
            expect(schema.description).toBe("Validate a promocode against user arguments");
            expect(schema.tags).toContain("Promocodes");
            expect(schema.body).toBeDefined();
            expect(schema.response).toBeDefined();
        });
    });

    // Test validation logic for promocode names
    describe("Promocode Name Validation", () => {
        it("should validate a correct promocode name", () => {
            const result = validationService.validatePromocodeName("ValidName_123");
            expect(result.valid).toBe(true);
        });

        it("should invalidate an empty promocode name", () => {
            const result = validationService.validatePromocodeName("");
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Promocode name cannot be empty or whitespace");
        });

        it("should invalidate a promocode name with invalid characters", () => {
            const result = validationService.validatePromocodeName("Invalid Name!");
            expect(result.valid).toBe(false);
            expect(result.error).toBe(
                "Promocode name can only contain letters, numbers, hyphens, and underscores",
            );
        });

        it("should invalidate a promocode name that is too long", () => {
            const longName = "a".repeat(101);
            const result = validationService.validatePromocodeName(longName);
            expect(result.valid).toBe(false);
            expect(result.error).toBe("Promocode name cannot exceed 100 characters");
        });
    });
});
