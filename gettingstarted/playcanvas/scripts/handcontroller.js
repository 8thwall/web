/*jshint esversion: 6, asi: true, laxbreak: true*/

// handcontroller.js: Opens the browser's web camera and runs AR with Hand Tracking.
// Attach this to an entity in the PlayCanvas scene.

var HandController = pc.createScript('handController');

HandController.attributes.add('coverimage', {
  type: 'asset',
  assetType: 'texture'
});

// initialize code called once per entity
HandController.prototype.initialize = function() {
  XR8.HandController.configure({
    coordinates: {
      axes: 'RIGHT_HANDED',
      mirroredDisplay: false,
    }
  })

  const pcCamera = XRExtras.PlayCanvas.findOneCamera(this.entity)

  let box_ = null

  let mesh_ = null

  let handKind_ = 2
  let rightIndices_ = null
  let leftIndices_ = null

  // Fires when loading begins for additional hand AR resources.
  this.app.on('xr:handloading', ({maxDetections, pointsPerDetection, rightIndices, leftIndices}) => {
    const node = new pc.GraphNode();

    console.log('number of verts')
    console.log(pointsPerDetection)
    console.log('number of triangles')
    console.log(rightIndices.length)

    rightIndices_ = rightIndices.map((i) => [i.a, i.b, i.c]).flat()
    leftIndices_ = leftIndices.map((i) => [i.a, i.b, i.c]).flat()

    // const material = this.material.resource;
    mesh_ = pc.createMesh(
      this.app.graphicsDevice,
      new Array(pointsPerDetection * 3).fill(0.0),  // setting filler vertex positions
      {
        indices: rightIndices,
        // normals: new Array(pointsPerDetection * 3).fill(0.0),
      }
    );

    const material = new pc.StandardMaterial()
    const meshInstance = new pc.MeshInstance(node, mesh_, material)
    const model = new pc.Model()
    model.graph = node
    model.meshInstances.push(meshInstance)
    this.entity.model.model = model

    box_ = this.app.root.findByName('Box')
    const scale = 0.05
    box_.setLocalScale(scale, scale, scale)
    this.entity.addChild(box_)
  }, {})

  // Fires when all hand AR resources have been loaded and scanning has begun.
  this.app.on('xr:handscanning', ({maxDetections, pointsPerDetection, indices, uvs}) => {
  }, {})

  // Fires when a hand first found
  this.app.on('xr:handfound', ({id, transform, attachmentPoints, vertices, normals}) => {
    // console.log('hand found')
    this.entity.enabled = true
  }, {})

  // Fires when a hand is lost
  this.app.on('xr:handlost', ({id}) => {
    // console.log('hand lost')
    this.entity.enabled = false
  }, {})

  // Fires when a hand is subsequently found.
  this.app.on('xr:handupdated', ({id, handKind, transform, attachmentPoints, vertices, normals}) => {
    if (handKind_ !== handKind) {
      handKind_ = handKind
      if (handKind_ === 1) {
        mesh_.setIndices(leftIndices_)
      } else {
        mesh_.setIndices(rightIndices_)
      }
    }

    const {position, rotation, scale} = transform
    this.entity.setPosition(position.x, position.y, position.z)
    this.entity.setLocalScale(scale, scale, scale)
    this.entity.setRotation(rotation.x, rotation.y, rotation.z, rotation.w)

    const palmPt = attachmentPoints['palm']

    box_.setLocalPosition(palmPt.position.x, palmPt.position.y, palmPt.position.z)
    box_.translateLocal(0, 0, .05)
    box_.setLocalRotation(palmPt.rotation.x, palmPt.rotation.y, palmPt.rotation.z, palmPt.rotation.w)


    // Set mesh vertices in local space
    mesh_.setPositions(vertices.map((vertexPos) => [vertexPos.x, vertexPos.y, vertexPos.z]).flat())
    // Set vertex normals
    mesh_.setNormals(normals.map((normal) => [normal.x, normal.y, normal.z]).flat())
    mesh_.update()
  }, {})

  // After XR has fully loaded, open the camera feed and start displaying AR.
  const runOnLoad = ({pcCamera, pcApp}, extramodules) => () => {
    const config = {
        allowedDevices: XR8.XrConfig.device().ANY,
        cameraConfig: {direction: XR8.XrConfig.camera().FRONT},
        // Pass in your canvas name. Typically this is 'application-canvas'.
        canvas: document.getElementById('application-canvas')
    }

    XRExtras.MediaRecorder.initRecordButton()  // Adds record button
    XRExtras.MediaRecorder.initMediaPreview()  // Adds media preview and share
    XRExtras.MediaRecorder.configure({
      coverImageUrl: this.coverimage.getFileUrl(),
      shortLink: 'playcanv.as/xxx',
    })

    XR8.PlayCanvas.run({pcCamera, pcApp}, extramodules, config)
  }

  XRExtras.Loading.showLoading({onxrloaded: runOnLoad({pcCamera, pcApp: this.app}, [
    XRExtras.Loading.pipelineModule(),      // Manages the loading screen on startup.
    XR8.CanvasScreenshot.pipelineModule(),  // Required for photo capture
    XR8.HandController.pipelineModule(),    // Runs Hand Tracking.
  ])})
};
