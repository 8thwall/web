// Copyright (c) 2018 8th Wall, Inc.

const onxrloaded = () => {

  // 3D model to spawn at tap
  const modelFile = 'tree.glb'
  
  // Initial scale value for our model
  const startScale = new THREE.Vector3(0.0001, 0.0001, 0.0001)
  // Ending scale value for our model
  const endScale = new THREE.Vector3(0.002, 0.002, 0.002)
  // Animate over 0.75 seconds
  const animationMillis = 750

  let surface

  const raycaster = new THREE.Raycaster()
  const tapPosition = new THREE.Vector2()

  // Instantiate a GLTFLoader.  Make sure your index.html includes a script tag to load GLTFLoader.js
  const loader = new THREE.GLTFLoader()

  // Populates some object into an XR scene and sets the initial camera position. The scene and
  // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
  const initXrScene = ({ scene, camera }) => {

    // Add transparent "ground" plane object.  This will be used for raycasting for object placement
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry( 100, 100, 1, 1 ), 
      new THREE.MeshBasicMaterial( {color: 0xffff00, transparent:true, opacity:0.0, side: THREE.DoubleSide} ) 
    )
    plane.rotateX(- Math.PI / 2)
    plane.position.set(0, 0, 0)
    plane.name = 'ground'
    surface = plane // Save for later raycasting
    scene.add(plane)

    // Add a light to the scene
    const light = new THREE.AmbientLight( 0x404040, 5 ); // soft white light
    scene.add(light)

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 3, 0)
  }

  // Add the XrController pipeline module, which enables 6DoF camera motion estimation.
  XR.addCameraPipelineModule(XR.XrController.pipelineModule())

  // Add a GlTextureRenderer which draws the camera feed to the canvas.
  XR.addCameraPipelineModule(XR.GlTextureRenderer.pipelineModule())

  // Add XR.Threejs which creates a threejs scene, camera, and renderer, and drives the scene camera
  // based on 6DoF camera motion.
  XR.addCameraPipelineModule(XR.Threejs.pipelineModule())

  // Add custom logic to the camera loop. This is done with camera pipeline modules that provide
  // logic for key lifecycle moments for processing each camera frame. In this case, we'll be
  // adding onStart logic for scene initialization, and onUpdate logic for scene updates.
  XR.addCameraPipelineModule({
    // Camera pipeline modules need a name. It can be whatever you want but must be unique within your app.
    name: 'placeground',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR.Threejs scene to be ready before we can access it to add content. It was created in
    // XR.Threejs.pipelineModule()'s onStart method.
    onStart: ({canvasWidth, canvasHeight}) => {
      // Get the 3js sceen from xr3js.
      const {scene, camera} = XR.Threejs.xrScene()

      // Add some objects to the scene and set the starting camera position.
      initXrScene({ scene, camera })

      // Sync the xr controller's 6DoF position and camera paremeters with our scene.
      XR.XrController.updateCameraProjectionMatrix({
        origin: camera.position,
        facing: camera.quaternion,
      })
    },
  })

  document.getElementById('xrweb').addEventListener('touchstart', (e) => { 

    // Call XrController.recenter() when the canvas is tapped with two fingers. This resets the
    // AR camera to the position specified by XrController.updateCameraProjectionMatrix() above.
    if (e.touches.length == 2) { 
      XR.XrController.recenter() 
    }

    // If the canvas is tapped with one finger and hits the "surface", spawn an object
    if (e.touches.length == 1) {

      const {scene, camera} = XR.Threejs.xrScene()

      // calculate tap position in normalized device coordinates (-1 to +1) for both components
      tapPosition.x = ( e.touches[0].clientX / window.innerWidth ) * 2 - 1
      tapPosition.y = - ( e.touches[0].clientY / window.innerHeight ) * 2 + 1


      // Update the picking ray with the camera and tap position
      raycaster.setFromCamera( tapPosition, camera )

      // Raycast against the "surface" object
      const intersects = raycaster.intersectObject( surface )

      if ( intersects.length == 1 && intersects[0].object == surface) {

        const pointX = intersects[0].point.x
        const pointZ = intersects[0].point.z

        // Load a glTF resource
        loader.load(
          // resource URL
          modelFile,
          // called when the resource is loaded - onLoad: 
          function ( gltf ) {
            const scale = { x: startScale.x, y: startScale.y, z: startScale.z }

            const randomYRotation = Math.random() * 360
            gltf.scene.rotation.set(0.0, randomYRotation, 0.0)
            gltf.scene.position.set(pointX, 0.0, pointZ)
            gltf.scene.scale.set(scale.x, scale.y, scale.z)
            scene.add( gltf.scene )

            // See https://github.com/tweenjs/tween.js/ for more info on tween.js
            const tween = new TWEEN.Tween(scale) // Create a new tween that modifies 'scale'.
              .to({ x: endScale.x, y: endScale.y, z: endScale.z}, animationMillis)
              .easing(TWEEN.Easing.Elastic.Out) // Use an easing function to make the animation smooth.
              .onUpdate(function() { // Called after tween.js updates 'scale'.
                // Adjust the scale of our glTF model
                gltf.scene.scale.set(scale.x, scale.y, scale.z)
              })
              .start() // Start the tween immediately.

          },
          // called while loading is progressing - onProgress:
          function ( xhr ) {
            console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' )
          },
          // called when loading has errors - onError:
          function ( error ) {
            console.log( 'An error happened' )
          }
        )
      }
    }
  }, true)

  animate();
  function animate( time ) {
    requestAnimationFrame( animate );
    TWEEN.update( time );
  }

  // Set canvas to be fullscreen
  const canvas = document.getElementById("xrweb");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Open the camera and start running the camera run loop.
  // XR.run({canvas: document.getElementById('xrweb')})
  XR.run({canvas})
}

window.onload = () => {
  if (window.XR) {
    onxrloaded()
  } else {
    window.addEventListener('xrloaded', onxrloaded)
  }
}
