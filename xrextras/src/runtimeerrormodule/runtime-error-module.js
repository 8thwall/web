require('!style-loader!css-loader!../fonts/fonts.css')
require('!style-loader!css-loader!./runtime-error-module.css')

const html = require('./runtime-error-module.html')

let runtimeerrorModule = null

const RuntimeErrorFactory = () => {
  if (!runtimeerrorModule) {
    runtimeerrorModule = create()
  }

  return runtimeerrorModule
}

const create = () => {
  let started = false
  let rootNode = null
  const hideRuntimeError = () => {
    if (!rootNode) {
      return
    }

    rootNode.parentNode.removeChild(rootNode)
    rootNode = null
  }
  const pipelineModule = () => {
    return {
      name: 'error',
      onStart: () => { started = true },
      onException: (error) => {
        // Only handle errors while running, not at startup.
        if (!started) { return }

        // Only add the error message once.
        if (rootNode) { return }

        // Log the error to the console to help with debugging.
        console.error('[RuntimeError] XR caught an error; stopping.', error)

        // Show the error message.
        const e = document.createElement('template')
        e.innerHTML = html.trim()

        rootNode = e.content.firstChild
        document.getElementsByTagName('body')[0].appendChild(rootNode)
        document.getElementById('error_msg_unknown').classList.remove('hidden')

        // Stop camera processing.
        XR8.pause()
        XR8.stop()
      },
    }
  }

  return {
    // Adds a pipeline module that displays an error image and stops the camera
    // feed when an error is encountered after the camera starts running.
    pipelineModule,
    hideRuntimeError,
  }
}

module.exports = {
  RuntimeErrorFactory,
}
