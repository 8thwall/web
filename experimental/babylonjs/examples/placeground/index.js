const babylonScenePipelineModule = () => {
  const modelRootURL = './'                                 // Directory where 3D model lives
  const modelFile = 'tree.glb'                              // 3D model to spawn at tap
  const startScale = new BABYLON.Vector3(0.01, 0.01, 0.01)  // Initial scale value for our model
  const endScale = new BABYLON.Vector3(0.05, 0.05, 0.05)    // Ending scale value for our model
  const animationMillis = 750                               // Animate over 0.75 seconds

  let surface

  // Populates some object into an XR scene and sets the initial camera position.
  const initXrScene = ({ scene, camera }) => {
    console.log('initXrScene')

    const directionalLight = new BABYLON.DirectionalLight("DirectionalLight", new BABYLON.Vector3(0, -1, 1), scene)
    directionalLight.intensity = 1.0

    const ground = BABYLON.Mesh.CreatePlane('ground', 100, scene)
    ground.rotation.x = Math.PI / 2
    ground.material = new BABYLON.StandardMaterial("groundMaterial", scene)
    ground.material.alpha = 0
    surface = ground

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position = new BABYLON.Vector3(0,3,5)
  }

  const placeObjectTouchHandler = (e) => {
    // console.log('placeObjectTouchHandler')
    // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
    // AR camera to the position specified by XrController.updateCameraProjectionMatrix() above.
    if (e.touches.length == 2) {
      XR.XrController.recenter()
    }

    if (e.touches.length > 2) {
      return
    }

    // If the canvas is tapped with one finger and hits the "surface", spawn an object.
    const {scene} = Babylonjs.xrScene()

    const pickResult = scene.pick(e.touches[0].clientX, e.touches[0].clientY)
    if (pickResult.hit && pickResult.pickedMesh == surface) {

      const gltf = BABYLON.SceneLoader.LoadAssetContainer(
        modelRootURL,
        modelFile,
        scene,
        function (container) {  // onSuccess
          const scale = Object.assign({}, startScale)
          const yRot = Math.random() * 360
          for (i = 0; i < container.meshes.length; i++) {
            container.meshes[i]._position.x = pickResult.pickedPoint.x
            container.meshes[i]._position.z = pickResult.pickedPoint.z
            container.meshes[i]._rotation.y = yRot
            container.meshes[i]._scaling.x = scale.x
            container.meshes[i]._scaling.y = scale.y
            container.meshes[i]._scaling.z = scale.z
          }
          // Adds all elements to the scene
          container.addAllToScene()

          new TWEEN.Tween(scale)
          .to(endScale, animationMillis)
          .easing(TWEEN.Easing.Elastic.Out) // Use an easing function to make the animation smooth.
          .onUpdate(() => { 
            for (i = 0; i < container.meshes.length; i++) {
              container.meshes[i]._scaling.x = scale.x
              container.meshes[i]._scaling.y = scale.y
              container.meshes[i]._scaling.z = scale.z
            }
          })
          .start() // Start the tween immediately.
        },
        function (xhr) { //onProgress
          console.log(`${(xhr.loaded / xhr.total * 100 )}% loaded`)
        },
        function (error) { //onError
          console.log('Error loading model')
        },
      )
    }
  }

  return {
    // Pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: 'babylonjs-placeground',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // BabylonJS scene to be ready before we can access it to add content. It was created in
    // Babylonjs.pipelineModule()'s onStart method.
    onStart: ({canvas, canvasWidth, canvasHeight}) => {
      const {scene, camera} = Babylonjs.xrScene()  // Get the scene from Babylon.

      initXrScene({ scene, camera }) // Add objects to the scene and set starting camera position.
      
      canvas.addEventListener('touchstart', placeObjectTouchHandler, true)  // Add touch listener.

      // Enable TWEEN animations.
      animate()
      function animate(time) {
        requestAnimationFrame(animate)
        TWEEN.update(time)
      }

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.rotationQuaternion,
      })
    },
  }
}
const onxrloaded = () => {
  XR.addCameraPipelineModules([  // Add camera pipeline modules.
    // Existing pipeline modules.
    XR.GlTextureRenderer.pipelineModule(),       // Draws the camera feed.
    Babylonjs.pipelineModule(),                  // Creates a BabylonJS AR Scene.
    XR.XrController.pipelineModule(),            // Enables SLAM tracking.
    XRExtras.AlmostThere.pipelineModule(),       // Detects unsupported browsers and gives hints.
    XRExtras.FullWindowCanvas.pipelineModule(),  // Modifies the canvas to fill the window.
    XRExtras.Loading.pipelineModule(),           // Manages the loading screen on startup.
    XRExtras.RuntimeError.pipelineModule(),      // Shows an error image on runtime error.
    // Custom pipeline modules.
    babylonScenePipelineModule(),
  ])

  // Open the camera and start running the camera run loop.
  XR.run({canvas: document.getElementById('renderCanvas'), webgl2: false})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
