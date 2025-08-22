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
config.resolver.sourceExts.push("sql");

// WatermelonDB platform-specific configuration
config.resolver.platforms = ["native", "android", "ios", "web", "default"];

// Platform-specific module resolution for WatermelonDB
config.resolver.resolverMainFields = ["react-native", "browser", "main"];

// Block problematic Node.js modules from being included in the bundle
config.resolver.blockList = [
  /node_modules\/@nozbe\/watermelondb\/adapters\/sqlite\/sqlite-node/,
  /node_modules\/better-sqlite3/,
  /sqlite-node/,
];

// Resolver to redirect problematic imports
config.resolver.alias = {
  // Block the sqlite-node adapter entirely
  "@nozbe/watermelondb/adapters/sqlite/sqlite-node": false,
  "better-sqlite3": false,
};

// Workaround for ESM babel/runtime resolving issue with expo-drizzle-studio-plugin
// config.resolver.unstable_enablePackageExports = false;

module.exports = withNativeWind(config, { input: "./global.css", configPath: "./tailwind.config.js" });
