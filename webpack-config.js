const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');

module.exports = (options, webpack) => {
  return {
    ...options,
    plugins: [
      ...options.plugins,
      new NodePolyfillPlugin({
        includeAliases: ['crypto']
      })
    ],
    resolve: {
      ...options.resolve,
      fallback: {
        ...options.resolve?.fallback,
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer/'),
        util: require.resolve('util/'),
      }
    }
  };
}; 