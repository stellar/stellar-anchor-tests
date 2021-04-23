module.exports = {
  extends: ["@stellar/eslint-config"],
  rules: {
    "no-console": 0,
    "import/no-unresolved": "off",
    // note you must disable the base rule as it can report incorrect errors
    "no-shadow": "off",
    "@typescript-eslint/no-shadow": ["error"],
    // note you must disable the base rule as it can report incorrect errors
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["error"],
  },
};
