// Copyright (c) 2018 8th Wall, Inc.

const onxrloaded = () => {
  const url = document.getElementById('url')
  const canvas = document.getElementById('camerafeed')
  url.lastSeen = 0

  // Update the size of the camera feed canvas to fill the screen.
  const fillScreenWithCanvas = ({orientation}) => {
    const ww = window.innerWidth
    const wh = window.innerHeight

    // Wait for orientation change to take effect before handline resize.
    if (((orientation == 0 || orientation == 180) && ww > wh)
      || ((orientation == 90 || orientation == -90) && wh > ww)) {
      window.requestAnimationFrame(() => fillScreenWithCanvas({orientation}))
      return
    }

    // Set the canvas geometry to the new window size.
    canvas.width = ww * window.devicePixelRatio
    canvas.height = wh * window.devicePixelRatio
  }

  // Set the initial canvas geometry.
  fillScreenWithCanvas({orientation: window.orientation})

  // Add an existing camera pipeline module to draw the camera feed.
  XR.addCameraPipelineModule(XR.GlTextureRenderer.pipelineModule())

  // Add a custom pipeline module to access a UInt8Array with a black-and-white reduced resolution
  // copy of the image feed in the onProcessCpu camera lifecycle method.
  XR.addCameraPipelineModule(
    XR.CameraPixelArray.pipelineModule({ luminance: true, maxDimension: 640 }))

  // Add a custom pipeline module to detect QR codes and update the display.
  XR.addCameraPipelineModule({
    name: 'scanresult',

    onProcessCpu: ({processGpuResult}) => {
      // Check whether there is any data ready to process.
      const {camerapixelarray} = processGpuResult
      if (!camerapixelarray || !camerapixelarray.pixels) {
        return
      }

      // Get pointers to the pixel data and image geometry from the CameraPixelArray camera pipeline
      // module.
      const { rows, cols, pixels } = camerapixelarray

      // Set input variables on the global qrcode object before calling process.
      window.qrcode.width = cols
      window.qrcode.height = rows
      window.qrcode.grayscale = () => {return pixels}

      let foundText
      try {
        // Scan the image for a QR code.
        foundText = window.qrcode.process()
      } catch (e) {
        // jsqrcode throws erros when qr codes are not found in an image.
      }

      return foundText ? {found: true, foundText} : {found: false}
    },

    onUpdate: ({processCpuResult}) => {
      const {scanresult} = processCpuResult
      if (!scanresult) {
        return
      }

      if (scanresult.found) {
        url.innerHTML = `<u>${scanresult.foundText}</u>`
        url.href = scanresult.foundText
        url.lastSeen = Date.now()
      } else if (Date.now() - url.lastSeen > 5000) {
        url.innerHTML = 'Scanning for QR Code...'
        url.href = ''
      }
    },

    onDeviceOrientationChange: ({orientation}) => {
      fillScreenWithCanvas({orientation})
    },
  })

  const navigateToFoundUrl = () => {
    if (url.href && url.href.startsWith('http')) {
      XR.pause()
      url.innerHTML = `Navigating to ${url.href}`
      window.location.href = url.href
    }
  }

  // Navigate to the URL that was detected.
  window.addEventListener('touchstart', navigateToFoundUrl)

  // Request camera permissions and run the camera.
  XR.run({canvas})
}

// Wait until the XR javascript has loaded before making XR calls.
window.onload = () => {
  if (window.XR) {
    onxrloaded()
  } else {
    window.addEventListener('xrloaded', onxrloaded)
  }
}
