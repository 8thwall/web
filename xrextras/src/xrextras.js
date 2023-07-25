import {AFrameFactory} from './aframe/aframe'
import {AlmostThereFactory} from './almosttheremodule/almost-there-module'
import {DebugWebViewsFactory} from './debugwebviews/debug-web-views'
import {FullWindowCanvasFactory} from './fullwindowcanvasmodule/full-window-canvas-module'
import {LoadingFactory} from './loadingmodule/loading-module'
import {LifecycleFactory} from './lifecyclemodule/lifecycle'
import {PauseOnBlurFactory} from './pauseonblurmodule/pauseonblur'
import {PauseOnHiddenFactory} from './pauseonhiddenmodule/pauseonhidden'
import {PlayCanvasFactory} from './playcanvas/playcanvas'
import {PwaInstallerFactory} from './pwainstallermodule/pwa-installer-module'
import {RuntimeErrorFactory} from './runtimeerrormodule/runtime-error-module'
import {StatsFactory} from './statsmodule/stats'
import {ThreeExtrasFactory} from './three/three-extras'
import {MediaRecorder} from './mediarecorder/mediarecorder'

import './common.css'

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

export {
  XRExtras,
}
