require('!style-loader!css-loader!../fonts/fonts.css')
require('!style-loader!css-loader!./almost-there-module.css')

const html = require('./almost-there-module.html')

let almostThereModule = null

const AlmostThereFactory = () => {
  if (!almostThereModule) {
    almostThereModule = create()
  }

  return almostThereModule
}

function create() {
  let shown = false
  const showId = id => {
    document.getElementById(id).classList.remove('hidden')
  }

  const showAlmostThere = () => {
    const e = document.createElement('template')
    e.innerHTML = html.trim()
    const rootNode = e.content.firstChild
    document.getElementsByTagName('body')[0].appendChild(rootNode)

    const redirectUrl = window.location.href
    const redirectLinks = rootNode.querySelectorAll('.desktop-home-link')
    for (let i = 0; i < redirectLinks.length; i++) {
      redirectLinks[i].textContent = redirectUrl
    }

    const reasons = XR.XrDevice.incompatibleReasons()
    const details = XR.XrDevice.incompatibleReasonDetails()
    const device = XR.XrDevice.deviceEstimate()

    for (let r of reasons) {
      switch (r) {
        case XR.XrDevice.IncompatibilityReasons.UNSUPPORTED_BROWSER:
          if (device.os == 'iOS') {
            if (details.inAppBrowserType == 'Safari') {
              showId('error_msg_open_in_safari')
              showId('apple_open_safari_hint')
              return
            } else if (details.inAppBrowserType == 'Ellipsis') {
              showId('error_msg_open_in_safari')
              showId('apple_tap_to_open_safari_hint')
              return
            }
          }
        default:
          break;
      }
    }

    if (device.os == 'iOS') {
      showId('error_msg_apple_almost_there')
      return
    }

    if (device.os == 'Android') {
      showId('error_msg_android_almost_there')
      return
    }

    showId('error_msg_device')
  }

  const checkCompatibility = () => {
    if (shown) {
      return false
    }

    if (XR.XrDevice.isDeviceBrowserCompatible()) {
      // Everything is ok.
      return true
    }

    showAlmostThere()
    shown = true

    XR.pause()
    XR.stop()
    return false
  }

  const pipelineModule = () => {
    return {
      name: 'almostthere',
      onCameraStatusChange: () => {
        if (!checkCompatibility()) {
          // Throwing an error here allows other pipeline modules to react in their onException
          // methods.
          throw Error('Device or browser incompatible with XR.')
        }
      },
      onException: () => {
        checkCompatibility()
      },
    }
  }

  return {
    pipelineModule,
    checkCompatibility,
  }
}

module.exports = {
  AlmostThereFactory,
}
