import js from "@eslint/js";
import typescript from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier"; // only turn off rules that conflict with prettier doesn't enforce them
import prettierOptions from "./.prettierrc.js"; // prettier config allows us to quick fix with --fix on top of prettier
import sonarjs from "eslint-plugin-sonarjs";
import globals from "globals";

export default [
    // Base JavaScript recommended rules
    js.configs.recommended,

    // TypeScript configuration
    {
        files: ["**/*.ts", "**/*.tsx"],
        languageOptions: {
            parser: typescriptParser,
            ecmaVersion: 2024,
            sourceType: "module",
            parserOptions: {
                project: "./tsconfig.json",
                tsconfigRootDir: process.cwd(),
            },
            globals: {
                ...globals.node,
                ...globals.es2024,
                fetch: "readonly",
                File: "readonly",
                Blob: "readonly",
                FormData: "readonly",
                console: "readonly",
                process: "readonly",
                Buffer: "readonly",
                __dirname: "readonly",
                __filename: "readonly",
                global: "readonly",
                module: "readonly",
                require: "readonly",
                exports: "readonly",
            },
        },
        plugins: {
            "@typescript-eslint": typescript,
            prettier,
            sonarjs,
        },
        rules: {
            ...typescript.configs.recommended.rules,
            "@typescript-eslint/no-explicit-any": "warn",
            "@typescript-eslint/consistent-type-imports": "error",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    argsIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                },
            ],
            "@typescript-eslint/no-require-imports": "error",

            // TypeScript Strict Enhancements
            "@typescript-eslint/explicit-function-return-type": [
                "error",
                {
                    allowExpressions: true,
                    allowTypedFunctionExpressions: true,
                    allowHigherOrderFunctions: true,
                },
            ],
            "@typescript-eslint/no-floating-promises": "error",
            "@typescript-eslint/require-await": "error",
            "@typescript-eslint/explicit-module-boundary-types": "error",
            "@typescript-eslint/no-non-null-assertion": "warn",
            "@typescript-eslint/no-unnecessary-type-assertion": "error",
            "@typescript-eslint/no-inferrable-types": "warn",
            "@typescript-eslint/no-empty-object-type": "error",
            "@typescript-eslint/no-unsafe-function-type": "error",
            "@typescript-eslint/no-wrapper-object-types": "error",
            "@typescript-eslint/prefer-readonly": "error",
            "@typescript-eslint/prefer-nullish-coalescing": [
                "error",
                {
                    ignoreConditionalTests: false,
                    ignoreTernaryTests: false,
                    ignoreMixedLogicalExpressions: false,
                },
            ],

            // Prettier enforcement
            "prettier/prettier": ["error", prettierOptions],

            "sonarjs/no-all-duplicated-branches": "warn",
            "sonarjs/no-duplicate-string": "warn",

            // General Code Style
            "no-console": ["warn", { allow: ["warn", "error"] }], // for dev only, remove in productiona
            "no-debugger": "error",
            "no-alert": "error",
            "no-undef": "off",
            "no-unused-expressions": "error",
            "prefer-const": "error",
            "no-var": "error",
            "no-useless-return": "error",
            "no-else-return": "error",
            "object-shorthand": ["error", "always"],
            "prefer-template": "error",
            "arrow-body-style": ["error", "as-needed"],
            "prefer-destructuring": [
                "error",
                {
                    object: true,
                    array: false,
                },
            ],
            "no-multi-assign": "error",
            "no-nested-ternary": "error",
        },
    },

    // Prettier config override
    prettierConfig,

    // Ignore patterns
    {
        ignores: [
            "dist/**",
            "node_modules/**",
            "coverage/**",
            "prisma/migrations/**",
            "*.js",
            "*.mjs",
            "*.cjs",
        ],
    },
];
