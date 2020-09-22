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
  const geometry = new THREE.Geometry()

  // fill the geometry with default vertices
  for (let index = 0; index < modelGeometry.pointsPerDetection; index++) {
    geometry.vertices.push(new THREE.Vector3())
  }

  // add the UVs to the geometry
  const uvs = []
  for (let index = 0; index < modelGeometry.uvs.length; ++index) {
    const uv = modelGeometry.uvs[index]
    uvs.push(new THREE.Vector2(uv.u, uv.v))
  }

  // add the indices to the geometry to connect the vertices
  const {indices} = modelGeometry
  for (let i = 0; i < indices.length; i += 1) {
    const idxs = indices[i]
    const f = new THREE.Face3(idxs.a, idxs.b, idxs.c)
    f.vertexNormals[0] = new THREE.Vector3()
    f.vertexNormals[1] = new THREE.Vector3()
    f.vertexNormals[2] = new THREE.Vector3()
    geometry.faces.push(f)
    geometry.faceVertexUvs[0].push([uvs[idxs.a], uvs[idxs.b], uvs[idxs.c]])
  }

  const mesh = new THREE.Mesh(geometry, material)

  const show = ({detail}) => {
    const {vertices, normals} = detail

    vertices.forEach((v, index)=> {  // Update the vertices
      mesh.geometry.vertices[index].x = v.x
      mesh.geometry.vertices[index].y = v.y
      mesh.geometry.vertices[index].z = v.z
    })
    mesh.geometry.verticesNeedUpdate = true

    mesh.geometry.faces.forEach((face) => {  // Update the normals.
      face.vertexNormals[0].copy(normals[face.a])
      face.vertexNormals[1].copy(normals[face.b])
      face.vertexNormals[2].copy(normals[face.c])
    })
    mesh.geometry.normalsNeedUpdate = true

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
