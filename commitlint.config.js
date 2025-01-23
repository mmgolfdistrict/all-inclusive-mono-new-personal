module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["ENG", "PROD"], // Add other project prefixes if needed
    ],
    "header-case": [2, "always", "upper-case"], // Ensures the header is in uppercase
    "header-max-length": [2, "always", 72], // Optional, enforces max length for header
    "subject-empty": [2, "never"], // Ensures subject is not empty
    "type-empty": [2, "never"], // Ensures type is not empty
  },
};
