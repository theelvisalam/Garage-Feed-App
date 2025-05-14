const path = require("path");

module.exports = function overrideBabelConfig(config, { filename }) {
  if (
    filename.includes("node_modules/expo-router") ||
    filename.includes("node_modules/@expo/metro-runtime") ||
    filename.includes("node_modules/expo")
  ) {
    config.presets.push(require.resolve("@babel/preset-react"));
    config.plugins.push(require.resolve("@babel/plugin-syntax-jsx"));
  }
  return config;
};
