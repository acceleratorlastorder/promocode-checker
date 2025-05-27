/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: "ts-jest/presets/default-esm",
    extensionsToTreatAsEsm: [".ts"],
    testEnvironment: "node",
    moduleNameMapper: {
        // Handle .js imports from TypeScript files
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    // Setup files to run before tests
    setupFilesAfterEnv: ["<rootDir>/tests/setup/jest.setup.ts"],
    // Automatically clear mock calls, instances, contexts and results before every test
    clearMocks: true,
    // The directory where Jest should output its coverage files
    coverageDirectory: "coverage",
    // Indicates which provider should be used to instrument code for coverage
    coverageProvider: "v8", // or "babel"
    // A list of paths to directories that Jest should use to search for files in
    roots: ["<rootDir>/tests"],
    // The testMatch patterns Jest uses to detect test files
    testMatch: ["**/__tests__/**/*.+(ts|tsx|js)", "**/?(*.)+(spec|test).+(ts|tsx|js)"],
    // A map from regular expressions to paths to transformers
    transform: {
        "^.+\\.(ts|tsx)$": ["ts-jest", { useESM: true }],
    },
};
