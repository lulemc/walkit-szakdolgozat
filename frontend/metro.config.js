const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "react-native-linear-gradient") {
    return context.resolveRequest(context, "expo-linear-gradient", platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
