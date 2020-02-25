# XR Extras

This library provides modules that extend the
[Camera Pipeline Module framework](https://docs.8thwall.com/web/#camerapipelinemodule) in
[8th Wall XR](https://8thwall.com/products-web.html) to handle common application needs.

The library is served at
[//cdn.8thwall.com/web/xrextras/xrextras.js](https://cdn.8thwall.com/web/xrextras/xrextras.js), or
can be built from this repository by running

```bash
$ npm install
$ npm run build
```

## Hello World

### Native JS

index.html:

```html
<html>
  <head>
    <title>XRExtras: Camera Pipeline</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">

    <!-- XR Extras - provides utilities like load screen, almost there, and error handling.
         See https://github.com/8thwall/web/tree/master/xrextras/ -->
    <script src="//cdn.8thwall.com/web/xrextras/xrextras.js"></script>

    <!-- 8thWall Web - Replace the app key here with your own app key -->
    <script async src="//apps.8thwall.com/xrweb?appKey=XXXXXXXX"></script>

    <script src="index.js"></script>
  </head>
  <body>
    <canvas id="camerafeed"></canvas>
  </body>
</html>
```

index.js:

```javascript
const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
  ])

  XR.run({canvas: document.getElementById('camerafeed')})   // Request permissions and run camera.
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
```

### AFrame

index.html:

```html
<html>
  <head>
    <title>XRExtras: A-FRAME</title>

    <!-- We've included a slightly modified version of A-Frame, which fixes some polish concerns -->
    <script src="//cdn.8thwall.com/web/aframe/8frame-0.8.2.min.js"></script>

    <!-- XR Extras - provides utilities like load screen, almost there, and error handling.
         See https://github.com/8thwall/web/tree/master/xrextras/ -->
    <script src="//cdn.8thwall.com/web/xrextras/xrextras.js"></script>

    <!-- 8thWall Web - Replace the app key here with your own app key -->
    <script async src="//apps.8thwall.com/xrweb?appKey=XXXXXXXX"></script>
  </head>

  <body>
    <!-- Add the 'xrweb' attribute to your scene to make it an 8th Wall Web A-FRAME scene. -->
    <a-scene
      xrweb
      xrextras-almost-there
      xrextras-loading
      xrextras-runtime-error
      xrextras-tap-recenter>

      <a-camera position="0 8 8"></a-camera>

      <a-entity
        light="type: directional; castShadow: true; intensity: 0.8; shadowCameraTop: 7;
               shadowMapHeight: 1024; shadowMapWidth: 1024;"
        position="1 4.3 2.5">
      </a-entity>

      <a-entity
        light="type: directional; castShadow: false; intensity: 0.5;" position="-0.8 3 1.85">
      </a-entity>

      <a-light type="ambient" intensity="1"></a-light>

      <a-box
        position="-1.7 0.5 -2" rotation="0 45 0" shadow
        material="roughness: 0.8; metalness: 0.2; color: #00EDAF;">
      </a-box>

      <a-sphere
        position="-1.175 1.25 -5.2" radius="1.25" shadow
        material="roughness: 0.8; metalness: 0.2; color: #DD0065;">
      </a-sphere>

      <a-cylinder
        position="2 0.75 -1.85" radius="0.5" height="1.5" shadow
        material="roughness: 0.8; metalness: 0.2; color: #FCEE21;">
      </a-cylinder>

      <a-circle position="0 0 -4" rotation="-90 0 0" radius="4" shadow
        material="roughness: 0.8; metalness: 0.5; color: #AD50FF">
      </a-circle>
    </a-scene>
  </body>
</html>
```

## API

### Pipeline Modules

Quick Reference:

```javascript
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    XRExtras.PwaInstaller.pipelineModule(),      // Displays a prompt to add to home screen.
  ])
```

Pipeline Modules:

* AlmostThere.pipelineModule(): Detects if the user is not on a supported device or browser, and
provides helpful information for how to view the XR experience.
* FullWindowCanvas.pipelineModule(): Makes sure that the camera display canvas fills the full
browser window across device orientation changes, etc.
* Loading.pipelineModule(): Displays a loading overlay and camera permissions prompt while
libraries are loading, and while the camera is starting up.
* RuntimeError.pipelineModule(): Shows an error image when an error occurs at runtime.
* PwaInstaller.pipelineModule(): Displays a prompt to add to home screen.

### AFrame Components

Quick Reference:

```html
    <a-scene
      xrweb
      xrextras-almost-there
      xrextras-loading
      xrextras-runtime-error
      xrextras-tap-recenter>
```

Javascript Functions:

* XRExtras.AFrame.registerXrExtrasComponents(): Registers the XR Extras AFrame components if they
aren't already registered. If AFrame is loaded befor XR Extras, then there is no need to call this
method. In the case that AFrame is loaded late and you need to explicitly register the components,
you can call this method.

AFrame Components:

* xrextras-almost-there: Detects if the user is not on a supported device or browser, and provides
helpful information for how to view the XR experience.
* xrextras-loading: Displays a loading overlay and camera permissions prompt while the scene and
libraries are loading, and while the camera is starting up.
* xrextras-runtime-error: Hides the scene and shows an error image when an error occurs at runtime.
* xrextras-tap-recenter: Calls 'XR.recenter()' when the AFrame scene is tapped.

### Other

Fonts: Provides common .css for fonts used by various modules.

DebugWebViews: Provides utilities for debugging javascript while it runs in browsers embedded in
applications.

Quick Reference:

```html
    <script src="//cdn.8thwall.com/web/xrextras/xrextras.js"></script>
    <script>
      const screenlog = () => {
        window.XRExtras.DebugWebViews.enableLogToScreen()
        console.log('screenlog enabled')
      }
      window.XRExtras ? screenlog() : window.addEventListener('xrextrasloaded', screenlog)
    </script>
```

