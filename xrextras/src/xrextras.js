const {AFrameFactory} = require('./aframe/aframe.js')
const {AlmostThereFactory} = require('./almosttheremodule/almost-there-module.js')
const {DebugWebViewsFactory} = require('./debugwebviews/debug-web-views.js')
const {FullWindowCanvasFactory} = require('./fullwindowcanvasmodule/full-window-canvas-module.js')
const {LoadingFactory} = require('./loadingmodule/loading-module.js')
const {PauseOnBlurFactory} = require('./pauseonblurmodule/pauseonblur.js')
const {PauseOnHiddenFactory} = require('./pauseonhiddenmodule/pauseonhidden.js')
const {PlayCanvasFactory} = require('./playcanvas/playcanvas.js')
const {PwaInstallerFactory} = require('./pwainstallermodule/pwa-installer-module.js')
const {RuntimeErrorFactory} = require('./runtimeerrormodule/runtime-error-module.js')
const {StatsFactory} = require('./statsmodule/stats.js')
const {ThreeExtrasFactory} = require('./three/three-extras.js')
const {MediaRecorder} = require('./mediarecorder/mediarecorder.js')

require('./common.css')

module.exports = {
  XRExtras: {
    AFrame: AFrameFactory(),
    AlmostThere: AlmostThereFactory(),
    DebugWebViews: DebugWebViewsFactory(),
    FullWindowCanvas: FullWindowCanvasFactory(),
    Loading: LoadingFactory(),
    PauseOnBlur: PauseOnBlurFactory(),
    PauseOnHidden: PauseOnHiddenFactory(),
    PlayCanvas: PlayCanvasFactory(),
    PwaInstaller: PwaInstallerFactory(),
    RuntimeError: RuntimeErrorFactory(),
    Stats: StatsFactory(),
    ThreeExtras: ThreeExtrasFactory(),
    MediaRecorder,
  },
}
