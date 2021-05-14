const path = require('path');

module.exports = {
  mode: 'development',
  devtool: 'inline-source-map',
  entry: {
    main: './index.ts',
  },
  output: {
    path: path.resolve(__dirname),
    filename: './index.js',
  },
  resolve: {
    extensions: ['.ts'],
  },
  module: {
    rules: [
      {
        test: /.ts$/,
        loader: 'ts-loader',
      }
    ]
  }
};
