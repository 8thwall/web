import type {ComponentDefinition} from 'aframe'

declare const THREE: any

const handAnchorComponent: ComponentDefinition = {
  init() {
    let id_ = null

    const show = ({detail}) => {
      if (id_ && detail.id !== id_) {
        return
      }
      id_ = detail.id
      const {position, rotation, scale} = detail.transform
      this.el.object3D.position.copy(position)
      this.el.object3D.quaternion.copy(rotation)
      this.el.object3D.scale.set(scale, scale, scale)
      this.el.object3D.visible = true
    }

    const hide = () => {
      this.el.object3D.visible = false
      id_ = null
    }

    this.el.sceneEl.addEventListener('xrhandfound', show)
    this.el.sceneEl.addEventListener('xrhandupdated', show)
    this.el.sceneEl.addEventListener('xrhandlost', hide)
  },
}

const handAttachmentComponent: ComponentDefinition = {
  schema: {
    'point': {type: 'string', default: 'palm'},
    'pointType': {type: 'string', default: 'center'},
  },
  init() {
    let id_ = null
    let position

    const show = ({detail}) => {
      if (id_ && detail.id !== id_) {
        return
      }

      id_ = detail.id
      const apt = detail.attachmentPoints[this.data.point]
      if (!apt) {
        // eslint-disable-next-line no-console
        console.error(`Invalid attachmentPoint ${this.data.point}`)
        return
      }

      const {rotation} = apt

      // set position based on pointType parameter
      const {pointType} = this.data
      if (pointType === 'center') {
        position = apt.position
      } else if (pointType === 'inner') {
        position = apt.innerPoint
      } else if (pointType === 'outer') {
        position = apt.outerPoint
      } else {
        // eslint-disable-next-line no-console
        console.error('Please input a valid pointType, options are: center, inner, outer')
        return
      }

      this.el.object3D.position.copy(position)
      this.el.object3D.quaternion.copy(rotation)

      this.el.object3D.visible = true
    }

    const hide = () => {
      this.el.object3D.visible = false
      id_ = null
    }

    this.el.sceneEl.addEventListener('xrhandfound', show)
    this.el.sceneEl.addEventListener('xrhandupdated', show)
    this.el.sceneEl.addEventListener('xrhandlost', hide)
  },
}

