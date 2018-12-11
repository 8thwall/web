// Copyright (c) 2018 8th Wall, Inc.

const onxrloaded = () => {
  const canvas = document.getElementById('camerafeed')

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

  // Add a custom pipeline module to update the canvas size if the phone is rotated.
  XR.addCameraPipelineModule({
    name: 'camerafeed',
    onDeviceOrientationChange: ({orientation}) => {
      fillScreenWithCanvas({orientation})
    },
  })

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
