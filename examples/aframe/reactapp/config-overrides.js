module.exports = function override(config) {
  // add html loader as a webpack config rule
  config.module.rules.push({
    test: /\.html$/i,
    loader: 'html-loader',
  })
  return config
}
