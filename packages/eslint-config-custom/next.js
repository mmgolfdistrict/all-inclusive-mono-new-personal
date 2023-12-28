/** @type {import('eslint').Linter.Config} */
const config = {
  extends: ["plugin:@next/next/recommended"],
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "@typescript-eslint/ban-ts-comment": "off",
    "@typescript-eslint/prefer-nullish-coalescing": "off",
  },
};

module.exports = config;
