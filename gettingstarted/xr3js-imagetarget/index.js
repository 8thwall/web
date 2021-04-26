// Copyright (c) 2018 8th Wall, Inc.
const imageFramePipelineModule = () => {
  const LIGHT_PURPLE = 0xAD50FF
  const CHERRY = 0xDD0065
  const MINT = 0x00EDAF
  const MANGO = 0xFFC828
  const GRAY = 0x8083A2
  const DARK_GRAY = 0x464766

  const allFrames = {}
  let scene

  // Renders one side of a picture frame rectangle.
  const frameEdge = (x, y, w1, h1, w2, h2) => {
    const edge = new THREE.Group()
    const big = new THREE.Mesh(new THREE.CubeGeometry(w1, h1, 0.008),
      new THREE.MeshBasicMaterial({color: DARK_GRAY}))
    big.position.set(x, y, 0)
    const small = new THREE.Mesh(new THREE.CubeGeometry(w2, h2, 0.012),
      new THREE.MeshBasicMaterial({color: GRAY}))
    small.position.set(x, y, 0)
    edge.add(big)
    edge.add(small)
    return edge
  }

  // Renders a picture frame rectangle.
  const frameBorder = (scaledWidth, scaledHeight) => {
    const border = new THREE.Group()
    border.add(frameEdge(-scaledWidth / 2, 0, 0.05, scaledHeight + 0.05, 0.03, scaledHeight + 0.03))
    border.add(frameEdge(scaledWidth / 2, 0, 0.05, scaledHeight + 0.05, 0.03, scaledHeight + 0.03))
    border.add(frameEdge(0, -scaledHeight / 2, scaledWidth + 0.05, 0.05, scaledWidth + 0.03, 0.03))
    border.add(frameEdge(0, scaledHeight / 2, scaledWidth + 0.05, 0.05, scaledWidth + 0.03, 0.03))
    return border
  }

  // Adds a tinted-glass effect.
  const framePane = (scaledWidth, scaledHeight) => {
    const material = new THREE.MeshBasicMaterial({color: LIGHT_PURPLE})
    material.alphaMap = new THREE.DataTexture(new Uint8Array([0, 127, 0]), 1, 1, THREE.RGBFormat)
    material.alphaMap.needsUpdate = true
    material.transparent = true
    return new THREE.Mesh(new THREE.CubeGeometry(scaledWidth, scaledHeight, 0.001), material)
  }

  // Adds an oriented axis.
  const axis = () => {
    const axes = new THREE.Group()
    const axisLength = 0.2
    const cylinder = new THREE.CylinderBufferGeometry(0.01, 0.01, axisLength, 32)
    const xAxis = new THREE.Mesh(cylinder, new THREE.MeshBasicMaterial({color: MANGO}))
    const yAxis = new THREE.Mesh(cylinder, new THREE.MeshBasicMaterial({color: CHERRY}))
    const zAxis = new THREE.Mesh(cylinder, new THREE.MeshBasicMaterial({color: MINT}))
    xAxis.rotateZ(Math.PI / 2)
    xAxis.position.set(axisLength / 2, 0, 0)
    yAxis.position.set(0, axisLength / 2, 0)
    zAxis.rotateX(Math.PI / 2)
    zAxis.position.set(0, 0, axisLength / 2)
    axes.add(xAxis)
    axes.add(yAxis)
    axes.add(zAxis)
    return axes
  }

  // Constructs a picture frame out of threejs primitives.
  const buildPrimitiveFrame = ({scaledWidth, scaledHeight}) => {
    const frame = new THREE.Group()
    frame.add(frameBorder(scaledWidth, scaledHeight))
    frame.add(framePane(scaledWidth, scaledHeight))
    frame.add(axis())
    scene.add(frame)
    return frame
  }

  // Updates the position of a picture frame that covers an image target.
  const showImageFrame = ({detail}) => {
    let frame = allFrames[detail.name]
    if (!frame) {
      frame = buildPrimitiveFrame(detail)
      allFrames[detail.name] = frame
    }
    frame.position.copy(detail.position)
    frame.quaternion.copy(detail.rotation)
    frame.scale.set(detail.scale, detail.scale, detail.scale)
    frame.visible = true
  }

  // Hides the image frame when the target is no longer detected.
  const hideImageFrame = ({detail}) => {
    allFrames[detail.name].visible = false
  }

  // Grab a handle to the threejs scene and set the camera position on pipeline startup.
  const onStart = ({canvasWidth, canvasHeight}) => {
    // Get the 3js sceen from xr3js.
    const {camera} = XR8.Threejs.xrScene()
    scene = XR8.Threejs.xrScene().scene

    // Set the initial camera position relative to the scene we just laid out. This must be at a
    // height greater than y=0.
    camera.position.set(0, 3, 0)

    // Sync the xr controller's 6DoF position and camera paremeters with our scene.
    XR8.XrController.updateCameraProjectionMatrix({
      origin: camera.position,
      facing: camera.quaternion,
    })
  }

  return {
    // Camera pipeline modules need a name. It can be whatever you want but must be unique within
    // your app.
    name: 'targetframes',

    // onStart is called once when the camera feed begins. In this case, we need to wait for the
    // XR8.Threejs scene to be ready before we can access it to add content. It was created in
    // XR8.Threejs.pipelineModule()'s onStart method.
    onStart,

    // Listeners are called right after the processing stage that fired them. This guarantees that
    // updates can be applied at an appropriate synchronized point in the rendering cycle.
    listeners: [
      {event: 'reality.imagefound', process: showImageFrame},
      {event: 'reality.imageupdated', process: showImageFrame},
      {event: 'reality.imagelost', process: hideImageFrame},
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
    imageFramePipelineModule(),                  // Draws a frame around detected image targets.
  ])

  // Open the camera and start running the camera run loop.
  XR8.run({canvas: document.getElementById('camerafeed')})
}

// Show loading screen before the full XR library has been loaded.
const load = () => { XRExtras.Loading.showLoading({onxrloaded}) }
window.onload = () => { window.XRExtras ? load() : window.addEventListener('xrextrasloaded', load) }
