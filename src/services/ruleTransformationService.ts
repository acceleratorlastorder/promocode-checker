import type {
    ConditionProperties,
    TopLevelCondition,
    AllConditions,
    AnyConditions,
} from "json-rules-engine";

/**
 * Service responsible for transforming custom rule definitions into json-rules-engine format
 */
export class RuleTransformationService {
    /**
     * Transforms an array of custom restriction definitions into json-rules-engine conditions
     */
    public transformRestrictions(
        restrictions: Record<string, unknown>[],
    ): (ConditionProperties | AllConditions | AnyConditions)[] {
        return restrictions.map((restriction) => this.transformCondition(restriction));
    }

    /**
     * Transforms a single condition definition into a ConditionProperties object to be used by the engine
     */
    public transformCondition(
        definition: Record<string, unknown>,
    ): ConditionProperties | AllConditions | AnyConditions {
        if (this.isOrCondition(definition)) return this.handleOrCondition(definition);
        if (this.isAndCondition(definition)) return this.handleAndCondition(definition);
        if (this.isAgeCondition(definition)) return this.handleAgeCondition(definition);
        if (this.isDateCondition(definition)) return this.handleDateCondition(definition);
        if (this.isWeatherCondition(definition)) return this.handleWeatherCondition(definition);
        return definition as unknown as ConditionProperties;
    }

    /**
     * Extracts human-readable failure reasons from evaluated condition results
     */
    public extractFailureReasonsFromConditions(
        conditionNode: TopLevelCondition | ConditionProperties,
        pathPrefix = "",
    ): string[] {
        let reasons: string[] = [];

        // Check if it's a ConditionGroup (AllConditions or AnyConditions)
        if ("all" in conditionNode && Array.isArray(conditionNode.all)) {
            conditionNode.all.forEach((subCondition, index) => {
                reasons = reasons.concat(
                    this.extractFailureReasonsFromConditions(
                        subCondition,
                        `${pathPrefix}all[${index}].`,
                    ),
                );
            });
        } else if ("any" in conditionNode && Array.isArray(conditionNode.any)) {
            conditionNode.any.forEach((subCondition, index) => {
                reasons = reasons.concat(
                    this.extractFailureReasonsFromConditions(
                        subCondition,
                        `${pathPrefix}any[${index}].`,
                    ),
                );
            });
        } else {
            // This is a leaf condition (ConditionProperties)
            const leaf = conditionNode as ConditionProperties & {
                result?: boolean;
                factResult?: unknown;
            };

            if (leaf.result === false) {
                const fact = leaf.fact ?? "unknown_fact";
                const operator = leaf.operator ?? "unknown_operator";
                const expectedValue = leaf.value;
                const actualValue = leaf.factResult;
                const path = leaf.path ? ` (on path: ${leaf.path})` : "";

                const operatorText = this.getOperatorText(operator);
                reasons.push(
                    `Condition for '${fact}' was not met: expected ${JSON.stringify(actualValue)} to be ${operatorText} ${JSON.stringify(expectedValue)}${path}`,
                );
            }
        }

        return reasons;
    }

    // Private helper methods for condition type checking and handling

    private isOrCondition(definition: Record<string, unknown>): boolean {
        return Object.hasOwn(definition, "or") && Array.isArray(definition.or);
    }

    private handleOrCondition(definition: Record<string, unknown>): AnyConditions {
        return {
            any: this.transformRestrictions(definition.or as Record<string, unknown>[]),
        };
    }

    private isAndCondition(definition: Record<string, unknown>): boolean {
        return Object.hasOwn(definition, "and") && Array.isArray(definition.and);
    }

    private handleAndCondition(definition: Record<string, unknown>): AllConditions {
        return {
            all: this.transformRestrictions(definition.and as Record<string, unknown>[]),
        };
    }

    private isAgeCondition(definition: Record<string, unknown>): boolean {
        return (
            Object.hasOwn(definition, "age") &&
            typeof definition.age === "object" &&
            !Array.isArray(definition.age) &&
            definition.age !== null
        );
    }

    private handleAgeCondition(definition: Record<string, unknown>): ConditionProperties {
        const ageRule = definition.age as Record<string, number>;
        const operator = Object.keys(ageRule)[0];
        const value = ageRule[operator];

        const engineOperator = this.mapAgeOperator(operator);

        return {
            fact: "age",
            operator: engineOperator,
            value,
        } as ConditionProperties;
    }

    private mapAgeOperator(
        operator: string,
    ): "equal" | "lessThan" | "greaterThan" | "lessThanInclusive" | "greaterThanInclusive" {
        switch (operator) {
            case "eq":
                return "equal";
            case "lt":
                return "lessThan";
            case "gt":
                return "greaterThan";
            case "lte":
                return "lessThanInclusive";
            case "gte":
                return "greaterThanInclusive";
            default:
                throw new Error(`Unsupported age operator: ${operator}`);
        }
    }

    private isDateCondition(definition: Record<string, unknown>): boolean {
        return (
            Object.hasOwn(definition, "date") &&
            typeof definition.date === "object" &&
            !Array.isArray(definition.date) &&
            definition.date !== null
        );
    }

    private handleDateCondition(definition: Record<string, unknown>): AllConditions {
        const dateRule = definition.date as Record<string, string>;
        const conditions: ConditionProperties[] = [];

        if (dateRule.after) {
            conditions.push({
                fact: "currentDate",
                operator: "greaterThanInclusive",
                value: dateRule.after,
            } as ConditionProperties);
        }

        if (dateRule.before) {
            conditions.push({
                fact: "currentDate",
                operator: "lessThanInclusive",
                value: dateRule.before,
            } as ConditionProperties);
        }

        return { all: conditions };
    }

    private isWeatherCondition(definition: Record<string, unknown>): boolean {
        return (
            Object.hasOwn(definition, "weather") &&
            typeof definition.weather === "object" &&
            !Array.isArray(definition.weather) &&
            definition.weather !== null
        );
    }

    private handleWeatherCondition(definition: Record<string, unknown>): AllConditions {
        const weatherRule = definition.weather as Record<string, unknown>;
        const weatherConditions: ConditionProperties[] = [];

        if (weatherRule.is !== undefined) {
            weatherConditions.push({
                fact: "weather",
                operator: "equal",
                value: weatherRule.is,
                path: "$.is",
            } as ConditionProperties);
        }

        if (weatherRule.temp !== undefined) {
            const tempRule = weatherRule.temp as Record<string, number>;

            if (tempRule.gt !== undefined) {
                weatherConditions.push({
                    fact: "weather",
                    operator: "greaterThan",
                    value: tempRule.gt,
                    path: "$.temp",
                } as ConditionProperties);
            }

            if (tempRule.lt !== undefined) {
                weatherConditions.push({
                    fact: "weather",
                    operator: "lessThan",
                    value: tempRule.lt,
                    path: "$.temp",
                } as ConditionProperties);
            }
        }

        return { all: weatherConditions };
    }

    private getOperatorText(operator: string): string {
        switch (operator) {
            case "equal":
                return "equal";
            case "lessThan":
                return "lessThan";
            case "greaterThan":
                return "greaterThan";
            case "lessThanInclusive":
                return "lessThanInclusive";
            case "greaterThanInclusive":
                return "greaterThanInclusive";
            default:
                return operator;
        }
    }
}
