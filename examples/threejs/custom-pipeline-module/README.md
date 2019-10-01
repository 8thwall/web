# Custom Three.js pipeline module

8th Wall Web provides a built-in pipeline module that interfaces with the three.js environment and lifecycle.

For advanced users who would like to customize their three.js configuration, the example `customThreejsPipelineModule.js` more-or-less replicates what `XR.Threejs.pipelineModule()` does and can be used as a starting point for customization.

You would use this custom module instead of `XR.Threejs.pipelineModule()`

## Example

index.html:

```html
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>8th Wall Web: custom three.js</title>
    <link rel="stylesheet" type="text/css" href="index.css">

    <!-- THREE.js must be supplied -->
    <script src="//cdnjs.cloudflare.com/ajax/libs/three.js/106/three.min.js"></script>

    <!-- XR Extras - provides utilities like load screen, almost there, and error handling.
         See github.com/8thwall/web/xrextras -->
    <script src="//cdn.8thwall.com/web/xrextras/xrextras.js"></script>

    <!-- 8thWall Web - Replace the app key here with your own app key -->
    <script async src="//apps.8thwall.com/xrweb?appKey=XXXXXX"></script>

    <!-- custom three.js module -->
    <script src="customThreejsPipelineModule.js"></script>

    <!-- client code -->
    <script src="index.js"></script>
  </head>

  <body>
    <canvas id="camerafeed"></canvas>
  </body>
</html>
```

index.js:

```javascript
...
...

const myThreejsModule = customThreejsPipelineModule()

const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    myThreejsModule, // Custom three.js pipeline module. Replaces XR.Threejs.pipelineModule()
    XR.XrController.pipelineModule(),            // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Other custom pipeline modules.
    myScenePipelineModule(),
  ])

  // Open the camera and start running the camera run loop.
  XR.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
```
