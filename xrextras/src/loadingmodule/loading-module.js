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
  let deviceMotionErrorApple_
  let appLoaded_ = () => { return true }
  let numUpdates_ = 0
  let waitingOnReality_ = false
  let needsPermissionCookie_ = false
  const ua = navigator.userAgent

  let hasMotionEvents_ = false
  const motionListener = () => {
    hasMotionEvents_ = true
    window.removeEventListener('devicemotion', motionListener)
  }
  window.addEventListener('devicemotion', motionListener)

  const iframeMotionListener = (event) => {
    if (event.data.deviceOrientation8w || event.data.deviceMotion8w) {
      hasMotionEvents_ = true
      window.removeEventListener('message', iframeMotionListener)
    }
  }
  window.addEventListener('message', iframeMotionListener)

  const setRoot = rootNode => {
    rootNode_ = rootNode
    loadBackground_ = rootNode_.querySelector('#loadBackground')
    loadImageContainer_ = rootNode_.querySelector('#loadImageContainer')
    camPermissionsRequest_ = document.getElementById("requestingCameraPermissions")
    camPermissionsFailedAndroid_ = document.getElementById("cameraPermissionsErrorAndroid")
    camPermissionsFailedApple_ = document.getElementById("cameraPermissionsErrorApple")
    camPermissionsFailedSamsung_ = document.getElementById("cameraPermissionsErrorSamsung")
    deviceMotionErrorApple_ = document.getElementById("deviceMotionErrorApple")
    userPromptError_ = document.getElementById("userPromptError")
    cameraSelectionWorldTrackingError_ = document.getElementById("cameraSelectionWorldTrackingError")
    motionPermissionsErrorApple_ = document.getElementById("motionPermissionsErrorApple")
  }

  const hideLoadingScreenNow = (removeRoot = true) => {
    loadBackground_.classList.add('hidden')
    removeRoot && rootNode_.parentNode && rootNode_.parentNode.removeChild(rootNode_)
  }

  const hideLoadingScreen = (removeRoot = true) => {
    loadImageContainer_.classList.add('fade-out')
    setTimeout(() => {
      loadBackground_.classList.add('fade-out')
      loadBackground_.style.pointerEvents = 'none'
      setTimeout(() => hideLoadingScreenNow(removeRoot), 400)
    }, 400)
  }

  const showCameraPermissionsPrompt = () => {
    camPermissionsRequest_.classList.remove('hidden')
  }

  const dismissCameraPermissionsPrompt = () => {
    camPermissionsRequest_.classList.add('fade-out')
  }

  const promptUserToChangeBrowserSettings = () => {
    camPermissionsRequest_.classList.add('hidden')
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
    hideLoadingScreen(false)

    XR8.pause()
    XR8.stop()
  }

  const promptUserToChangeBrowserMotionSettings = () => {
    window.removeEventListener('devicemotion', motionListener)
    window.removeEventListener('message', iframeMotionListener)

    // Device orientation permissions only need to be requested on iOS.
    if (XR8.XrDevice.deviceEstimate().os !== 'iOS') {
      return
    }

    // Device orientation permissions only need to be requested if they're required.
    if (XR8.XrPermissions) {
      const permissions = XR8.XrPermissions.permissions()
      const requiredPermissions = XR8.requiredPermissions()
      if (!requiredPermissions.has(permissions.DEVICE_MOTION)
        && !requiredPermissions.has(permissions.DEVICE_ORIENTATION)) {
        return
      }
    }

    if (XR8.XrDevice.deviceEstimate().osVersion.startsWith('12')) {
      deviceMotionErrorApple_.classList.remove('hidden')
    } else {
      motionPermissionsErrorApple_.classList.remove('hidden')
    }

    hideLoadingScreen(false)
    XR8.pause()
    XR8.stop()
  }

  const checkLoaded = () => {
    if (appLoaded_() && !waitingOnReality_) {
      if (needsPermissionCookie_) {
        document.cookie = 'previouslyGotCameraPermission=true;max-age=31536000';
      }
      hideLoadingScreen()
      return
    }
    requestAnimationFrame(() => { checkLoaded() })
  }
  const isAndroid = ua.includes('Linux')
  needsPermissionCookie_ = isAndroid && !document.cookie.includes('previouslyGotCameraPermission=true')
  const previouslyGotCameraPermission = isAndroid && !needsPermissionCookie_
  const pipelineModule = () => {
    return {
      name: 'loading',
      onStart: () => {
        if (hasMotionEvents_ !== true) {
          promptUserToChangeBrowserMotionSettings()
        }
      },
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
      onBeforeRun: () => {
        showLoading()
      },
      onCameraStatusChange: ({status}) => {
        if (!XR8.XrDevice.isDeviceBrowserCompatible()) {
          return
        }
        if (status == 'requesting') {
          showLoading()
          if (!previouslyGotCameraPermission) {
            showCameraPermissionsPrompt()
          }
        } else if (status == 'hasStream') {
          if (!previouslyGotCameraPermission) {
            dismissCameraPermissionsPrompt()
          }
        } else if (status == 'hasVideo') {
          // wait a few frames for UI to update before dropping load screen.
        } else if (status == 'failed') {
          promptUserToChangeBrowserSettings()
        }
      },
      onException: error => {
        if (!rootNode_) {
          return
        }

        if (error instanceof Object) {
          if (error.type === 'permission') {
            if (error.permission === 'prompt') {
              // User denied XR8's prompt to start requesting
              hideLoadingScreen(false)
              userPromptError_.classList.remove('hidden')
              return
            }

            if (error.permission === XR8.XrPermissions.permissions().DEVICE_MOTION ||
                error.permission === XR8.XrPermissions.permissions().DEVICE_ORIENTATION) {
              // This only happens if motion or orientation are requestable permissions (iOS 13+)
              promptUserToChangeBrowserMotionSettings()
              return
            }
          }
          if (error.type === 'configuration') {
            if (error.source === 'reality' && error.err === 'slam-front-camera-unsupported') {
              // User is attemping to use Front camera without disabling world tracking
              hideLoadingScreen(false)
              document.getElementById('camera_mode_world_tracking_error').innerHTML = error.message
              cameraSelectionWorldTrackingError_.classList.remove('hidden')

              // Stop camera processing.
              XR8.pause()
              XR8.stop()
              return
            }
          }
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
      window.XR8 ? args.onxrloaded() : window.addEventListener('xrloaded', args.onxrloaded)
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
