require("dotenv").config({ path: ".env" });
const config = {
  preset: "jest-expo",
  verbose: true,
  transform: {
    "^.+\\.jsx?$": ["babel-jest", { caller: { preserveEnvVars: true } }],
    "^.+\\.tsx?$": ["babel-jest", { caller: { preserveEnvVars: true } }],
  },
};

module.exports = config;
