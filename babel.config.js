module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
      // "module:metro-react-native-babel-preset",
    ],
    plugins: [
      ["@babel/plugin-transform-typescript", { isTSX: true }],
      ["@babel/plugin-proposal-decorators", { legacy: true }],
      ["@babel/plugin-transform-class-properties", { loose: true, legacy: true }],
      ["@babel/plugin-transform-runtime", { helpers: true, regenerator: true }],
    ],
  };
};
