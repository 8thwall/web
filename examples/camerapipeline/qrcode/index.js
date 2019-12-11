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
        const {rows, cols} = processGpuResult.camerapixelarray
        window.qrcode.width = cols
        window.qrcode.height = rows
        window.qrcode.grayscale = () => { return processGpuResult.camerapixelarray.pixels }
        const res = window.qrcode.process()  // Scan the image for a QR code.
        res.points = res.points.map(
          ({x: x_, y: y_}) => { return {x: x_ / (cols - 1), y: y_ / (rows - 1)}})
        return res
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
  const canvas2d_ = document.getElementById('overlay2d')
  const ctx_ = canvas2d_.getContext('2d')
  let lastSeen = 0
  let canvas_

  // if the window is touched anywhere, navigate to the URL that was detected.
  window.addEventListener('touchstart', () => {
    if (!url.href || !url.href.startsWith('http')) { return }
    XR8.pause()
    url.innerHTML = `Navigating to ${url.href}`
    window.location.href = url.href
  })

  // Keep the 2d drawing canvas in sync with the camera feed.
  const onCanvasSizeChange = () => {
    canvas2d_.width = canvas_.clientWidth
    canvas2d_.height = canvas_.clientHeight
    ctx_.scale(canvas_.width / canvas_.clientWidth, canvas_.height / canvas_.clientHeight)
  }

  const drawCircle = (pt) => {
    ctx_.beginPath();
    ctx_.arc(pt.x, pt.y, 9 /* radius */, 0, 2 * Math.PI, false);
    ctx_.fillStyle = '#AD50FF'
    ctx_.fill();
    ctx_.strokeStyle = '#7611B7'
    ctx_.lineWidth = 2
    ctx_.stroke();
  }

  const mapToTextureViewport = (pt, vp) => {
    return { x: pt.x * vp.width + vp.offsetX, y: pt.y * vp.height + vp.offsetY}
  }

  return {
    name: 'qrdisplay',
    onStart: ({canvas}) => {
      url.style.visibility = 'visible'  // Show the card that displays the url.
      canvas_ = canvas
    },
    onUpdate: ({processGpuResult, processCpuResult}) => {
      if (!processCpuResult.qrprocess) { return }

      canvas2d_.width = canvas2d_.width; // Clears canvas
      const {found, foundText, points} = processCpuResult.qrprocess
      const {viewport} = processGpuResult.gltexturerenderer

      // Toggle display text based on whether a qrcode result was found.
      if (found) {
        url.innerHTML = `<u>${foundText}</u>`
        url.href = foundText
        lastSeen = Date.now()
        points.forEach((pt) => { drawCircle(mapToTextureViewport(pt, viewport)) })
      } else if (Date.now() - lastSeen > 5000) {
        url.innerHTML = 'Scanning for QR Code...'
        url.href = ''
      }
    },
    onCanvasSizeChange,
  }
}

const onxrloaded = () => {
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.CameraPixelArray.pipelineModule({ luminance: true, maxDimension: 640 }),  // Provides pixels.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    qrprocessPipelineModule(),              // Scans the image for QR Codes
    qrdisplayPipelineModule(),              // Displays the result of QR Code scanning.
  ])

  // Request camera permissions and run the camera.
  XR8.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
