export class PromocodeError extends Error {
    constructor(
        message: string,
        public readonly statusCode = 500,
        public readonly code = "INTERNAL_ERROR",
    ) {
        super(message);
        this.name = "PromocodeError";
        Error.captureStackTrace(this, this.constructor);
    }
}

export class ValidationError extends PromocodeError {
    constructor(message: string, field?: string) {
        super(message, 400, "VALIDATION_ERROR");
        this.name = "ValidationError";
        if (field) {
            this.message = `${field}: ${message}`;
        }
    }
}

export class UnauthorizedError extends PromocodeError {
    constructor(message = "Unauthorized") {
        super(message, 401, "UNAUTHORIZED");
        this.name = "UnauthorizedError";
    }
}

export class NotFoundError extends PromocodeError {
    constructor(resource: string) {
        super(`${resource} not found`, 404, "NOT_FOUND");
        this.name = "NotFoundError";
    }
}

export class ConflictError extends PromocodeError {
    constructor(message: string) {
        super(message, 409, "CONFLICT");
        this.name = "ConflictError";
    }
}

export class ExternalServiceError extends PromocodeError {
    constructor(service: string, message: string) {
        super(`${service} service error: ${message}`, 503, "EXTERNAL_SERVICE_ERROR");
        this.name = "ExternalServiceError";
    }
}
