module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Allow custom types like ENG and PROD
    "type-enum": [
      2,
      "always",
      ["ENG", "PROD", "feat", "fix", "docs", "chore"], // Add other project types as needed
    ],
    // Ensure the type is in lowercase (ENG -> eng)
    "type-case": [2, "always", "upper-case"],

    // Allow any case for the subject (disable or adjust subject-case)
    "subject-case": [0], // Disable subject-case rule or set it to lowercase if you prefer

    // Allow the header to have custom case (ENG-xxx format)
    "header-case": [0], // Disable this rule if you want to allow uppercase types like ENG

    // Ensure the subject is not empty
    "subject-empty": [2, "never"],

    // Ensure the type is not empty
    "type-empty": [2, "never"],
  },
};
