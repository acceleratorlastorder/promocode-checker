import Ajv, { type JSONSchemaType } from "ajv";
import addFormats from "ajv-formats";

// Create AJV instance with formats
const ajv = new (Ajv as any)({ allErrors: true }); // eslint-disable-line @typescript-eslint/no-explicit-any
(addFormats as any)(ajv); // eslint-disable-line @typescript-eslint/no-explicit-any

// Schema for promocode creation
export const promocodeCreationSchema: JSONSchemaType<{
    name: string;
    advantage: Record<string, unknown>;
    restrictions: Record<string, unknown>[];
}> = {
    type: "object",
    properties: {
        name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
            pattern: "^[a-zA-Z0-9_-]+$",
        },
        advantage: {
            type: "object",
            properties: {},
            additionalProperties: true,
        },
        restrictions: {
            type: "array",
            items: {
                type: "object",
                properties: {},
                additionalProperties: true,
            },
        },
    },
    required: ["name", "advantage", "restrictions"],
    additionalProperties: false,
};

// Schema for promocode validation
export const promocodeValidationSchema: JSONSchemaType<{
    promocode_name: string;
    arguments: Record<string, unknown>;
}> = {
    type: "object",
    properties: {
        promocode_name: {
            type: "string",
            minLength: 1,
            maxLength: 100,
        },
        arguments: {
            type: "object",
            properties: {},
            additionalProperties: true,
        },
    },
    required: ["promocode_name", "arguments"],
    additionalProperties: false,
};

// Compile schemas for better performance
export const validatePromocodeCreation = ajv.compile(promocodeCreationSchema);
export const validatePromocodeValidation = ajv.compile(promocodeValidationSchema);
