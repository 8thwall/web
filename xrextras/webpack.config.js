const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'xrextras.js',
    path: path.resolve(__dirname, 'dist'),
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader',
        ],
      }, {
        test: /\.html$/,
        use: 'html-loader',
      },
    ],
  },
  mode: 'production',
  devServer: {
    contentBase: path.join(__dirname, 'dist'),
    compress: true,
    port: 9000,
    https: true,
    hot: false,
    host: '0.0.0.0',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization',
    },
  },
}
