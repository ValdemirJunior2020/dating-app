// functions/.eslintrc.js
module.exports = {
  root: true,
  env: { es6: true, node: true },
  parserOptions: { ecmaVersion: 2020 },
  extends: ["eslint:recommended"],
  rules: {
    "linebreak-style": "off",          // allow CRLF on Windows
    "max-len": ["warn", { code: 140, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
    "require-jsdoc": "off",
    "object-curly-spacing": "off",
    "comma-dangle": "off",
    "indent": "off",
    "no-empty": "off"
  }
};
