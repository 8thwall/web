// Copyright (c) 2018 8th Wall, Inc.

// Define a custom pipeline module. This module scans the camera feed for qr codes, and makes the
// result available to other modules in onUpdate. It requires that the CameraPixelArray module is
// installed and configured to provide a luminance (black and white) image.
const qrprocessPipelineModule = () => {
  return {
    name: 'qrprocess',
    onProcessCpu: ({processGpuResult}) => {
      // Check whether there is any data ready to process.
      if (!processGpuResult.camerapixelarray || !processGpuResult.camerapixelarray.pixels) {
        return {found: false}
      }

      try {
        // Set input variables on the global qrcode object before calling qrcode.process().
        window.qrcode.width = processGpuResult.camerapixelarray.cols
        window.qrcode.height = processGpuResult.camerapixelarray.rows
        window.qrcode.grayscale = () => { return processGpuResult.camerapixelarray.pixels }
        return {found: true, foundText: window.qrcode.process()}  // Scan the image for a QR code.
      } catch (e) {
        return {found: false}  // jsqrcode throws errors when qr codes are not found in an image.
      }
    },
  }
}

// Define a custom pipeline module. This module updates UI elements with the result of the QR code
// scanning, and navigates to the found url on any tap to the screen.
const qrdisplayPipelineModule = () => {
  const url = document.getElementById('url')
  let lastSeen = 0

  // if the window is touched anywhere, navigate to the URL that was detected.
  window.addEventListener('touchstart', () => {
    if (!url.href || !url.href.startsWith('http')) { return }
    XR.pause()
    url.innerHTML = `Navigating to ${url.href}`
    window.location.href = url.href
  })

  return {
    name: 'qrdisplay',
    onStart: () => { url.style.visibility = 'visible' },  // Show the card that displays the url.
    onUpdate: ({processCpuResult}) => {
      if (!processCpuResult.qrprocess) { return }

      // Toggle display text based on whether a qrcode result was found.
      if (processCpuResult.qrprocess.found) {
        url.innerHTML = `<u>${processCpuResult.qrprocess.foundText}</u>`
        url.href = processCpuResult.qrprocess.foundText
        lastSeen = Date.now()
      } else if (Date.now() - lastSeen > 5000) {
        url.innerHTML = 'Scanning for QR Code...'
        url.href = ''
      }
    },
  }
}

const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.CameraPixelArray.pipelineModule({ luminance: true, maxDimension: 640 }),  // Provides pixels.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    qrprocessPipelineModule(),              // Scans the image for QR Codes
    qrdisplayPipelineModule(),              // Displays the result of QR Code scanning.
  ])

  // Request camera permissions and run the camera.
  XR.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
