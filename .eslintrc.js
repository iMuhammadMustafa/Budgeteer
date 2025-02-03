import pluginQuery from '@tanstack/eslint-plugin-query'

module.exports = {
  ...pluginQuery.configs['flat/recommended'],
  extends: ["expo", "prettier"],
  plugins: ["prettier"],
  rules: {
    "prettier/prettier": "error",
  },
};
