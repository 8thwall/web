// Copyright (c) 2018 8th Wall, Inc.

const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.FullWindowCanvas.pipelineModule(),   // Modifies the canvas to fill the window.
    XR.GlTextureRenderer.pipelineModule(),  // Draws the camera feed.
  ])

  // Request camera permissions and run the camera.
  XR.run({canvas: document.getElementById('camerafeed')})
}

// Wait until the XR javascript has loaded before making XR calls.
window.onload = () => {window.XR ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)}
