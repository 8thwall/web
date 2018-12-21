// Copyright (c) 2018 8th Wall, Inc.

const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
  ])

  // Request camera permissions and run the camera.
  XR.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
