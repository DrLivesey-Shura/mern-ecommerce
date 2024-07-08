const path = require("path");

module.exports = {
  // Entry point
  entry: "./src/index.js",
  // Output
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  // Resolve modules
  resolve: {
    fallback: {
      path: require.resolve("path-browserify"),
    },
  },
  // Loaders and other configurations
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
        },
      },
    ],
  },
  // Other configurations like plugins, devServer, etc.
};
