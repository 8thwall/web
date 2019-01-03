// Copyright (c) 2018 8th Wall, Inc.

const os = require('os')
const dns = require('dns')
const path = require('path')
const chalk = require('chalk')
const boxen = require('boxen')
const webpack = require('webpack')
const qr = require('qrcode')
const WebpackDevServer = require('webpack-dev-server')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const {nextAvailable} = require('node-port-check')

process.on('unhandledRejection', err => { console.error(err); throw err })

if (process.argv.length < 3) {
  console.log(`usage: node ${process.argv[1]} pathToServe`)
  console.log('Environment variables:')
  console.log('  PORT           # [8080]')
  console.log('  NODE_ENV       # [development]')
  console.log('  USE_LOCALHOST  # [false] "true" hot reloads over localhost instead of ip')
  console.log('  NO_RELOAD      # [false] "true" disables hot reloading, useful for iOS')
  console.log('  CERT_FILE      # set to SSL certificate file')
  console.log('  NET_IFACE      # choose network interface by name')
  process.exit(1)
}
const contentBase = process.argv[2]

if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'development'
}

const DEFAULT_PORT = 8080
const HOST = process.env.HOST || '0.0.0.0'
const protocol = 'https'
const useLocalhost = process.env.USE_LOCALHOST === 'true'

///////////////////////////////////////////////////////////////////////////////
let https = true
if (process.env.CERT_FILE) {
  const cert = require('fs').readFileSync(process.env.CERT_FILE)
  https = { key: cert, cert }
}

const serverConfig = {
  compress: true,
  clientLogLevel: 'info',
  contentBase: contentBase,
  watchContentBase: true,
  publicPath: '/',
  hot: false,
  hotOnly: false,
  quiet: !process.env.VERBOSE,
  https,
  host: HOST,
  overlay: false,
  historyApiFallback: {
    disableDotRule: true,
  },
}

const config = {
  mode: process.env.NODE_ENV,
  entry: { app: [path.resolve(__dirname, 'empty.js')] },
  output: {
    path: '/tmp/build',
    filename: 'live.js',
  },
  devtool: 'eval',
  plugins: [],
}

// Determine interface address
const fixName = n => n.replace(/\-/g, '').replace(/ /g, '')
const ifaces = Object.entries(os.networkInterfaces())
  .reduce((o, [k, v]) => o.concat(v.map(v => ({...v, iface: k}))), [])
  .filter(i => i.family === 'IPv4')
  .sort((a, b) => {
    if (a.internal && !b.internal) {
      return 1
    }
    if (b.internal && !a.internal) {
      return -1
    }
    return (a.iface < b.iface ? -1 : 1)
  })
const ifacesByName = ifaces
  .reduce((o, v) => Object.assign(o, {[fixName(v.iface)]: v.address}), {})
if (ifaces.length < 1) {
  console.error('No network interfaces found, cannot serve.')
  process.exit(1)
}
const iface = (process.env.NET_IFACE && process.env.NET_IFACE.trim()) || fixName(ifaces[0].iface)
const address = ifacesByName[iface]
if (!address) {
  console.error(`Interface ${iface} does not exist`, ifacesByName)
  process.exit(1)
}
if (ifaces.length > 2) {
  // expect en0 and lo0
  console.log(`There are multiple network interfaces.  Use -i <name> to choose.`)
  console.log(`  ${JSON.stringify(ifacesByName)}`)
  console.log(`using ${iface} = ${address}`)
  console.log('')
}

// Inject live.js into page for hot reloading
config.plugins.push(new HtmlWebpackPlugin({
  inject: true,
  template: `${contentBase}/index.html`,
}))

// enable hot reloading
if (process.env.NO_RELOAD !== "true") {
  config.entry.app.unshift(path.resolve(__dirname, '..', 'node_modules', 'webpack-dev-server/client/index.js')
    + `?${protocol}://${useLocalhost ? 'localhost' : address}:${PORT}`)
  config.devServer = { inline: "true" }
}

const compiler = webpack(config)
compiler.plugin('invalid', () => console.log('Compiling...'))
compiler.plugin('done', stats => {
  const isSuccessful = !stats.compilation.errors.length && !stats.compilation.warnings.length
  if (isSuccessful) {
    console.log(chalk.green('Compiled successfully!'))
  }
  if (stats.compilation.errors.length) {
    console.log(chalk.red('Failed to compile.\n'))
    console.log(stats.compilation.errors[0] + '\n\n')
    return
  }
  if (stats.compilation.warnings.length) {
    console.log(chalk.yellow('Compiled with warnings.\n'))
    console.log(stats.compilation.warnings.join('\n\n'))
  }
}) // end compiler.plugin on done

// Find available port and launch WebpackDevServer
nextAvailable(process.env.PORT || DEFAULT_PORT).then((PORT) => {
  // Exit if user defined port is in use
  if (process.env.PORT && (process.env.PORT != PORT)) {
    console.log('ERROR: Port ' + process.env.PORT + ' is in use by another process.')
    process.exit(1)
  }
  
  // Launch WebpackDevServer.
  const devServer = new WebpackDevServer(compiler, serverConfig)
  devServer.listen(PORT, serverConfig.host, err => {
    if (err) {
      return console.error(err)
    }
    const url = `${protocol}://${useLocalhost ? 'localhost' : address}:${PORT}`
    const message = `Starting the development server\n\n` +
      `  Listening: ${url}\n` +
      `  Serving  : ${contentBase}\n\n` +
      `  IMPORTANT: Make sure to copy the entire "Listening" URL above into your browser,\n` +
      `  including both the protocol "${protocol}://" at the beginning, and port ":${PORT}" number at the end.`
  
    qr.toString(url, { type: 'terminal' }, (err, qrtext) => {
      const msg = err ? message : `${message}\n\nOr scan the QR code:\n\n${qrtext}`
      console.log(boxen(chalk.bold(chalk.cyan(msg)), { padding: 1, borderColor: 'green', margin: 1 }))
    })
  })

  ;['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
      devServer.close()
      process.exit()
    })
  })
})

