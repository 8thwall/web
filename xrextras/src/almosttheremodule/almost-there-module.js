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
  let rootNode = null
  let customRedirectUrl
  const showId = id => {
    document.getElementById(id).classList.remove('hidden')
  }

  const hideAlmostThere = () => {
    if (!rootNode) {
      return
    }
    rootNode.parentNode.removeChild(rootNode)
    rootNode = null
  }

  const showAlmostThere = () => {
    const e = document.createElement('template')
    e.innerHTML = html.trim()
    rootNode = e.content.firstChild
    document.getElementsByTagName('body')[0].appendChild(rootNode)

    const redirectUrl = customRedirectUrl || window.location.href
    const redirectLinks = rootNode.querySelectorAll('.desktop-home-link')
    for (let i = 0; i < redirectLinks.length; i++) {
      redirectLinks[i].textContent = redirectUrl
    }

    const reasons = XR8.XrDevice.incompatibleReasons()
    const details = XR8.XrDevice.incompatibleReasonDetails()
    const device = XR8.XrDevice.deviceEstimate()

    const headerImgSrc = document.querySelector('meta[name="og:image"]').content
    if (headerImgSrc == null) {
      headerImgSrc = 'https://cdn.8thwall.com/web/img/almostthere/v2/safari-fallback.png'
    }
    Array.from(document.querySelectorAll('.app-header-img')).forEach(img => img.src = headerImgSrc)

    const cBtn = document.getElementById('error_copy_link_btn')
    cBtn.addEventListener("click", () => {
      var dummy = document.createElement('input')
      document.body.appendChild(dummy)
      dummy.value = redirectUrl
      dummy.select()
      document.execCommand('copy')
      document.body.removeChild(dummy)

      cBtn.innerHTML = "Copied!"
      cBtn.classList.add('error-copy-link-copied')
    })

    if (reasons.includes(XR8.XrDevice.IncompatibilityReasons.UNSUPPORTED_BROWSER)) {
      if (device.os === 'iOS') {
        if (details.inAppBrowserType == 'Safari') {
          showId('error_msg_open_in_safari')
          showId('apple_open_safari_hint')
        } else {
          switch (details.inAppBrowser) {
            case 'Instagram':
            case 'Facebook':
            case 'WeChat':
            case 'LinkedIn':
            case 'QQ':
            case 'Sino Weibo':
              showId('error_msg_open_in_safari')
              showId('error_text_header_top')
              showId('top_corner_open_safari')
              break;
            case 'Facebook Messenger':
            case 'Kakao Talk':
            case 'Naver':
              showId('error_msg_open_in_safari')
              showId('error_text_header_bottom')
              showId('bottom_corner_open_safari')
              break;
            case 'Line':
            case 'Mozilla Firefox Focus':
              showId('error_msg_open_in_safari')
              showId('error_text_header_top')
              showId('top_close_open_safari')
              break;
            case 'Snapchat':
              showId('error_msg_open_in_safari')
              showId('error_text_header_bottom')
              showId('snap_arrow')
              showId('snap_circle')
              break;
            default:
              showId('error_unknown_webview')
              break;
          }
        }
        return
      }
    }

    if (reasons.includes(XR8.XrDevice.IncompatibilityReasons.MISSING_WEB_ASSEMBLY)) {
      if (device.os == 'iOS') {
        showId('error_msg_web_assembly_ios')
        return
      }
      if (device.os == 'Android') {
        showId('error_msg_web_assembly_android')
        return
      }
    }

    if (device.os == 'iOS') {
      showId('error_unknown_webview')
      showId('error_text_header_unknown')
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
    scriptElem.src = "https://cdn.8thwall.com/web/share/qrcode8-1.1.0.js"
    scriptElem.onload = () => {
      document.getElementById('qrcode').innerHTML = qrcode8.generateQR8Svg(redirectUrl, 250, 80)
    }
    document.getElementById("almostthereContainer").appendChild(scriptElem)
  }

  const checkCompatibility = () => {
    if (rootNode) {
      return false
    }

    if (XR8.XrDevice.isDeviceBrowserCompatible()) {
      // Everything is ok.
      return true
    }

    showAlmostThere()

    XR8.pause()
    XR8.stop()
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

  const configure = ({ url }) => {
    if (url !== undefined) {
      customRedirectUrl = url
    }
  }

  return {
    pipelineModule,
    checkCompatibility,
    configure,
    hideAlmostThere,
  }
}

module.exports = {
  AlmostThereFactory,
}
