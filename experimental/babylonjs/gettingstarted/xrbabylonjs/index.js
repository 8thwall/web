const babylonGettingStartedPipelineModule = () => {
  let box

  // Populates some object into an XR scene and sets the initial camera position.
  const initXrScene = ({ scene, camera }) => {

    // const directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, 1, 0), scene)
    const directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 1), scene)
    directionalLight.intensity = 1.0

    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere1", {diameter: 1}, scene)
    sphere.material = new BABYLON.StandardMaterial("sphereMaterial", scene)
    sphere.material.diffuseColor = BABYLON.Color3.Red()
    sphere.position = new BABYLON.Vector3(1, 0.5, 0)

    const cone = BABYLON.MeshBuilder.CreateCylinder("cone1", {height: 1, diameterBottom: 1, diameterTop: 0}, scene)
    cone.material = new BABYLON.StandardMaterial("coneMaterial", scene)
    cone.material.diffuseColor = BABYLON.Color3.Green()
    cone.position = new BABYLON.Vector3(-1, 0.5, 0.5)

    box = BABYLON.MeshBuilder.CreateBox("box", {size: 0.5}, scene)
    box.material = new BABYLON.StandardMaterial("coneMaterial", scene)
    box.material.diffuseColor = BABYLON.Color3.Teal()
    box.position = new BABYLON.Vector3(0, 0.25, -1)
    box.rotation.y = 45

    const ground = BABYLON.MeshBuilder.CreatePlane('ground', {size: 4}, scene)
    ground.rotation.x = Math.PI / 2
    ground.material = new BABYLON.StandardMaterial("groundMaterial", scene)
    ground.material.diffuseColor = BABYLON.Color3.Purple()
    ground.material.alpha = 0.5
    surface = ground

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position = new BABYLON.Vector3(0, 3, 5)
  }

  return {
    // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: 'gettingstarted-babylonjs',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // BabylonJS scene to be ready before we can access it to add content. It was created in
    // Babylonjs.pipelineModule()'s onStart method.
    onStart: () => {
      const {scene, camera} = Babylonjs.xrScene()  // Get the scene from Babylon.

      initXrScene({ scene, camera }) // Add objects to the scene and set starting camera position.

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.rotationQuaternion,
      })
    },
    onUpdate: () => {
      // Rotate the box on every frame
      box.rotation.y += 0.02
    }
  }
}

const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    Babylonjs.pipelineModule(),               // Creates a BabylonJS AR Scene.
    XR.XrController.pipelineModule(),            // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    babylonGettingStartedPipelineModule(),
  ])

  const canvas = document.getElementById('renderCanvas')
  // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
  // ar camera to the position specified by XrController.updateCameraProjectionMatrix() above.
  canvas.addEventListener(
    'touchstart', (e) => { e.touches.length == 2 && XR.XrController.recenter() }, true)

  // Open the camera and start running the camera run loop.
  XR.run({canvas, webgl2: false})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
