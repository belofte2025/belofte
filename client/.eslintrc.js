/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next", "next/core-web-vitals", "eslint:recommended"],
  rules: {
    // Disable or customize rules here
    "no-console": "warn",
    "@next/next/no-img-element": "off",
  },
};
