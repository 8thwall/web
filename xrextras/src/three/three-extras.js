/* globals THREE */

let threeExtras = null

const ThreeExtrasFactory = () => {
  if (threeExtras == null) {
    threeExtras = create()
  }

  return threeExtras
}

const pbrMaterial = ({opacity, tex, metalness, normals, roughness, alpha}) => {
  let texLoader = null
  const props = {}
  if (opacity < 1.0) {
    props.transparent = true
    props.opacity = Math.max(0.0, opacity)
  }
  if (tex) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.map = texLoader.load(tex)
  }
  if (metalness) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.metalnessMap = texLoader.load(metalness)
  }
  if (normals) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.normalMap = texLoader.load(normals)
  }
  if (roughness) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.roughnessMap = texLoader.load(roughness)
  }
  if (alpha) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.alphaMap = texLoader.load(alpha)
  }
  return new THREE.MeshStandardMaterial(props)
}

const basicMaterial = ({opacity, tex, alpha}) => {
  let texLoader = null
  const props = {}
  if (opacity < 1.0) {
    props.transparent = true
    props.opacity = Math.max(0.0, opacity)
  }
  if (tex) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.map = texLoader.load(tex)
  }
  if (alpha) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.alphaMap = texLoader.load(alpha)
  }
  return new THREE.MeshBasicMaterial(props)
}

const videoMaterial = ({opacity, video, alpha}) => {
  let texLoader = null
  const props = {}
  if (opacity < 1.0) {
    props.transparent = true
    props.opacity = Math.max(0.0, opacity)
  }
  if (video) {
    props.map = new THREE.VideoTexture(video)
  }
  if (alpha) {
    texLoader = texLoader || new THREE.TextureLoader()
    props.alphaMap = texLoader.load(alpha)
  }
  return new THREE.MeshBasicMaterial(props)
}

const faceMesh = (modelGeometry, material) => {
  const geometry = new THREE.BufferGeometry()

  // Fill geometry with default vertices.
  const vertices = new Float32Array(modelGeometry.pointsPerDetection * 3)
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

  // Fill geometry with default normals.
  const normals = new Float32Array(modelGeometry.pointsPerDetection * 3)
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))

  // Add the UVs to the geometry.
  const uvs = new Float32Array(modelGeometry.uvs.length * 2)
  for (let i = 0; i < modelGeometry.uvs.length; ++i) {
    uvs[i * 2] = modelGeometry.uvs[i].u
    uvs[i * 2 + 1] = modelGeometry.uvs[i].v
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))

  // Add the indices.
  const indices = new Array(modelGeometry.indices.length * 3)
  for (let i = 0; i < modelGeometry.indices.length; ++i) {
    indices[i * 3] = modelGeometry.indices[i].a
    indices[i * 3 + 1] = modelGeometry.indices[i].b
    indices[i * 3 + 2] = modelGeometry.indices[i].c
  }
  geometry.setIndex(indices)

  const mesh = new THREE.Mesh(geometry, material)

  const show = ({detail}) => {
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

const createCurvedGeometry = (geometry, isFull, userHeight, userWidth) => {
  const length = geometry.arcLengthRadians * (userWidth || 1)
  return new THREE.CylinderGeometry(
    geometry.radiusTop,
    geometry.radiusBottom,
    userHeight ? geometry.height * userHeight : geometry.height,
    50,
    1,
    true,
    (isFull ? 0.0 : (2 * Math.PI - length) / 2) + Math.PI,
    isFull ? 2 * Math.PI : length
  )
}

const createFlatGeometry = (geometry, userHeight, userWidth) => new THREE.PlaneGeometry(
  geometry.scaledWidth * (userWidth || 1), geometry.scaledHeight * (userHeight || 1)
)

const createTargetGeometry = (geometry, isFull, userHeight, userWidth) => {
  switch (geometry.type) {
    case 'FLAT':
      return createFlatGeometry(geometry, userHeight, userWidth)
    case 'CONICAL':
    case 'CYLINDRICAL':
      return createCurvedGeometry(geometry, !!isFull, userHeight, userWidth)
    default:
      return null
  }
}

const create = () => ({
  basicMaterial,
  createTargetGeometry,
  faceMesh,
  pbrMaterial,
  videoMaterial,
})

module.exports = {
  ThreeExtrasFactory,
}
