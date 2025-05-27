import { describe, it, expect, beforeEach } from "@jest/globals";
import { RuleTransformationService } from "../src/services/ruleTransformationService.js";
import type { ConditionProperties, AllConditions, AnyConditions } from "json-rules-engine";

describe("RuleTransformationService", () => {
    let service: RuleTransformationService;

    beforeEach(() => {
        service = new RuleTransformationService();
    });

    describe("transformCondition", () => {
        it("should transform age condition with eq operator", () => {
            const definition = { age: { eq: 25 } };
            const result = service.transformCondition(definition);

            expect(result).toEqual({
                fact: "age",
                operator: "equal",
                value: 25,
            });
        });

        it("should transform age condition with gt operator", () => {
            const definition = { age: { gt: 18 } };
            const result = service.transformCondition(definition);

            expect(result).toEqual({
                fact: "age",
                operator: "greaterThan",
                value: 18,
            });
        });

        it("should transform age condition with lt operator", () => {
            const definition = { age: { lt: 65 } };
            const result = service.transformCondition(definition);

            expect(result).toEqual({
                fact: "age",
                operator: "lessThan",
                value: 65,
            });
        });

        it("should transform age condition with gte operator", () => {
            const definition = { age: { gte: 21 } };
            const result = service.transformCondition(definition);

            expect(result).toEqual({
                fact: "age",
                operator: "greaterThanInclusive",
                value: 21,
            });
        });

        it("should transform age condition with lte operator", () => {
            const definition = { age: { lte: 64 } };
            const result = service.transformCondition(definition);

            expect(result).toEqual({
                fact: "age",
                operator: "lessThanInclusive",
                value: 64,
            });
        });

        it("should throw error for unsupported age operator", () => {
            const definition = { age: { invalid: 25 } };
            expect(() => service.transformCondition(definition)).toThrow(
                "Unsupported age operator: invalid",
            );
        });

        it("should transform date condition with after and before", () => {
            const definition = {
                date: {
                    after: "2023-01-01",
                    before: "2023-12-31",
                },
            };
            const result = service.transformCondition(definition) as AllConditions;

            expect(result.all).toHaveLength(2);
            expect(result.all[0]).toEqual({
                fact: "currentDate",
                operator: "greaterThanInclusive",
                value: "2023-01-01",
            });
            expect(result.all[1]).toEqual({
                fact: "currentDate",
                operator: "lessThanInclusive",
                value: "2023-12-31",
            });
        });

        it("should transform date condition with only after", () => {
            const definition = { date: { after: "2023-01-01" } };
            const result = service.transformCondition(definition) as AllConditions;

            expect(result.all).toHaveLength(1);
            expect(result.all[0]).toEqual({
                fact: "currentDate",
                operator: "greaterThanInclusive",
                value: "2023-01-01",
            });
        });

        it("should transform weather condition with is and temp", () => {
            const definition = {
                weather: {
                    is: "clear",
                    temp: { gt: 15, lt: 30 },
                },
            };
            const result = service.transformCondition(definition) as AllConditions;

            expect(result.all).toHaveLength(3);
            expect(result.all[0]).toEqual({
                fact: "weather",
                operator: "equal",
                value: "clear",
                path: "$.is",
            });
            expect(result.all[1]).toEqual({
                fact: "weather",
                operator: "greaterThan",
                value: 15,
                path: "$.temp",
            });
            expect(result.all[2]).toEqual({
                fact: "weather",
                operator: "lessThan",
                value: 30,
                path: "$.temp",
            });
        });

        it("should transform OR condition", () => {
            const definition = {
                or: [{ age: { eq: 25 } }, { age: { eq: 30 } }],
            };
            const result = service.transformCondition(definition) as AnyConditions;

            expect(result.any).toHaveLength(2);
            expect(result.any[0]).toEqual({
                fact: "age",
                operator: "equal",
                value: 25,
            });
            expect(result.any[1]).toEqual({
                fact: "age",
                operator: "equal",
                value: 30,
            });
        });

        it("should transform AND condition", () => {
            const definition = {
                and: [{ age: { gt: 18 } }, { age: { lt: 65 } }],
            };
            const result = service.transformCondition(definition) as AllConditions;

            expect(result.all).toHaveLength(2);
            expect(result.all[0]).toEqual({
                fact: "age",
                operator: "greaterThan",
                value: 18,
            });
            expect(result.all[1]).toEqual({
                fact: "age",
                operator: "lessThan",
                value: 65,
            });
        });
    });

    describe("transformRestrictions", () => {
        it("should transform multiple restrictions", () => {
            const restrictions = [{ age: { gte: 18 } }, { date: { after: "2023-01-01" } }];
            const result = service.transformRestrictions(restrictions);

            expect(result).toHaveLength(2);
            expect(result[0]).toEqual({
                fact: "age",
                operator: "greaterThanInclusive",
                value: 18,
            });
            expect((result[1] as AllConditions).all[0]).toEqual({
                fact: "currentDate",
                operator: "greaterThanInclusive",
                value: "2023-01-01",
            });
        });
    });

    describe("extractFailureReasonsFromConditions", () => {
        it("should extract failure reason from leaf condition", () => {
            const condition: ConditionProperties & { result?: boolean; factResult?: unknown } = {
                fact: "age",
                operator: "equal",
                value: 25,
                result: false,
                factResult: 30,
            };

            const reasons = service.extractFailureReasonsFromConditions(condition);

            expect(reasons).toHaveLength(1);
            expect(reasons[0]).toBe("Condition for 'age' was not met: expected 30 to be equal 25");
        });

        it("should extract failure reason with path", () => {
            const condition: ConditionProperties & { result?: boolean; factResult?: unknown } = {
                fact: "weather",
                operator: "equal",
                value: "clear",
                path: "$.is",
                result: false,
                factResult: "cloudy",
            };

            const reasons = service.extractFailureReasonsFromConditions(condition);

            expect(reasons).toHaveLength(1);
            expect(reasons[0]).toBe(
                'Condition for \'weather\' was not met: expected "cloudy" to be equal "clear" (on path: $.is)',
            );
        });

        it("should not extract reasons for successful conditions", () => {
            const condition: ConditionProperties & { result?: boolean; factResult?: unknown } = {
                fact: "age",
                operator: "equal",
                value: 25,
                result: true,
                factResult: 25,
            };

            const reasons = service.extractFailureReasonsFromConditions(condition);

            expect(reasons).toHaveLength(0);
        });
    });
});
