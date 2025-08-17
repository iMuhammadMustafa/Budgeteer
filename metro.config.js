const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("wasm");

// Add COEP and COOP headers to support SharedArrayBuffer
config.server.enhanceMiddleware = middleware => {
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    middleware(req, res, next);
  };
};
config.resolver.sourceExts.push("sql"); // <--- add this

// Workaround for ESM babel/runtime resolving issue with expo-drizzle-studio-plugin
// config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css", configPath: "./tailwind.config.js" });
