const {AFrameFactory} = require('./aframe/aframe.js')
const {AlmostThereFactory} = require('./almosttheremodule/almost-there-module.js')
const {DebugWebViewsFactory} = require('./debugwebviews/debug-web-views.js')
const {FullWindowCanvasFactory} = require('./fullwindowcanvasmodule/full-window-canvas-module.js')
const {LoadingFactory} = require('./loadingmodule/loading-module.js')
const {LifecycleFactory} = require('./lifecyclemodule/lifecycle.js')
const {PauseOnBlurFactory} = require('./pauseonblurmodule/pauseonblur.js')
const {PauseOnHiddenFactory} = require('./pauseonhiddenmodule/pauseonhidden.js')
const {PlayCanvasFactory} = require('./playcanvas/playcanvas.js')
const {PwaInstallerFactory} = require('./pwainstallermodule/pwa-installer-module.js')
const {RuntimeErrorFactory} = require('./runtimeerrormodule/runtime-error-module.js')
const {StatsFactory} = require('./statsmodule/stats.js')
const {ThreeExtrasFactory} = require('./three/three-extras.js')
const {MediaRecorder} = require('./mediarecorder/mediarecorder.js')

require('./common.css')

const XRExtras = {
  AFrame: AFrameFactory(),
  AlmostThere: AlmostThereFactory(),
  DebugWebViews: DebugWebViewsFactory(),
  FullWindowCanvas: FullWindowCanvasFactory(),
  Lifecycle: LifecycleFactory(),
  Loading: LoadingFactory(),
  PauseOnBlur: PauseOnBlurFactory(),
  PauseOnHidden: PauseOnHiddenFactory(),
  PlayCanvas: PlayCanvasFactory(),
  PwaInstaller: PwaInstallerFactory(),
  RuntimeError: RuntimeErrorFactory(),
  Stats: StatsFactory(),
  ThreeExtras: ThreeExtrasFactory(),
  MediaRecorder,
}

const setDeprecatedProperty = (object, property, value, message) => {
  let warned = false

  Object.defineProperty(object, property, {
    get: () => {
      if (!warned) {
        warned = true
        /* eslint-disable no-console */
        console.warn('[XR] Deprecation Warning:', message)
        console.warn(Error().stack.replace(/^Error.*\n\s*/, '').replace(/\n\s+/g, '\n'))
        /* eslint-enable no-console */
      }
      return value
    },
  })
}

const setRenameDeprecation = (oldName, newName, value, version) => {
  const message = `XRExtras.${oldName} was deprecated in ${version}. Use ${newName} instead.`
  setDeprecatedProperty(XRExtras, oldName, value, message)
}

setRenameDeprecation('PauseOnBlur', 'PauseOnHidden', XRExtras.PauseOnBlur, 'R17.0')

module.exports = {XRExtras}
