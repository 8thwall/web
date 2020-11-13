/* globals BABYLON TWEEN XR8 XRExtras */

const modelRootURL = './'                               // Directory where 3D model lives
const modelFile = 'tree.glb'                            // 3D model to spawn at tap
const startScale = new BABYLON.Vector3(0.1, 0.1, -0.1)  // Initial scale value for our model
const endScale = new BABYLON.Vector3(2.0, 2.0, -2.0)    // Ending scale value for our model
const animationMillis = 750                             // Animate over 0.75 seconds

let surface, engine, scene, camera

// Populates some object into an XR scene and sets the initial camera position.
const initXrScene = () => {
  const directionalLight = new BABYLON.DirectionalLight(
    'DirectionalLight',
    new BABYLON.Vector3(0, -1, 1),
    scene
  )
  directionalLight.intensity = 1.0

  const ground = BABYLON.Mesh.CreatePlane('ground', 100, scene)
  ground.rotation.x = Math.PI / 2
  ground.material = new BABYLON.StandardMaterial('groundMaterial', scene)
  ground.material.diffuseColor = BABYLON.Color3.Purple()
  ground.material.alpha = 0
  surface = ground

  // Set the initial camera position relative to the scene we just laid out. This must be at a
  // height greater than y=0.
  camera.position = new BABYLON.Vector3(0, 3, -5)
}

const placeObjectTouchHandler = (e) => {
  // console.log('placeObjectTouchHandler')
  // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
  // AR camera to the position specified by XrController.updateCameraProjectionMatrix() above.
  if (e.touches.length === 2) {
    XR8.XrController.recenter()
  }

  if (e.touches.length > 2) {
    return
  }

  // If the canvas is tapped with one finger and hits the "surface", spawn an object.
  const pickResult = scene.pick(e.touches[0].clientX, e.touches[0].clientY)
  if (pickResult.hit && pickResult.pickedMesh === surface) {
    BABYLON.SceneLoader.ImportMesh(
      '',
      modelRootURL,
      modelFile,
      scene,
      (newMeshes) => {  // onSuccess
        const mesh = newMeshes[0]
        mesh.scaling = new BABYLON.Vector3(startScale.x, startScale.y, startScale.z)

        const yRot = Math.random() * Math.PI
        mesh.position = new BABYLON.Vector3(pickResult.pickedPoint.x, 0, pickResult.pickedPoint.z)
        mesh.rotation = new BABYLON.Vector3(0, yRot, 0)

        const scale = Object.assign({}, startScale)
        new TWEEN.Tween(scale)
          .to(endScale, animationMillis)
          .easing(TWEEN.Easing.Elastic.Out)  // Use an easing function to make the animation smooth.
          .onUpdate(() => {
            mesh.scaling.x = scale.x
            mesh.scaling.y = scale.y
            mesh.scaling.z = scale.z
          })
          .start()  // Start the tween immediately.
      },
      (xhr) => {  // onProgress
        console.log(`${(xhr.loaded / xhr.total * 100)}% loaded`)
      },
      () => {  // onError
        console.log('Error loading model')
      }
    )
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

  canvas.addEventListener('touchstart', placeObjectTouchHandler, true)  // Add touch listener.

  engine.runRenderLoop(() => {
    // Enable TWEEN animations.
    TWEEN.update(performance.now())
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
