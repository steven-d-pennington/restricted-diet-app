module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // NativeWind v4 Babel plugin
      "nativewind/babel",
    ],
  };
};