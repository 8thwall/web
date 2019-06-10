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
  let customRedirectUrl
  const showId = id => {
    document.getElementById(id).classList.remove('hidden')
  }

  const showAlmostThere = () => {
    const e = document.createElement('template')
    e.innerHTML = html.trim()
    const rootNode = e.content.firstChild
    document.getElementsByTagName('body')[0].appendChild(rootNode)

    const redirectUrl = customRedirectUrl || window.location.href
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
        case XR.XrDevice.IncompatibilityReasons.MISSING_WEB_ASSEMBLY:
          if (device.os == 'iOS') {
            showId('error_msg_web_assembly_ios')
            return
          }
          if (device.os == 'Android') {
            showId('error_msg_web_assembly_android')
            return
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

    // Desktop: help our user with a qr code
    showId('error_msg_device')
    const scriptElem = document.createElement("script")
    scriptElem.type = "text/javascript"
    scriptElem.src = "https://cdn.8thwall.com/web/share/qrcode8.js"
    scriptElem.onload = () => {
      document.getElementById('qrcode').innerHTML = qrcode8.generateQRHtml(redirectUrl)
    }
    document.getElementById("almostthereContainer").appendChild(scriptElem)
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

  const configure = ({url}) => {
    if (url !== undefined) {
      customRedirectUrl = url
    }
  }

  return {
    pipelineModule,
    checkCompatibility,
    configure,
  }
}

module.exports = {
  AlmostThereFactory,
}
