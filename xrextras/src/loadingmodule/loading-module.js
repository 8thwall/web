/* globals XR8 */

require('!style-loader!css-loader!../fonts/fonts.css')
require('!style-loader!css-loader!./loading-module.css')

const html = require('./loading-module.html')

const FIRST_FRAME_DELAY = 5

// This is a simplistic check to be used when we have already failed in getting
// access to the camera. This can be used to differentiate between a permission denial
// and a lack of camera.
function hasGetUserMedia() {
  return navigator && navigator.mediaDevices && navigator.mediaDevices.getUserMedia
}

let loadingModule = null

function create() {
  let rootNode_ = null
  let loadBackground_
  let loadImageContainer_
  let camPermissionsRequest_
  let camPermissionsFailedAndroid_
  let camPermissionsFailedApple_
  let micPermissionsFailedAndroid_
  let micPermissionsFailedApple_
  let linkOutViewAndroid_
  let copyLinkViewAndroid_
  let userPromptError_
  let motionPermissionsErrorApple_
  let cameraSelectionError_
  let deviceMotionErrorApple_
  let appLoaded_ = () => true
  // Should the loading module wait for a reality texture to hide the loading screen.
  let waitForRealityTexture_ = false
  let numUpdates_ = 0
  // Are we waiting to hide the loading screen.
  let waitingToHideLoadingScreen_ = false
  let waitingOnAppResources_ = false
  let needsCookie_ = false
  let runConfig_ = null
  const ua = navigator.userAgent
  let cancelCameraTimeout

  let hasMotionEvents_ = false
  const motionListener = () => {
    hasMotionEvents_ = true
    window.removeEventListener('devicemotion', motionListener)
  }
  window.addEventListener('devicemotion', motionListener)

  const getAppNameForDisplay = () => {
    const deviceInfo = XR8.XrDevice.deviceEstimate()
    if (deviceInfo.browser.inAppBrowser) {
      return deviceInfo.browser.inAppBrowser
    }
    return deviceInfo.browser.name === 'Mobile Safari' ? '' : deviceInfo.browser.name
  }

  const iframeMotionListener = (event) => {
    if (event.data.deviceOrientation8w || event.data.deviceMotion8w) {
      hasMotionEvents_ = true
      window.removeEventListener('message', iframeMotionListener)
    }
  }
  window.addEventListener('message', iframeMotionListener)

  const setRoot = (rootNode) => {
    rootNode_ = rootNode
    loadBackground_ = rootNode_.querySelector('#loadBackground')
    loadImageContainer_ = rootNode_.querySelector('#loadImageContainer')
    camPermissionsRequest_ = document.getElementById('requestingCameraPermissions')
    camPermissionsFailedAndroid_ = document.getElementById('cameraPermissionsErrorAndroid')
    camPermissionsFailedApple_ = document.getElementById('cameraPermissionsErrorApple')
    micPermissionsFailedAndroid_ = document.getElementById('microphonePermissionsErrorAndroid')
    micPermissionsFailedApple_ = document.getElementById('microphonePermissionsErrorApple')
    linkOutViewAndroid_ = document.getElementById('linkOutViewAndroid')
    copyLinkViewAndroid_ = document.getElementById('copyLinkViewAndroid')
    deviceMotionErrorApple_ = document.getElementById('deviceMotionErrorApple')
    userPromptError_ = document.getElementById('userPromptError')
    cameraSelectionError_ = document.getElementById('cameraSelectionWorldTrackingError')
    motionPermissionsErrorApple_ = document.getElementById('motionPermissionsErrorApple')
  }

  const clearRoot = () => {
    if (rootNode_ && rootNode_.parentNode) {
      rootNode_.parentNode.removeChild(rootNode_)
    }
    rootNode_ = null
    loadBackground_ = null
    loadImageContainer_ = null
    camPermissionsRequest_ = null
    camPermissionsFailedAndroid_ = null
    camPermissionsFailedApple_ = null
    micPermissionsFailedAndroid_ = null
    micPermissionsFailedApple_ = null
    linkOutViewAndroid_ = null
    copyLinkViewAndroid_ = null
    deviceMotionErrorApple_ = null
    userPromptError_ = null
    cameraSelectionError_ = null
    motionPermissionsErrorApple_ = null
  }

  // Hide the loading screen.
  const hideLoadingScreenNow = (removeRoot = true) => {
    if (loadBackground_) {
      loadBackground_.classList.add('hidden')
    }
    if (removeRoot) {
      clearRoot()
    }
  }

  // Fade out the loading screen and then hide it.
  const hideLoadingScreen = (removeRoot = true) => {
    if (loadImageContainer_) {
      loadImageContainer_.classList.add('fade-out')
    }
    setTimeout(() => {
      if (loadBackground_) {
        loadBackground_.classList.add('fade-out')
        loadBackground_.style.pointerEvents = 'none'
      }
      setTimeout(() => hideLoadingScreenNow(removeRoot), 400)
    }, 400)
  }

  const showCameraPermissionsPrompt = () => {
    camPermissionsRequest_.classList.remove('hidden')
  }

  const dismissCameraPermissionsPrompt = () => {
    camPermissionsRequest_.classList.add('fade-out')
  }

  const promptUserToChangeBrowserSettingsMicrophone = () => {
    // We only really handle Android variants (Samsung/Chrome browsers)
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
      micPermissionsFailedAndroid_.classList.remove('hidden')
      instructionsToShow.forEach((instruction) => {
        instruction.classList.remove('hidden')
      })
    } else {
      // Show permission error for iOS
      micPermissionsFailedApple_.classList.remove('hidden')
      micPermissionsFailedApple_.getElementsByClassName('wk-app-name')[0]
        .innerText = getAppNameForDisplay()
    }
  }

  const promptUserToChangeBrowserSettingsCamera = () => {
    // We only really handle Android variants (Samsung/Chrome browsers)
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
      instructionsToShow.forEach((instruction) => {
        instruction.classList.remove('hidden')
      })
    } else {
      // Show permission error for iOS
      camPermissionsFailedApple_.classList.remove('hidden')
      camPermissionsFailedApple_.getElementsByClassName('wk-app-name')[0]
        .innerText = getAppNameForDisplay()
    }
  }

  const promptUserToChangeBrowserSettings = (reason) => {
    camPermissionsRequest_.classList.add('hidden')
    if (reason === 'NO_MICROPHONE' || reason === 'DENY_MICROPHONE') {
      promptUserToChangeBrowserSettingsMicrophone()
    } else {
      promptUserToChangeBrowserSettingsCamera()
    }
    hideLoadingScreen(false)

    XR8.pause()
    XR8.stop()
  }

  const displayAndroidLinkOutView = () => {
    camPermissionsRequest_.classList.add('hidden')

    const ogTag = document.querySelector('meta[name="og:image"]')
    const headerImgSrc = ogTag && ogTag.content
    Array.from(document.querySelectorAll('.app-header-img')).forEach((img) => {
      if (headerImgSrc) {
        img.src = headerImgSrc
      } else {
        img.classList.add('foreground-image')
        img.src = 'https://cdn.8thwall.com/web/img/almostthere/v2/android-fallback.png'
      }
    })

    const cBtn = document.getElementById('open_browser_android')
    const link = window.location.href.replace(/^https:\/\//, '')
    cBtn.href = `intent://${link}#Intent;scheme=https;action=android.intent.action.VIEW;end;`

    linkOutViewAndroid_.classList.remove('hidden')
    hideLoadingScreen(false)

    XR8.pause()
    XR8.stop()
  }

  const displayCopyLinkView = () => {
    camPermissionsRequest_.classList.add('hidden')

    const ogTag = document.querySelector('meta[name="og:image"]')
    const headerImgSrc = ogTag && ogTag.content
    Array.from(document.querySelectorAll('.app-header-img')).forEach((img) => {
      if (headerImgSrc) {
        img.src = headerImgSrc
      } else {
        img.classList.add('foreground-image')
        img.src = 'https://cdn.8thwall.com/web/img/almostthere/v2/android-fallback.png'
      }
    })

    const link = window.location.href
    const redirectLinks = document.querySelectorAll('.desktop-home-link')
    for (let i = 0; i < redirectLinks.length; i++) {
      redirectLinks[i].textContent = link
    }

    const cBtn = document.getElementById('copy_link_android')
    cBtn.addEventListener('click', () => {
      const dummy = document.createElement('input')
      document.body.appendChild(dummy)
      dummy.value = link
      dummy.select()
      document.execCommand('copy')
      document.body.removeChild(dummy)

      cBtn.innerHTML = 'Copied!'
      cBtn.classList.add('error-copy-link-copied')
    })

    copyLinkViewAndroid_.classList.remove('hidden')
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
      if (!requiredPermissions.has(permissions.DEVICE_MOTION) &&
        !requiredPermissions.has(permissions.DEVICE_ORIENTATION)) {
        return
      }
    }

    if (XR8.XrDevice.deviceEstimate().osVersion.startsWith('12')) {
      deviceMotionErrorApple_.classList.remove('hidden')
    } else {
      motionPermissionsErrorApple_.classList.remove('hidden')
      motionPermissionsErrorApple_.getElementsByClassName('wk-app-name')[0]
        .innerText = getAppNameForDisplay()
    }
    hideLoadingScreen(false)
    XR8.pause()
    XR8.stop()
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
    waitingToHideLoadingScreen_ = true

    if (args && args.waitForRealityTexture) {
      waitForRealityTexture_ = true
    }

    if (args && args.onxrloaded) {
      if (window.XR8) {
        args.onxrloaded()
      } else {
        window.addEventListener('xrloaded', args.onxrloaded)
      }
    }
  }

  const isAndroid = ua.includes('Linux')
  needsCookie_ = isAndroid && !document.cookie.includes('previouslyGotCameraPermission=true')
  const previouslyGotCameraPermission = isAndroid && !needsCookie_
  const pipelineModule = () => ({
    name: 'loading',
    onStart: () => {
      if (hasMotionEvents_ !== true) {
        promptUserToChangeBrowserMotionSettings()
      }
    },
    onUpdate: ({processCpuResult}) => {
      // We have already removed the loading screen, return.
      if (!waitingToHideLoadingScreen_) {
        return
      }

      // Stay in sync with xr-aframe, which also has a FIRST_FRAME_DELAY but doesn't start counting
      // frames until it has a texture. This will only work for A-Frame. If other renderers need a
      // delay, use frameStartResult's cameraTexture, which should be one frame ahead of
      // `reality`'s texture.
      if (waitForRealityTexture_) {
        const {reality, facecontroller} = processCpuResult
        if (!(reality && reality.realityTexture) &&
            !(facecontroller && facecontroller.cameraFeedTexture)) {
          return
        }
      }

      // Show the canvas after N frames have passed and app resources are loaded. Don't wait for app
      // resources to be loaded to start counting frames.
      numUpdates_++
      if (numUpdates_ > FIRST_FRAME_DELAY && !waitingOnAppResources_ && appLoaded_()) {
        if (needsCookie_) {
          document.cookie = 'previouslyGotCameraPermission=true;max-age=31536000'
        }
        hideLoadingScreen()
        waitingToHideLoadingScreen_ = false
      }
    },
    onAppResourcesLoaded: () => {
      waitingOnAppResources_ = false
    },
    onBeforeRun: (args) => {
      runConfig_ = args && args.config
      waitingOnAppResources_ = true
      numUpdates_ = 0
      showLoading()
    },
    onCameraStatusChange: ({status, config, reason}) => {
      if (!XR8.XrDevice.isDeviceBrowserCompatible(runConfig_) || !rootNode_) {
        return
      }
      if (status === 'requesting') {
        if (config.verbose) {
          const debugElement = document.getElementById('camera_mode_world_tracking_error')
          if (debugElement) {
            debugElement.innerText = JSON.stringify({
              ua,
              device: XR8.XrDevice.deviceEstimate(),
            })
          }
        }

        const curBrowser = XR8.XrDevice.deviceEstimate().browser.inAppBrowser
        if (curBrowser) {
          cancelCameraTimeout = setTimeout(() => {
            if (XR8.XrDevice.deviceEstimate().os !== 'iOS') {
              XR8.pause()
              XR8.stop()
              displayAndroidLinkOutView()
            }
          }, 3000)
        }
        showLoading()
        if (!previouslyGotCameraPermission) {
          showCameraPermissionsPrompt()
        }
      } else if (status === 'hasStream') {
        clearTimeout(cancelCameraTimeout)
        if (!previouslyGotCameraPermission) {
          dismissCameraPermissionsPrompt()
        }
      } else if (status === 'hasVideo') {
        // wait a few frames for UI to update before dropping load screen.
      } else if (status === 'failed') {
        clearTimeout(cancelCameraTimeout)
        const deviceInfo = XR8.XrDevice.deviceEstimate()
        if (!hasGetUserMedia()) {
          displayCopyLinkView()
        } else {
          switch (deviceInfo.browser.inAppBrowser) {
            case 'Sino Weibo':
            case 'WeChat':
              displayCopyLinkView()
              break
            case undefined:
            case 'Apple News':
            case 'Facebook Messenger':
            case 'Facebook':
            case 'Google Chrome':
            case 'Instagram':
            case 'Line':
            case 'LinkedIn':
            case 'Microsoft Edge':
            case 'Mozilla Firefox Focus':
            case 'Naver':
            case 'Opera Touch':
            case 'Pinterest':
            case 'Snapchat':
              promptUserToChangeBrowserSettings(reason)
              break
            default:
              displayAndroidLinkOutView()
              break
          }
        }
      }
    },
    onDetach: () => {
      waitForRealityTexture_ = false
      waitingToHideLoadingScreen_ = false
    },
    onRemove: () => {
      hideLoadingScreenNow()
    },
    onException: (error) => {
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
            const errorElement = document.getElementById('camera_mode_world_tracking_error')
            if (errorElement) {
              errorElement.innerHTML = error.message
              cameraSelectionError_.classList.remove('hidden')

              // Stop camera processing.
              XR8.pause()
              XR8.stop()
            }
            return
          }
        }
      }

      dismissCameraPermissionsPrompt()
      hideLoadingScreenNow()
    },
  })

  const setAppLoadedProvider = (appLoaded) => {
    appLoaded_ = appLoaded
  }

  return {
    pipelineModule,
    showLoading,
    setAppLoadedProvider,
  }
}

const LoadingFactory = () => {
  if (!loadingModule) {
    loadingModule = create()
  }

  return loadingModule
}

module.exports = {
  LoadingFactory,
}
