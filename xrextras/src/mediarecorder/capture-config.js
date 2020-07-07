/* globals XR8 */

const currentConfig = {
  enableEndCard: true,
  footerImageUrl: 'https://cdn.8thwall.com/web/img/almostthere/v2/poweredby-horiz-white-2.svg',
}

const internalConfig = {}

let waitingOnXr = false

let loadedWatermarkUrl

const updateWatermarkImage = () => {
  const newImageUrl = internalConfig.watermarkImageUrl
  if (newImageUrl === loadedWatermarkUrl) {
    return
  }

  loadedWatermarkUrl = newImageUrl

  if (!loadedWatermarkUrl) {
    internalConfig.watermarkImage = null
    return
  }

  const img = document.createElement('img')

  img.onload = () => {
    internalConfig.watermarkImage = img
  }

  img.onerror = () => {
    console.error(`Failed to load image from ${img.src}`)
    internalConfig.watermarkImage = null
  }

  img.setAttribute('crossorigin', 'anonymous')
  img.setAttribute('src', loadedWatermarkUrl)
}

const updateConfig = () => {
  XR8.MediaRecorder.configure(currentConfig)
}

const internalKeys = new Set([
  'watermarkImageUrl', 'watermarkMaxWidth', 'watermarkMaxHeight', 'watermarkLocation',
  'fileNamePrefix',
])

const configure = (config = {}) => {
  Object.keys(config).forEach((key) => {
    const value = config[key]
    if (value === undefined) {
      return
    }

    if (internalKeys.has(key)) {
      internalConfig[key] = value
    } else {
      currentConfig[key] = value
    }
  })

  updateWatermarkImage()

  if (window.XR8) {
    updateConfig()
  } else if (!waitingOnXr) {
    waitingOnXr = true
    window.addEventListener('xrloaded', updateConfig, {once: true})
  }
}

const getConfig = () => internalConfig

export {
  configure,
  getConfig,
}
