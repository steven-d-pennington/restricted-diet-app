module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      "babel-preset-expo"
    ],
    plugins: [
      // Reanimated v4 plugin (must be last)
      "react-native-worklets/plugin"
    ]
  };
};