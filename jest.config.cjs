module.exports = {
  testEnvironment: "node",
  testMatch: ["**/__tests__/**/*.test.cjs"],
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", { tsconfig: "tsconfig.json" }],
  },
  clearMocks: true,
  restoreMocks: true,
};