const handMesh = (modelGeometry, material, wireframe, uvOrientation) => {
  let handKind = 2
  const geometry = new THREE.BufferGeometry()

  // Fill geometry with default vertices.
  const vertices = new Float32Array(modelGeometry.pointsPerDetection * 3)
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Fill geometry with default normals.
  const normals = new Float32Array(modelGeometry.pointsPerDetection * 3)
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))

  // Create and set UVs based on uvOrientation

  // Instantiate both left and right hand indices as we use them at runtime
  const rightIndices = new Array(modelGeometry.rightIndices.length * 3)
  for (let i = 0; i < modelGeometry.rightIndices.length; ++i) {
    rightIndices[i * 3] = modelGeometry.rightIndices[i].a
    rightIndices[i * 3 + 1] = modelGeometry.rightIndices[i].b
    rightIndices[i * 3 + 2] = modelGeometry.rightIndices[i].c
  }

  const leftIndices = new Array(modelGeometry.leftIndices.length * 3)
  for (let i = 0; i < modelGeometry.leftIndices.length; ++i) {
    leftIndices[i * 3] = modelGeometry.leftIndices[i].a
    leftIndices[i * 3 + 1] = modelGeometry.leftIndices[i].b
    leftIndices[i * 3 + 2] = modelGeometry.leftIndices[i].c
  }

  // Construct UVs based on hand mesh orientation
  let uv
  if (uvOrientation === 'left') {
    const leftUvs = new Float32Array(modelGeometry.leftUvs.length * 2)
    for (let i = 0; i < modelGeometry.pointsPerDetection; i++) {
      leftUvs[2 * i] = modelGeometry.leftUvs[i].u
      leftUvs[2 * i + 1] = modelGeometry.leftUvs[i].v
    }
    const leftUvBuffer = new THREE.BufferAttribute(leftUvs, 2)

    uv = leftUvBuffer
    geometry.setIndex(leftIndices)
  } else if (uvOrientation === 'right') {
    const rightUvs = new Float32Array(modelGeometry.rightUvs.length * 2)
    for (let i = 0; i < modelGeometry.pointsPerDetection; i++) {
      rightUvs[2 * i] = modelGeometry.rightUvs[i].u
      rightUvs[2 * i + 1] = modelGeometry.rightUvs[i].v
    }
    const rightUvBuffer = new THREE.BufferAttribute(rightUvs, 2)

    uv = rightUvBuffer
    geometry.setIndex(rightIndices)
  }
  geometry.setAttribute('uv', uv)

  if (wireframe) {
    material.wireframe = true
  }

  const mesh = new THREE.Mesh(geometry, material)

  const show = ({detail}) => {
    // set indices based on handKind
    if (handKind !== detail.handKind) {
      handKind = detail.handKind
      if (handKind === 1) {
        mesh.geometry.setIndex(leftIndices)
      } else {
        mesh.geometry.setIndex(rightIndices)
      }
    }

    // Update vertex positions.
    for (let i = 0; i < detail.vertices.length; ++i) {
      vertices[i * 3] = detail.vertices[i].x
      vertices[i * 3 + 1] = detail.vertices[i].y
      vertices[i * 3 + 2] = detail.vertices[i].z
    }
    mesh.geometry.attributes.position.needsUpdate = true

    // Update vertex normals.
    for (let i = 0; i < detail.normals.length; ++i) {
      normals[i * 3] = detail.normals[i].x
      normals[i * 3 + 1] = detail.normals[i].y
      normals[i * 3 + 2] = detail.normals[i].z
    }
    mesh.geometry.attributes.normal.needsUpdate = true

    // make it so frustum doesn't cull mesh when hand is close to camera
    mesh.frustumCulled = false
    mesh.visible = true
  }

  const hide = () => {
    mesh.visible = false
  }

  return {
    mesh,
    show,
    hide,
  }
}

