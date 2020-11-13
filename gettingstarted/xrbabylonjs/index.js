/* globals BABYLON XR8 XRExtras */

let box, engine, scene, camera

// Populates some object into an XR scene and sets the initial camera position.
const initXrScene = () => {
  const directionalLight = new BABYLON.DirectionalLight(
    'DirectionalLight',
    new BABYLON.Vector3(0, -1, 1),
    scene
  )
  directionalLight.intensity = 1.0

  const sphere = BABYLON.MeshBuilder.CreateSphere('sphere', {diameter: 1}, scene)
  sphere.material = new BABYLON.StandardMaterial('sphereMaterial', scene)
  sphere.material.diffuseColor = BABYLON.Color3.Red()
  sphere.position = new BABYLON.Vector3(1, 0.5, 0)

  const cone = BABYLON.MeshBuilder.CreateCylinder(
    'cone',
    {height: 1, diameterBottom: 1, diameterTop: 0},
    scene
  )
  cone.material = new BABYLON.StandardMaterial('coneMaterial', scene)
  cone.material.diffuseColor = BABYLON.Color3.Green()
  cone.position = new BABYLON.Vector3(-1, 0.5, 0.5)

  const ground = BABYLON.MeshBuilder.CreatePlane('ground', {size: 4}, scene)
  ground.rotation.x = Math.PI / 2
  ground.material = new BABYLON.StandardMaterial('groundMaterial', scene)
  ground.material.diffuseColor = BABYLON.Color3.Purple()
  ground.material.alpha = 0.5
  ground.position = new BABYLON.Vector3(0, 0, 0)

  box = BABYLON.MeshBuilder.CreateBox('box', {size: 0.5}, scene)
  box.material = new BABYLON.StandardMaterial('boxMaterial', scene)
  box.material.diffuseColor = BABYLON.Color3.Teal()
  box.position = new BABYLON.Vector3(0, 0.25, -1)
  box.rotation.y = 45

  // Set the initial camera position relative to the scene we just laid out.
  // This must be at a height greater than y=0.
  camera.position = new BABYLON.Vector3(0, 3, -5)
}

const recenterTouchHandler = (e) => {
  // Call XrController.recenter() when the canvas is tapped with two fingers.
  // This resets the AR camera to the position specified by
  // XrController.updateCameraProjectionMatrix() above.
  if (e.touches.length === 2) {
    XR8.XrController.recenter()
  }
}

const startScene = () => {
  const canvas = document.getElementById('renderCanvas')

  engine = new BABYLON.Engine(canvas, true, {stencil: true, preserveDrawingBuffer: true})
  engine.enableOfflineSupport = false

  scene = new BABYLON.Scene(engine)
  camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, 0), scene)

  initXrScene()  // Add objects to the scene and set starting camera position.

  // Connect the camera to the XR engine and show camera feed
  camera.addBehavior(XR8.Babylonjs.xrCameraBehavior(), true)

  canvas.addEventListener('touchstart', recenterTouchHandler, true)  // Add touch listener.

  engine.runRenderLoop(() => {
    // Animate box rotation
    box.rotation.y += 0.02
    // Render scene
    scene.render()
  })

  window.addEventListener('resize', () => {
    engine.resize()
  })
}

const onxrloaded = () => {
  XR8.addCameraPipelineModules([             // Add camera pipeline modules.
    XRExtras.AlmostThere.pipelineModule(),   // Detects unsupported browsers and gives hints.
    XRExtras.Loading.pipelineModule(),       // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),  // Shows an error image on runtime error.
  ])

  startScene()
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => {
  if (window.XRExtras) {
    load()
  } else {
    window.addEventListener('xrextrasloaded', load)
  }
}
