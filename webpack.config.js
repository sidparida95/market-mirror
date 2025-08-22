const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const WebpackObfuscator = require('webpack-obfuscator');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  // Set the mode to 'production' to enable optimizations
  mode: 'production',

  // The entry point of your client-side application
  entry: './src/app.js',

  // Where to put the bundled and obfuscated code
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.[contenthash].js', // Use contenthash for cache busting
    clean: true, // Clean the dist folder before each build
  },

  // Plugins do the heavy lifting
  plugins: [
    // This plugin will obfuscate your code
    new WebpackObfuscator({
      rotateStringArray: true, // Makes reverse engineering harder
      stringArray: true,
      stringArrayThreshold: 0.75
    }, []),

    // This plugin generates the final HTML file
    new HtmlWebpackPlugin({
      template: './src/index.html', // Use your original HTML as a template
    }),
  ],

  // Optimization settings for minification
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
  },
};