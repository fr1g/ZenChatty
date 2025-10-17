const { mergeConfig } = require("@react-native/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { getDefaultConfig } = require("expo/metro-config");

const config = mergeConfig(getDefaultConfig(__dirname), {
    /* your config */
});

module.exports = withNativeWind(config, { input: "./v3.css" });