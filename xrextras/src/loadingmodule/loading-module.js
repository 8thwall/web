/* globals XR8 */

require('!style-loader!css-loader!../fonts/fonts.css')
require('!style-loader!css-loader!./loading-module.css')

const html = require('./loading-module.html')

let loadingModule = null

function create() {
  let rootNode_ = null
  let loadBackground_
  let loadImageContainer_
  let camPermissionsRequest_
  let camPermissionsFailedAndroid_
  let camPermissionsFailedApple_
  let linkOutViewAndroid_
  let copyLinkViewAndroid_
  let userPromptError_
  let motionPermissionsErrorApple_
  let cameraSelectionError_
  let deviceMotionErrorApple_
  let appLoaded_ = () => true
  let numUpdates_ = 0
  let waitingOnReality_ = false
  let needsCookie_ = false
  const ua = navigator.userAgent
  let cancelCameraTimeout

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

  const setRoot = (rootNode) => {
    rootNode_ = rootNode
    loadBackground_ = rootNode_.querySelector('#loadBackground')
    loadImageContainer_ = rootNode_.querySelector('#loadImageContainer')
    camPermissionsRequest_ = document.getElementById('requestingCameraPermissions')
    camPermissionsFailedAndroid_ = document.getElementById('cameraPermissionsErrorAndroid')
    camPermissionsFailedApple_ = document.getElementById('cameraPermissionsErrorApple')
    linkOutViewAndroid_ = document.getElementById('linkOutViewAndroid')
    copyLinkViewAndroid_ = document.getElementById('copyLinkViewAndroid')
    deviceMotionErrorApple_ = document.getElementById('deviceMotionErrorApple')
    userPromptError_ = document.getElementById('userPromptError')
    cameraSelectionError_ = document.getElementById('cameraSelectionWorldTrackingError')
    motionPermissionsErrorApple_ = document.getElementById('motionPermissionsErrorApple')
  }

  const hideLoadingScreenNow = (removeRoot = true) => {
    loadBackground_.classList.add('hidden')
    if (removeRoot && rootNode_.parentNode) {
      rootNode_.parentNode.removeChild(rootNode_)
    }
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
    waitingOnReality_ = true

    if (args && args.onxrloaded) {
      if (window.XR8) {
        args.onxrloaded()
      } else {
        window.addEventListener('xrloaded', args.onxrloaded)
      }
    }
  }

  const checkLoaded = () => {
    if (appLoaded_() && !waitingOnReality_) {
      if (needsCookie_) {
        document.cookie = 'previouslyGotCameraPermission=true;max-age=31536000'
      }
      hideLoadingScreen()
      return
    }
    requestAnimationFrame(() => { checkLoaded() })
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
      if (status === 'requesting') {
        const curBrowser = XR8.XrDevice.deviceEstimate().browser.inAppBrowser
        if (curBrowser) {
          cancelCameraTimeout = setTimeout(() => {
            XR8.pause()
            XR8.stop()
            displayAndroidLinkOutView()
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
        switch (XR8.XrDevice.deviceEstimate().browser.inAppBrowser) {
          case 'Snapchat':
          case 'Sino Weibo':
          case 'Pinterest':
          case 'WeChat':
            displayCopyLinkView()
            break
          case undefined:
            promptUserToChangeBrowserSettings()
            break
          default:
            displayAndroidLinkOutView()
            break
        }
      }
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
            document.getElementById('camera_mode_world_tracking_error').innerHTML = error.message
            cameraSelectionError_.classList.remove('hidden')

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
