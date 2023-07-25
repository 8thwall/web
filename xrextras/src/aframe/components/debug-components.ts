import type {ComponentDefinition} from 'aframe'

declare const XRExtras: any
declare const XR8: any

// Show an error-handling scene on error.
const runtimeErrorComponent: ComponentDefinition = {
  init() {
    const load = () => { XR8.addCameraPipelineModule(XRExtras.RuntimeError.pipelineModule()) }
    window.XRExtras && window.XR8
      ? load()
      : window.addEventListener('xrandextrasloaded', load, {once: true})
  },
  remove() {
    XRExtras.RuntimeError.hideRuntimeError()
    XR8.removeCameraPipelineModule('error')
  },
}

// Display stats.
const statsComponent: ComponentDefinition = {
  schema: {
    'version': {default: true},
  },
  init() {
    if (this.data.version === true) {
      const onready = () => {
        this.el.sceneEl.removeEventListener('realityready', onready)
        const version = XR8.version()
        this.versionDisplay = document.createElement('h2')
        Object.assign(this.versionDisplay.style, {
          position: 'absolute',
          top: 0,
          right: 0,
          margin: '0 auto',
          color: '#1BF6F6',
          background: '#100C2F',
          zIndex: 99,
          fontFamily: 'monospace',
        })
        this.versionDisplay.textContent = version
        document.body.appendChild(this.versionDisplay)
      }

      this.el.sceneEl.addEventListener('realityready', onready)
    }
    this.loadModule = () => { XR8.addCameraPipelineModule(XRExtras.Stats.pipelineModule()) }
    if (window.XRExtras && window.XR8) {
      this.loadModule()
    } else {
      this.xrEventListenerAdded = true
      window.addEventListener('xrandextrasloaded', this.loadModule, {once: true})
    }
  },
  remove() {
    if (this.xrEventListenerAdded) {
      window.removeEventListener('xrandextrasloaded', this.loadModule)
    }
    if (this.versionDisplay) {
      this.versionDisplay.parentNode.removeChild(this.versionDisplay)
    }
    XR8.removeCameraPipelineModule('stats')
  },
}

// Log console messages over the scene.
const logToScreenComponent: ComponentDefinition = {
  init() {
    XRExtras.DebugWebViews.enableLogToScreen()
  },
}

export {
  runtimeErrorComponent,
  statsComponent,
  logToScreenComponent,
}
