const path = require('path')

module.exports = {
  entry: './src/index.js',
  output: {
    filename: 'xrextras.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }, {
        test: /\.html$/,
        use: 'html-loader',
      }
    ]
  },
  mode: 'production'
}
