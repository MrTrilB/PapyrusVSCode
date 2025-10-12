// @ts-check
"use strict";

const path = require("path");

/** @type {import('webpack').Configuration} */
const extensionConfig = {
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
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: [/node_modules\//, /src[\\\/]test[\\\/]?/],
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

const webviewConfig = {
  target: "web",
  mode: "none",
  entry: {
    main: path.resolve(__dirname, "src", "webview", "main.tsx")
  },
  output: {
    path: path.resolve(__dirname, "out", "webview"),
    filename: "[name].js",
    devtoolModuleFilenameTemplate: "../../[resource-path]"
  },
  devtool: "source-map",
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules\//,
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

module.exports = [extensionConfig, webviewConfig];
