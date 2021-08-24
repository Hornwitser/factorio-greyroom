//import type { InitialOptionsTsJest } from "ts-jest/dist/types";
import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/test", "<rootDir>/src"],
	collectCoverage: true,
	collectCoverageFrom: ["<rootDir>/src/**/*.ts"],
	globalSetup: "./test/setup.ts",
	globalTeardown: "./test/teardown.ts",
	maxWorkers: "50%",
	verbose: true,
}
export default config;