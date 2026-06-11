import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "jest-environment-jsdom",

  // Runs setup files after Jest has been installed in the environment
  // (the correct Jest config key for importing jest-dom matchers etc.)
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],

  // Resolve @/... path aliases to src/
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    // Stub CSS imports
    "\\.(css|scss|sass)$": "<rootDir>/src/__tests__/__mocks__/fileMock.ts",
    // Mock next/dynamic for synchronous component testing
    "^next/dynamic$": "<rootDir>/src/__tests__/__mocks__/nextDynamic.ts",
  },

  transform: {
    "^.+\\.(ts|tsx)$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          diagnostics: false,
        },
      },
    ],
  },

  testMatch: ["<rootDir>/src/__tests__/**/*.test.(ts|tsx)"],
  testPathIgnorePatterns: ["/node_modules/", "/.next/"],
  // Prevent the standalone .next build from colliding with package.json haste maps
  modulePathIgnorePatterns: ["<rootDir>/.next/"],
};

export default config;
