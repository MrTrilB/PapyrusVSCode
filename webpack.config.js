// @ts-check
"use strict";

const path = require("path");

/** @type {import('webpack').Configuration} */
const config = {
  target: "node",
  mode: "none", // set by npm scripts via --mode when building
  entry: "./src/extension.ts",
  output: {
    path: path.resolve(__dirname, "out"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
    devtoolModuleFilenameTemplate: "../../[resource-path]"
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode"
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.(ts)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              transpileOnly: false
            }
          }
        ]
      },
      {
        test: /\.js$/,
        enforce: "pre",
        use: [
          {
            loader: "source-map-loader"
          }
        ]
      }
    ]
  },
  infrastructureLogging: {
    level: "warn",
  }
};

module.exports = config;
