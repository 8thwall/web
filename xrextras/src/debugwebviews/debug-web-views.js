let debugwebviews = null

const DebugWebViewsFactory = () => {
  if (!debugwebviews) {
    debugwebviews = create()
  }

  return debugwebviews
}

function create() {
  let logstr = ''
  const nativelog = window.console.log
  const enableLogToScreen = () => {
    const mylog = (args) => {
      nativelog(args)
      logstr = logstr + '* ' + args + '<br>'
      let logdiv = document.getElementById('logdiv')
      if (!logdiv) {
        const body = document.getElementsByTagName('body')[0]
        if (!body) {
          return
        }
        logdiv = document.createElement('div')
        body.appendChild(logdiv)
        logdiv.style.zIndex = 850
        logdiv.style.position = 'absolute'
        logdiv.style.top = '0px'
        logdiv.style.left = '0px'
        logdiv.style.backgroundColor = '#FFFFFF'
        logdiv.id = 'logdiv'
      }
      logdiv.innerHTML = '<pre>' + logstr + '</pre>'
    }
    const mywarn = (args) => { mylog(`<font color=orange>${args}</font>`) }
    const myerror = (args) => { mylog(`<font color=red>${args}</font>`) }
    window.console.log = mylog
    window.console.error = myerror
    window.console.warn = mywarn
  }
  return {
    enableLogToScreen,
  }
}

module.exports = {
  DebugWebViewsFactory,
}
