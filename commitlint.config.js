const { isCommitValid } = require("commitlint-plugin-function-rules");

module.exports = {
  extends: ["@commitlint/config-conventional"],
  plugins: [
    "commitlint-plugin-function-rules", // Enable the plugin
  ],
  rules: {
    // Rule to allow dynamic numbers in the type section (e.g., ENG-<number>)
    "header-pattern": [
      2,
      "always",
      (commit) => isCommitValid(commit, /^[A-Z]+-\d+: .+/), // Regex for ENG-<number>: <message>
    ],

    // Ensure that the type is not empty (before the colon)
    "type-empty": [2, "never"],

    // Ensure the subject is not empty (message after the colon)
    "subject-empty": [2, "never"],

    // Allow uppercase types like ENG, PROD, etc.
    "type-enum": [2, "always", ["ENG", "PROD", "feat", "fix", "docs", "chore"]],

    // Allow uppercase types (disable case restrictions)
    "type-case": [0],

    // Allow any case for the subject (e.g., sentence or any case)
    "subject-case": [0],

    // Enforce max header length (you can adjust this to your needs)
    "header-max-length": [2, "always", 100],
  },
};
