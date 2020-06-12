/*jshint esversion: 6, asi: true, laxbreak: true*/

var FaceController = pc.createScript('face-controller');

FaceController.attributes.add('material', {
    type: 'asset',
    assetType: 'material'
});

FaceController.prototype.initialize = function() {
  const pcCamera = XRExtras.PlayCanvas.findOneCamera(this.entity)
      
  let mesh = null
  
  // Fires when loading begins for additional face AR resources.
  this.app.on('xr:faceloading', ({maxDetections, pointsPerDetection, indices, uvs}) => {
    const node = new pc.GraphNode();
    const material = this.material.resource;
    mesh = pc.createMesh(
      this.app.graphicsDevice,
      new Array(pointsPerDetection * 3).fill(0.0),  // setting filler vertex positions
      {
        uvs: uvs.map((uv) => [uv.u, uv.v]).flat(),
        indices: indices.map((i) => [i.a, i.b, i.c]).flat()
      }
    );

    const meshInstance = new pc.MeshInstance(node, mesh, material);
    const model = new pc.Model();
    model.graph = node;
    model.meshInstances.push(meshInstance);
    this.entity.model.model = model;
  }, {})

  
  // Fires when all face AR resources have been loaded and scanning has begun.
  this.app.on('xr:facescanning', ({maxDetections, pointsPerDetection, indices, uvs}) => {
  }, {})

  
  // Fires when a face first found
  this.app.on('xr:facefound', ({id, transform, attachmentPoints, vertices, normals}) => {
  }, {})

  
  // Fires when a face is lost
  this.app.on('xr:facelost', ({id}) => {
  }, {})

  
  // Fires when a face is subsequently found.
  this.app.on('xr:faceupdated', ({id, transform, attachmentPoints, vertices, normals}) => {
    const {position, rotation, scale, scaledDepth, scaledHeight, scaledWidth} = transform
    
    this.entity.setPosition(position.x, position.y, position.z);
    this.entity.setLocalScale(scale, scale, scale)
    this.entity.setRotation(rotation.x, rotation.y, rotation.z, rotation.w)

    // Set mesh vertices in local space
    mesh.setPositions(vertices.map((vertexPos) => [vertexPos.x, vertexPos.y, vertexPos.z]).flat())
    // Set vertex normals
    mesh.setNormals(normals.map((normal) => [normal.x, normal.y, normal.z]).flat())
    mesh.update()
  }, {})

  // After XR has fully loaded, open the camera feed and start displaying AR.
  const runOnLoad = ({pcCamera, pcApp}, extramodules) => () => {
    const config = {allowedDevices: XR8.XrConfig.device().ANY,
                    cameraConfig: {direction: XR8.XrConfig.camera().FRONT}}
    XR8.PlayCanvas.runFaceEffects({pcCamera, pcApp}, extramodules, config)
    XR8.FaceController.configure({
      meshGeometry: ['face'],
      coordinates: {
        axes: 'RIGHT_HANDED',
        mirroredDisplay: true,
      }
    })
  }
  
  XRExtras.Loading.showLoading({onxrloaded: runOnLoad({pcCamera, pcApp: this.app}, [
    XRExtras.Loading.pipelineModule(),  // Manages the loading screen on startup.
  ])})
};
