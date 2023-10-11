import resolve from "@rollup/plugin-node-resolve";
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import pkg from "./package.json";
import typescript from 'rollup-plugin-typescript2';

const commonOutputOptions = {
  dir: "dist",
  preserveModules: true,
  preserveModulesRoot: "lib",
};

function getOutputOptions(options) {
  return {
    ...commonOutputOptions,
    ...options,
  };
}

function withSourceMapOutputOptions(options) {
  return {
    ...options,
    sourcemap: true,
  };
}

function getCJSOutputOptions(options) {
  return {
    ...getOutputOptions(options),
    format: "cjs",
    exports: "named",
  };
}

function getESMOutputOptions(options) {
  return {
    ...getOutputOptions(options),
    format: "esm",
  };
}

export default {
  input: ["lib/index.ts"],
  output: [
    // ESM
    getESMOutputOptions(
      withSourceMapOutputOptions({
        entryFileNames: "[name].esm.js",
      })
    ),
    // CommonJS
    getCJSOutputOptions(
      withSourceMapOutputOptions({})
    )
  ],
  plugins: [
    peerDepsExternal(),
    resolve(),
    typescript(),
  ],
  external: Object.keys(pkg.peerDependencies),
};
