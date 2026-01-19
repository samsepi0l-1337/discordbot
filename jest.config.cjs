module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.cjs", "**/__tests__/**/*.test.ts"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  restoreMocks: true,
};