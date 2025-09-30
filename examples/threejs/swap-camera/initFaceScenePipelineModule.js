// Builds a scene object with a mesh, an occluder, and manages state updates to
// each component.
const buildHead = (modelGeometry) => {
  // head is anchored to the face.
  const head = new THREE.Object3D()
  head.visible = false

  // headMesh draws content on the face.
  const headMesh = XRExtras.ThreeExtras.faceMesh(
    modelGeometry,
    XRExtras.ThreeExtras.basicMaterial({
      tex: './assets/face-alpha.png',
      opacity: 0.8,
      alpha: './assets/face-alpha.png',
    })
  )
  head.add(headMesh.mesh)

  // Add occluder.
  const loader = new THREE.GLTFLoader()
  loader.load('./assets/head-occluder.glb', (occluder) => {
    occluder.scene.scale.set(1.1, 1.1, 1.4)
    occluder.scene.position.set(-0.02, 0, 0.25)
    occluder.scene.traverse((node) => {
      if (node.isMesh) {
        const mat = new THREE.MeshStandardMaterial()
        mat.colorWrite = false
        node.material = mat
      }
    })
    head.add(occluder.scene)
  })
  // Update geometry on each frame with new info from the face controller.
  const show = (event) => {
    const {transform, attachmentPoints} = event.detail
    // Update the overall head position.
    head.position.copy(transform.position)
    head.setRotationFromQuaternion(transform.rotation)
    head.scale.set(transform.scale, transform.scale, transform.scale)
    // Update the nose position.
    // noseAttachment.position.copy(attachmentPoints.noseBridge.position)
    // Update the face mesh.
    headMesh.show(event)
    head.visible = true
  }
  // Hide all objects.
  const hide = () => {
    head.visible = false
    headMesh.hide()
  }
  return {
    object3d: head,
    show,
    hide,
  }
}
// Build a pipeline module that initializes and updates the three.js scene based on facecontroller
// events.
const initFaceScenePipelineModule = () => {
  // Start loading mesh url early.
  let canvas_
  let modelGeometry_
  let head_
  // init is called by onAttach and by facecontroller.faceloading. It needs to be called by both
  // before we can start.
  const init = ({canvas, detail}) => {
    if (head_) {
      return
    }
    canvas_ = canvas_ || canvas
    modelGeometry_ = modelGeometry_ || detail
    if (!(canvas_ && modelGeometry_)) {
      return
    }
    // Get the 3js scene from XR
    const {scene} = XR8.Threejs.xrScene()

    // sets render sort order to the order of objects added to scene (for alpha rendering).
    THREE.WebGLRenderer.sortObjects = false

    // add lights.
    const targetObject = new THREE.Object3D()
    targetObject.position.set(0, 0, -1)
    scene.add(targetObject)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.castShadow = true
    directionalLight.position.set(0, 0.25, 0)
    directionalLight.target = targetObject
    scene.add(directionalLight)

    const bounceLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.5)
    scene.add(bounceLight)

    // head_ is anchored to the face.
    head_ = buildHead(modelGeometry_)
    scene.add(head_.object3d)

    // prevent scroll/pinch gestures on canvas.
    canvas_.addEventListener('touchmove', event => event.preventDefault())
  }
  const onDetach = () => {
    canvas_ = null
    modelGeometry_ = null
  }
  const show = event => head_.show(event)
  const hide = () => head_.hide()
  return {
    name: 'facescene',
    onAttach: init,
    onDetach,
    listeners: [
      {event: 'facecontroller.faceloading', process: init},
      {event: 'facecontroller.facefound', process: show},
      {event: 'facecontroller.faceupdated', process: show},
      {event: 'facecontroller.facelost', process: hide},
    ],
  }
}
export {initFaceScenePipelineModule}
