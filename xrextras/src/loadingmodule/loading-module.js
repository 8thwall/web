require('!style-loader!css-loader!../fonts/fonts.css')
require('!style-loader!css-loader!./loading-module.css')

const html = require('./loading-module.html')

let loadingModule = null

const LoadingFactory = () => {
  if (!loadingModule) {
    loadingModule = create()
  }

  return loadingModule
}

function create() {
  let rootNode_ = null
  let loadBackground_
  let loadImageContainer_
  let camPermissionsRequest_
  let camPermissionsFailedAndroid_
  let camPermissionsFailedApple_
  let camPermissionsFailedSamsung_
  let appLoaded_ = () => { return true }
  let numUpdates_ = 0
  let waitingOnReality_ = false

  const setRoot = rootNode => {
    rootNode_ = rootNode
    loadBackground_ = rootNode_.querySelector('#loadBackground')
    loadImageContainer_ = rootNode_.querySelector('#loadImageContainer')
    camPermissionsRequest_ = document.getElementById("requestingCameraPermissions")
    camPermissionsFailedAndroid_ = document.getElementById("cameraPermissionsErrorAndroid")
    camPermissionsFailedApple_ = document.getElementById("cameraPermissionsErrorApple")
    camPermissionsFailedSamsung_ = document.getElementById("cameraPermissionsErrorSamsung")
  }

  const hideLoadingScreenNow = () => {
    loadBackground_.classList.add('hidden')
    rootNode_.parentNode && rootNode_.parentNode.removeChild(rootNode_)
  }

  const hideLoadingScreen = () => {
    loadImageContainer_.classList.add('fade-out')
    setTimeout(() => {
      loadBackground_.classList.add('fade-out')
      loadBackground_.style.pointerEvents = 'none'
      setTimeout(() => hideLoadingScreenNow(), 1000)
    }, 1000)
  }

  const showCameraPermissionsPrompt = () => {
    showLoading()
    camPermissionsRequest_.classList.remove('hidden')
  }

  const dismissCameraPermissionsPrompt = () => {
    camPermissionsRequest_.classList.add('fade-out')
  }

  const promptUserToChangeBrowserSettings = () => {
    camPermissionsRequest_.classList.add('hidden')
    const ua = navigator.userAgent
    if (ua.includes('Linux')) {
      let instructionsToShow

      const domainViews = rootNode_.querySelectorAll('.domain-view')
      for (let i = 0; i < domainViews.length; i++) {
        domainViews[i].textContent = window.location.hostname
      }

      if (navigator.userAgent.includes('SamsungBrowser')) {
        instructionsToShow = rootNode_.querySelectorAll('.samsung-instruction')
      } else {
        instructionsToShow = rootNode_.querySelectorAll('.chrome-instruction')
      }
      camPermissionsFailedAndroid_.classList.remove('hidden')
      for (let i = 0; i < instructionsToShow.length; i++) {
        instructionsToShow[i].classList.remove('hidden')
      }
    } else {
      camPermissionsFailedApple_.classList.remove('hidden')
    }

    XR.pause()
    XR.stop()
  }

  const checkLoaded = () => {
    if (appLoaded_() && !waitingOnReality_) {
      hideLoadingScreen()
      return
    }
    requestAnimationFrame(() => { checkLoaded() })
  }

  const pipelineModule = () => {
    return {
      name: 'loading',
      onUpdate: () => {
        if (!waitingOnReality_) {
          return
        }
        if (numUpdates_ < 5) {
          ++numUpdates_
        } else {
          waitingOnReality_ = false
          checkLoaded()
        }
      },
      onCameraStatusChange: ({status}) => {
        if (!XR.XrDevice.isDeviceBrowserCompatible()) {
          return
        }
        if (status == 'requesting') {
          showCameraPermissionsPrompt()
        } else if (status == 'hasStream') {
          dismissCameraPermissionsPrompt()
        } else if (status == 'hasVideo') {
          // ignore; wait a few frames for UI to update before dropping load screen.
        } else if (status == 'failed') {
          promptUserToChangeBrowserSettings()
        }
      },
      onException: () => {
        if (!rootNode_) {
          return
        }
        dismissCameraPermissionsPrompt()
        hideLoadingScreenNow()
      },
    }
  }

  const showLoading = (args) => {
    if (rootNode_) {
      return
    }

    // Show the loading UI.
    const e = document.createElement('template')
    e.innerHTML = html.trim()
    const rootNode = e.content.firstChild
    document.getElementsByTagName('body')[0].appendChild(rootNode)
    setRoot(rootNode)
    waitingOnReality_ = true

    if (args && args.onxrloaded) {
      window.XR ? args.onxrloaded() : window.addEventListener('xrloaded', args.onxrloaded)
    }
  }

  const setAppLoadedProvider = (appLoaded) => {
    appLoaded_ = appLoaded
  }

  return {
    pipelineModule,
    showLoading,
    setAppLoadedProvider,
  }
}

module.exports = {
  LoadingFactory,
}