const handMeshComponent: ComponentDefinition = {
  schema: {
    'material-resource': {type: 'string'},
    'wireframe': {type: 'boolean', default: true},
    'uv-orientation': {type: 'string', default: 'right'},
  },
  init() {
    this.handMesh = null

    const beforeRun = ({detail}) => {
      let material

      if (this.el.getAttribute('material')) {
        material = this.el.components.material.material
      } else if (this.data['material-resource']) {
        material = this.el.sceneEl.querySelector(this.data['material-resource']).material
      } else {
        material = new THREE.MeshBasicMaterial(
          {color: '#7611B6', opacity: 0.5, transparent: true}
        )
      }

      this.handMesh = handMesh(detail, material, this.data.wireframe, this.data['uv-orientation'])
      this.el.setObject3D('mesh', this.handMesh.mesh)

      this.el.emit('model-loaded')
    }

    const show = (event) => {
      this.handMesh.show(event)
      this.el.object3D.visible = true
    }

    const hide = () => {
      this.handMesh.hide()
      this.el.object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrhandloading', beforeRun)
    this.el.sceneEl.addEventListener('xrhandfound', show)
    this.el.sceneEl.addEventListener('xrhandupdated', show)
    this.el.sceneEl.addEventListener('xrhandlost', hide)
  },
  update() {
    if (!this.handMesh) {
      return
    }

    let material
    if (this.el.getAttribute('material')) {
      material = this.el.components.material.material
    } else if (this.data['material-resource']) {
      material = this.el.sceneEl.querySelector(this.data['material-resource']).material
    } else {
      material = new THREE.MeshBasicMaterial({color: '#7611B6', opacity: 0.5, transparent: true})
    }
    this.handMesh.mesh.material = material
  },
}

const handOccluder = (modelGeometry, material, adjustment) => {
  let handKind = 2
  const geometry = new THREE.BufferGeometry()

  // Fill geometry with default vertices.
  const vertices = new Float32Array(modelGeometry.pointsPerDetection * 3)
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Fill geometry with default normals.
  const normals = new Float32Array(modelGeometry.pointsPerDetection * 3)
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))

  // Add the indices.
  const rightIndices = new Array(modelGeometry.rightIndices.length * 3)
  for (let i = 0; i < modelGeometry.rightIndices.length; ++i) {
    rightIndices[i * 3] = modelGeometry.rightIndices[i].a
    rightIndices[i * 3 + 1] = modelGeometry.rightIndices[i].b
    rightIndices[i * 3 + 2] = modelGeometry.rightIndices[i].c
  }
  const leftIndices = new Array(modelGeometry.leftIndices.length * 3)
  for (let i = 0; i < modelGeometry.leftIndices.length; ++i) {
    leftIndices[i * 3] = modelGeometry.leftIndices[i].a
    leftIndices[i * 3 + 1] = modelGeometry.leftIndices[i].b
    leftIndices[i * 3 + 2] = modelGeometry.leftIndices[i].c
  }

  geometry.setIndex(rightIndices)

  const mesh = new THREE.Mesh(geometry, material)

  const show = ({detail}) => {
    // Update vertex indices based on handKind
    if (detail.handKind !== handKind) {
      handKind = detail.handKind
      if (handKind === 1) {
        mesh.geometry.setIndex(leftIndices)
      } else {
        mesh.geometry.setIndex(rightIndices)
      }
    }

    // Update vertex positions.
    for (let i = 0; i < detail.vertices.length; ++i) {
      vertices[i * 3] = detail.vertices[i].x
      vertices[i * 3 + 1] = detail.vertices[i].y
      vertices[i * 3 + 2] = detail.vertices[i].z
    }
    mesh.geometry.attributes.position.needsUpdate = true

    // Update vertex normals.
    for (let i = 0; i < detail.normals.length; ++i) {
      normals[i * 3] = detail.normals[i].x
      normals[i * 3 + 1] = detail.normals[i].y
      normals[i * 3 + 2] = detail.normals[i].z
    }
    mesh.geometry.attributes.normal.needsUpdate = true

    // Update vertex positions along the normal to make occluder smaller and prevent z-fighting
    for (let i = 0; i < detail.vertices.length; ++i) {
      const normal = detail.normals[i]

      // Shift the position along the normal.
      const shiftAmount = adjustment  // Adjust this value as needed
      vertices[i * 3] += normal.x * shiftAmount
      vertices[i * 3 + 1] += normal.y * shiftAmount
      vertices[i * 3 + 2] += normal.z * shiftAmount
    }
    mesh.geometry.attributes.position.needsUpdate = true

    // make it so frustum doesn't cull mesh when hand is close to camera
    mesh.frustumCulled = false
    mesh.visible = true
  }

  const hide = () => {
    mesh.visible = false
  }

  return {
    mesh,
    show,
    hide,
  }
}

const handOccluderComponent: ComponentDefinition = {
  schema: {
    'show': {type: 'boolean', default: false},
    'adjustment': {type: 'number', default: 0.002},
  },
  init() {
    this.handOccluder = null

    const beforeRun = ({detail}) => {
      const material = new THREE.MeshStandardMaterial(
        {color: '#F5F5F5', transparent: false, colorWrite: false}
      )

      this.handOccluder = handOccluder(detail, material, this.data.adjustment)
      this.el.setObject3D('mesh', this.handOccluder.mesh)

      this.el.emit('model-loaded')
    }

    const show = (event) => {
      if (this.data.show) {
        this.handOccluder.mesh.material.colorWrite = true
      } else {
        this.handOccluder.mesh.material.colorWrite = false
      }
      this.handOccluder.show(event)
      this.el.object3D.visible = true
    }

    const hide = () => {
      this.handOccluder.hide()
      this.el.object3D.visible = false
    }

    this.el.sceneEl.addEventListener('xrhandloading', beforeRun)
    this.el.sceneEl.addEventListener('xrhandfound', show)
    this.el.sceneEl.addEventListener('xrhandupdated', show)
    this.el.sceneEl.addEventListener('xrhandlost', hide)
  },
}

export {
  handAnchorComponent,
  handAttachmentComponent,
  handMeshComponent,
  handOccluderComponent,
}
