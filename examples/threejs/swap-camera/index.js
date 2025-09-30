// Copyright (c) 2025 8th Wall, Inc.
//
// app.js is the main entry point for your 8th Wall app. Code here will execute after head.html
// is loaded, and before body.html is loaded.

import {initWorldScenePipelineModule} from './initWorldScenePipelineModule.js'
import {initFaceScenePipelineModule} from './initFaceScenePipelineModule.js'

let isFront = true
const swapCamera = () => {
  XR8.stop()

  if (isFront) {
    // remove face tracking pipeline module
    XR8.removeCameraPipelineModules(['facecontroller', 'facescene'])
    //  add world tracking pipeline module
    XR8.addCameraPipelineModule(XR8.XrController.pipelineModule())
    XR8.addCameraPipelineModule(initWorldScenePipelineModule())
    // run the 8th wall engine using the back camera
    XR8.run({canvas: document.getElementById('camerafeed'), cameraConfig: {direction: XR8.XrConfig.camera().BACK}})
  } else {
    // configure face tracking
    XR8.FaceController.configure({
      meshGeometry: [XR8.FaceController.MeshGeometry.FACE],
      coordinates: {
        mirroredDisplay: true,
        axes: 'RIGHT_HANDED',
      },
    })
    // remove world tracking pipeline module
    XR8.removeCameraPipelineModules(['reality', 'worldscene'])
    // add face tracking pipeline module
    XR8.addCameraPipelineModule(XR8.FaceController.pipelineModule())
    XR8.addCameraPipelineModule(initFaceScenePipelineModule())
    // run the 8th wall engine using the front camera
    XR8.run({canvas: document.getElementById('camerafeed'), cameraConfig: {direction: XR8.XrConfig.camera().FRONT}})
  }
  isFront = !isFront
}

const onxrloaded = () => {
    XR8.FaceController.configure({
    meshGeometry: [XR8.FaceController.MeshGeometry.FACE],
    coordinates: {
      mirroredDisplay: true,
      axes: 'RIGHT_HANDED',
    },
  })

  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.
    XR8.FaceController.pipelineModule(),
    window.LandingPage.pipelineModule(),         // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    initFaceScenePipelineModule(),  // Sets up the threejs camera and scene content.
  ])

  XR8.addCameraPipelineModule({
    name: 'request-gyro',
    requiredPermissions: () => ([XR8.XrPermissions.permissions().DEVICE_ORIENTATION]),
  })

  // Swap camera when button is clicked
  const btn = document.getElementById('swap-btn')
  btn.addEventListener('click', swapCamera)

  // Open the camera and start running the camera run loop.
  const canvas = document.getElementById('camerafeed')
  XR8.run({canvas, cameraConfig: {direction: XR8.XrConfig.camera().FRONT}})
}

window.XR8 ? onxrloaded() : window.addEventListener('xrloaded', onxrloaded)
