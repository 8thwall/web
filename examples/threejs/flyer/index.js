// Copyright (c) 2021 8th Wall, Inc.

/* globals XR8 XRExtras THREE */

const imageTargetPipelineModule = () => {
  const modelFile = 'jellyfish-model.glb'
  const videoFile = 'jellyfish-video.mp4'

  const loader = new THREE.GLTFLoader()  // This comes from GLTFLoader.js.

  let model
  let video, videoObj

  // Populates some object into an XR scene and sets the initial camera position. The scene and
  // camera come from xr3js, and are only available in the camera loop lifecycle onStart() or later.
  const initXrScene = ({scene, camera}) => {
    // create the video element
    video = document.createElement('video')
    video.src = videoFile
    video.setAttribute('preload', 'auto')
    video.setAttribute('loop', '')
    video.setAttribute('muted', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('webkit-playsinline', '')

    const texture = new THREE.VideoTexture(video)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.format = THREE.RGBFormat
    texture.crossOrigin = 'anonymous'

    videoObj = new THREE.Mesh(
      new THREE.PlaneGeometry(0.75, 1),
      new THREE.MeshBasicMaterial({map: texture})
    )
    // Hide video until image target is detected.
    videoObj.visible = false
    scene.add(videoObj)
    video.load()

    // Load 3D model
    loader.load(
      // resource URL
      modelFile,
      // loaded handler
      (gltf) => {
        model = gltf.scene
        scene.add(model)
        // Hide 3D model until image target is detected.
        model.visible = false
      }
    )

    // Add soft white light to the scene.
    // This light cannot be used to cast shadows as it does not have a direction.
    scene.add(new THREE.AmbientLight(0x404040, 5))

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 3, 0)
  }

  // Places content over image target
  const showTarget = ({detail}) => {
    // When the image target named 'model-target' is detected, show 3D model.
    // This string must match the name of the image target uploaded to 8th Wall.
    if (detail.name === 'model-target') {
      model.position.copy(detail.position)
      model.quaternion.copy(detail.rotation)
      model.scale.set(detail.scale, detail.scale, detail.scale)
      model.visible = true
    }
    // When the image target named 'video-target' is detected, play video.
    // This string must match the name of the image target uploaded to 8th Wall.
    if (detail.name === 'video-target') {
      videoObj.position.copy(detail.position)
      videoObj.quaternion.copy(detail.rotation)
      videoObj.scale.set(detail.scale, detail.scale, detail.scale)
      videoObj.visible = true
      video.play()
    }
  }

  // Hides the image frame when the target is no longer detected.
  const hideTarget = ({detail}) => {
    if (detail.name === 'model-target') {
      model.visible = false
    }
    if (detail.name === 'video-target') {
      video.pause()
      videoObj.visible = false
    }
  }

  // Grab a handle to the threejs scene and set the camera position on pipeline startup.
  const onStart = ({canvas}) => {
    const {scene, camera} = XR8.Threejs.xrScene()  // Get the 3js scene from XR

    initXrScene({scene, camera})  // Add content to the scene and set starting camera position.

    // prevent scroll/pinch gestures on canvas
    canvas.addEventListener('touchmove', (event) => {
      event.preventDefault()
    })

    // Sync the xr controller's 6DoF position and camera paremeters with our scene.
    XR8.XrController.updateCameraProjectionMatrix({
      origin: camera.position,
      facing: camera.quaternion,
    })
  }

  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be
    // unique within your app.
    name: 'threejs-flyer',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart,

    // Listeners are called right after the processing stage that fired them. This guarantees that
    // updates can be applied at an appropriate synchronized point in the rendering cycle.
    listeners: [
      {event: 'reality.imagefound', process: showTarget},
      {event: 'reality.imageupdated', process: showTarget},
      {event: 'reality.imagelost', process: hideTarget},
    ],
  }
}

const onxrloaded = () => {
  // If your app only interacts with image targets and not the world, disabling world tracking can
  // improve speed.
  XR8.XrController.configure({disableWorldTracking: true})
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
    imageTargetPipelineModule(),  // Places 3d model and video content over detected image targets.
  ])

  // Open the camera and start running the camera run loop.
  XR8.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
