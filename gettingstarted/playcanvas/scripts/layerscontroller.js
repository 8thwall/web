/*jshint esversion: 6, asi: true, laxbreak: true*/

// layerscontroller.js: Opens the browser's web camera and runs AR. Attach this to an entity in the
// PlayCanvas scene.

var layerscontroller = pc.createScript('layerscontroller')

const PLAYCANVAS_LAYER_NAMES = ["Sky"]
const INVERT_SKY_MASK = false;
const EDGE_SMOOTHNESS = 0.5;

layerscontroller.prototype.initialize = function () {
  // Tell LayersController to compute the sky layer and configures LayersController with the default values.
  XR8.LayersController.configure({ layers: { sky: { invertLayerMask: INVERT_SKY_MASK, edgeSmoothness: EDGE_SMOOTHNESS } } })

  // Find the camera in the PlayCanvas scene, and tie it to the motion of the user's phone in the
  // world.
  const pcCamera = XRExtras.PlayCanvas.findOneCamera(this.entity)

  // After XR has fully loaded, open the camera feed and start displaying AR.
  const runOnLoad = ({ pcCamera, pcApp }, extramodules) => () => {
    const config = {
      // Pass in your canvas name. Typically this is 'application-canvas'.
      canvas: document.getElementById('application-canvas'),
      allowedDevices: XR8.XrConfig.device().ANY,
      // "sky" is the name of the 8th Wall layer. Set the value to the PlayCanvas layer names.
      layers: { "sky": PLAYCANVAS_LAYER_NAMES }
    }
    XR8.PlayCanvas.run({ pcCamera, pcApp }, extramodules, config)
  }

  // While XR is still loading, show some helpful things.
  // Almost There: Detects whether the user's environment can support WebAR, and if it doesn't,
  // shows hints for how to view the experience.
  // Loading: shows prompts for camera permission and hides the scene until it's ready for display.
  // Runtime Error: If something unexpected goes wrong, display an error screen.
  XRExtras.Loading.showLoading({
    onxrloaded: runOnLoad({ pcCamera, pcApp: this.app }, [
      // Optional modules that developers may wish to customize or theme.
      XR8.LayersController.pipelineModule(),       // Runs Sky Effects.
      XR8.XrController.pipelineModule(),           // Enables SLAM tracking. This is optional and not needed for Sky Effects.
      XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
      XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
      XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    ])
  })
}
