// Made with teamwork between 8i and 8thWall, 2019
const applicationName = "8thWall-8i"
const version = "0.1"

/*
 * URL's to other holograms (update the "assetFile" variable below)
 *
 * Alpaca:
 * https://cdn.8thwall.com/web/assets/8i/Web600_ANIMALS2-S16-T02-SOf1187029.hvrs
 *
 * Fire Breather:
 * https://d24wgmntpybhqp.cloudfront.net/artists/Burdetta%20Jackson/hvrs/FloodGates_S21A_T08_Web600_20190219_180912.hvrs
 *
 * Yoga:
 * https://d24wgmntpybhqp.cloudfront.net/artists/Marie%20Grujicic/hvrs/OdysseyInce_S15D_T02_Web600.hvrs
 *
 * Person (default):
 * https://cdn.8thwall.com/web/assets/8i/Odyssey_S46B_T01_Web600_20181107_111442.hvrs
*/

// Hologram to display:
const assetFile = "https://cdn.8thwall.com/web/assets/8i/Odyssey_S46B_T01_Web600_20181107_111442.hvrs"

const floorImage = "./img/floor_logo_cropped.png"

let theScene = null
let theRenderer = null
let theCamera = null
let thePlayer = null
let theActor = null
let theAsset = null
let theViewport = null

const clock = new THREE.Clock()

//8i logic for setting up rendering the asset within the viewport
const onEightiInitialise = () => {
  thePlayer = new EightI.Player(theRenderer.context)
  theViewport = new EightI.Viewport()
  theActor = new EightI.Actor()
  let renderMethod = new EightI.RenderMethod("PointSprite")
  theAsset = new EightI.Asset(assetFile)
  theAsset.create()
  theAsset.setLooping(true)
  theActor.setAsset(theAsset)
  theActor.setRenderMethod(renderMethod)
  let transform = new THREE.Matrix4()
  let scale = 0.02
  transform.makeScale(scale, scale, scale)
  theActor.setTransform(transform)
}

// 8i is dependent on Web Assembly to be fast!
const wasmSupported = (() => {
  try {
    if (typeof WebAssembly === "object" && typeof WebAssembly.instantiate === "function") {
      const module = new WebAssembly.Module(Uint8Array.of(0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00))
      if (module instanceof WebAssembly.Module)
        return new WebAssembly.Instance(module) instanceof WebAssembly.Instance
    }
  } catch (e) {
    console.log("error: ", e)
  }
  return false;
})();


// Returns a pipeline module that initializes the threejs scene when the camera feed starts, and
// handles loading of an 8i hologram
const EightIPipelineModule = () => {

  // Populates some object into an XR scene and sets the initial camera position. The scene and
  // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
  const initXrScene = ({scene, camera}) => {

    //Special 8i Stuff
    ENVSummary = JSON.stringify(EightI.Env)
    if (wasmSupported) {
      EightI.Env.registerFileURL("libeighti.wasm", "https://player.8i.com/interface/1.4/libeighti.wasm")
      EightI.Env.registerFileURL("libeighti.wast", "https://player.8i.com/interface/1.4/libeighti.wast")
      EightI.Env.registerFileURL("libeighti.temp.asm.js", "https://player.8i.com/interface/1.4/libeighti.temp.asm.js")
      let script = document.createElement('script')
      script.src = "https://player.8i.com/interface/1.4/libeighti.js"
      document.body.append(script)
      console.log('Web Assembly is available')
    } else {
      console.log('Browser does not support Web Assembly!')
    }

    // Add a floor to the scene
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(floorImage, function(texture) {
      texture.minFilter = THREE.NearestFilter
      texture.magFilter = THREE.NearestFilter

      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true
      })
      const plane = new THREE.PlaneBufferGeometry(1, 1)
      const floor = new THREE.Mesh(plane, material)
      floor.rotation.x = Math.PI * 1.5
      floor.scale.set(10, 10, 10)
      scene.add(floor)
    })

    // Set the initial camera position relative to the scene we just laid out.
    // This must be at a height greater than y=0
    camera.position.set(0, 3, 5)
  }

  const touchHandler = (e) => {
    // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
    // AR camera to the position specified by XrController.updateCameraProjectionMatrix() above.
    if (e.touches.length == 2) {
      XR8.XrController.recenter()
    }
  }

  return {
    // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: '8thWall-8i',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart: ({canvas, canvasWidth, canvasHeight}) => {

      // Get the 3js scene from xr3js.
      const {scene, camera, renderer} = XR8.Threejs.xrScene()

      theScene = scene
      theRenderer = renderer
      theRenderer.context.getExtension('WEBGL_debug_renderer_info')
      theCamera = camera

      initXrScene({ scene, camera }) // Add objects to the scene and set starting camera position.

      canvas.addEventListener('touchstart', touchHandler, true)  // Add touch listener.

      try {
        EightI.Env.initialise(applicationName, version, onEightiInitialise);
      }
      catch(err) {
        console.log(err)
      }

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR8.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    },
    // onUpdate is called once per camera loop prior to render.
    onUpdate: () => {
      //8i Logic
      theCamera.updateMatrixWorld();
      theCamera.matrixWorldInverse.getInverse(theCamera.matrixWorld);
      theRenderer.clear(true,true,true)
    },
    onRender: () => {
      // If everything is loaded correctly, begin 8i render loop
      if (thePlayer && theActor && theActor.asset){
        EightI.Env.update()
        // Update asset.
        const assetState = theAsset.getState();

        //Play 8i asset when ready
        if(!assetState.isInitialising() && !assetState.isPlaying()) {
          theAsset.play()
        }

        theAsset.update(clock.getElapsedTime());

        // Update viewport: 8i renders in a viewport layer on top of the scene, not in the actual scene.
        // It it important that the viewport is the same size as the scene canvas
        theViewport.setDimensions(0, 0,
          window.innerWidth * window.devicePixelRatio,
          window.innerHeight * window.devicePixelRatio)

        theViewport.setViewMatrix(theCamera.matrixWorldInverse)
        theViewport.setProjMatrix(theCamera.projectionMatrix)

        // Render EightI content
        thePlayer.willRender(theActor, theViewport)
        thePlayer.prepareRender()
        thePlayer.render(theActor, theViewport)

        theRenderer.state.reset()
        theRenderer.render(theScene, theCamera)
      }
    },
  }
}

const onxrloaded = () => {
  XR8.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR8.GlTextureRenderer.pipelineModule(),      // Draws the camera feed.
    XR8.Threejs.pipelineModule(),                // Creates a ThreeJS AR Scene.
    XR8.XrController.pipelineModule(),           // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    EightIPipelineModule(),
  ])

  // Open the camera and start running the camera run loop.
  XR8.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
